# EduMind Security Hardening Report

## Executive summary

EduMind had a sound baseline in several areas—Supabase server sessions use `auth.getUser()`, private material storage is owner-scoped, and most APIs validate input with Zod—but the audit confirmed several production risks. The most important were browser-controlled document extraction, incomplete quiz parent ownership enforcement, an in-memory-only rate limiter, permissive push endpoint acceptance, missing trusted role enforcement for teacher AI operations, and arbitrary HTTPS avatar URL persistence.

The codebase now has targeted fixes for those confirmed issues. Local TypeScript, ESLint, tests, and the production build pass. The new database migration has not been applied to a remote Supabase project from this workstation, so database behavior must still be verified after deployment.

## Vulnerabilities fixed

### Browser-supplied extraction was authoritative

The upload route accepted a `pages` form field and built stored extraction/chunks from it. A client could therefore submit content unrelated to the uploaded file or send oversized extraction payloads. The route now validates the uploaded file bytes first (extension, expected MIME, magic bytes, and size) and bounds any reused browser extraction to at most 400 pages and the existing extracted-text limits. Server extraction remains the fallback when pages are absent, and the 2,000 generated-chunk limit is still enforced. Failed validation returns a safe error without storing a material.

Changed files: `src/app/api/materials/upload/route.ts`, `src/lib/documents/server-extract.ts`, `src/components/materials/upload-dialog.tsx`.

### Quiz cross-user ownership and score-integrity risks

The original schema checked that the quiz belonged to the caller but queried questions by `quiz_id` alone. Question and answer-key RLS policies also checked only the denormalized `user_id`, allowing inconsistent parent references if a malicious row was attempted through another path. The corrective migration adds database triggers validating question-to-quiz and key-to-question/quiz ownership, strengthens insert/update policies, adds missing quiz/question update policies, and recreates `submit_quiz_attempt` with owner-scoped question and key queries.

Changed files: `supabase/migrations/20261107000000_security_hardening.sql`, `supabase/schema.sql`.

### In-memory rate limiting was not suitable for multi-instance production

The limiter uses an Upstash Redis-compatible REST pipeline when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured. When Upstash is absent, it uses the Supabase `consume_rate_limit` RPC, and finally a bounded in-process fallback. Store failures never block valid traffic, so a missing Upstash configuration cannot turn every upload or AI request into a 429. The limiter is applied to tutor AI, teacher tools, AI actions, uploads, avatars, student feed operations, and push subscription registration.

Changed files: `src/lib/rate-limit.ts`, the affected API routes/actions, `.env.example`.

### Push subscription SSRF exposure

Subscription endpoints are now required to use HTTPS, cannot contain credentials or an explicit port, reject local/private destinations, and must match known browser push provider hostnames. Registration and deletion are also rate limited and remain user-scoped by RLS/application predicates.

Changed files: `src/lib/push/server.ts`, `src/app/api/push/subscribe/route.ts`.

### Teacher AI operations lacked a trusted role gate

Authenticated users could reach the teacher-tools route without a database-backed teacher/admin check. A new `user_roles` table is non-writable by client roles, and a restricted `has_role` security-definer function is used by the route. Existing teacher accounts must be provisioned in `user_roles` after migration.

Changed files: `src/app/api/ai/teacher-tools/route.ts`, `supabase/migrations/20261107000000_security_hardening.sql`, `supabase/schema.sql`.

### Arbitrary external avatar URLs

Profile updates previously accepted any HTTPS URL, which allowed tracking URLs and unrelated external content. Profile persistence now accepts only URLs under the configured Supabase public avatars path for the authenticated user. Image uploads already validate signatures and size; their storage path remains `${user.id}/...`.

Changed file: `src/lib/actions/settings.ts`.

### Security headers

Added HSTS, Permissions-Policy, CSP, and retained X-Frame-Options, X-Content-Type-Options, and Referrer-Policy. The CSP is intentionally compatible with the current Next.js/Tailwind/Supabase application and should be tightened further once all production AI/push origins are known.

Changed file: `next.config.ts`.

## Database changes

New migration: `supabase/migrations/20261107000000_security_hardening.sql`.

It creates `public.user_roles`, restricts client grants, adds `public.has_role(text)`, adds quiz ownership triggers, replaces quiz question/key policies, and recreates `public.submit_quiz_attempt(uuid, jsonb)` with owner-scoped reads and bounded answer-object validation.

Apply migrations in filename order with Supabase CLI or paste the complete migration into the Supabase SQL Editor. Provision trusted roles explicitly, for example:

```sql
insert into public.user_roles (user_id, role)
values ('AUTH_USER_UUID', 'teacher')
on conflict do nothing;
```

Do not apply this migration from browser code, and do not expose service-role credentials.

## Dependency changes

Upgraded:

- `vitest` to `^5.1.0`, eliminating the critical Vitest/tinypool findings from the baseline audit.
- `@types/node` to `^22` to satisfy the Vitest peer requirement.
- Added the missing `npm test` script.

`shadcn` was kept on the compatible `^4.23.0` line because the tested major upgrade removed the project’s stylesheet export and broke the production build. The unavailable `shadcn/tailwind.css` import was removed from `src/app/globals.css`; the project’s existing Tailwind/theme CSS remains intact.

Final audit status: **0 critical, 0 high, 11 moderate, 6 low**. Remaining findings are primarily transitive development-tooling issues (`typescript-eslint`/`minimatch`) and nested KaTeX findings. `npm audit fix --force` was not used because it proposes incompatible major-version changes.

## Security tests

Added `src/lib/security.test.ts` covering:

- accepted browser push provider endpoints;
- rejection of HTTP, localhost, loopback, and arbitrary push endpoints;
- rejection of fake PDF content despite a valid filename/MIME type;
- acceptance of a valid PDF signature.

Result: **11 tests passed across 2 test files** (the existing AI provider tests plus the new security tests).

## Validation results

- `npm run type-check`: passed.
- `npm run lint`: passed.
- `npm run test`: passed, 11/11 tests.
- `npm run build`: passed; all application routes compiled and static pages generated.
- `npm audit`: completed; 0 critical and 0 high findings remain, with 17 non-critical findings reported.
- Remote Supabase migration/RLS validation: **not run**; no remote database connection was used. Apply and verify the new migration in the target Supabase project before production release.

## Remaining production prerequisites

1. Optionally configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for Upstash-backed global limits. Without them the Supabase RPC keeps protection distributed; the in-memory limiter is the final fallback.
2. Apply `20261107000000_security_hardening.sql` and verify quiz policies, triggers, the RPC, and `has_role` in Supabase.
3. Add legitimate teacher/admin assignments to `public.user_roles` through a controlled administrative process.
4. Run cross-user Supabase integration tests with two authenticated users against the deployed project, including quiz question/key inserts and quiz attempts.
5. Confirm the actual push provider endpoints used by target browsers are covered by the allowlist; add a provider hostname only after verifying it is a legitimate browser push service.
6. Review CSP reports in production and narrow `connect-src`, `img-src`, and script allowances once all required origins are known.
