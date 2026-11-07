# Contributing to EduMind

Thank you for helping improve EduMind, a bilingual Arabic/English AI learning platform. Contributions should preserve user privacy, accessibility, localization, reliable learning data, and the Supabase ownership model.

## Before you start

For bugs and product ideas, search existing issues first. Do not open a public issue for a suspected vulnerability, leaked secret, authentication bypass, RLS problem, or private-data exposure; follow [SECURITY.md](SECURITY.md) instead.

Use a non-production Supabase project and test credentials locally. Never copy real learner records, private study materials, AI provider keys, service-role keys, access tokens, or production logs into issues, pull requests, screenshots, fixtures, or tests.

## Development workflow

1. Create a focused branch from the latest `main`.
2. Use a descriptive branch name such as `feat/quiz-review`, `fix/upload-timeout`, `security/storage-policy`, or `docs/contributing`.
3. Copy `.env.example` to `.env.local` and use non-production credentials.
4. Install dependencies with `npm ci`.
5. Make the smallest coherent change that solves the problem.
6. Keep UI text localized and preserve Arabic RTL and English LTR behavior.
7. Add or update tests for behavior that can regress, especially authorization, ownership, uploads, rate limits, and database functions.

## Local release gate

Run the complete gate before opening a pull request:

```bash
npm ci
npm run format:check
npm run lint
npm run type-check
npm run test
npm audit
npm run build
```

The GitHub Actions pipeline repeats formatting, linting, type checks, tests, dependency auditing, and the production build. A pull request cannot merge until all required checks pass.

## Pull requests

Use the pull request template and make the title specific. Prefer Conventional Commit-style prefixes such as `feat:`, `fix:`, `security:`, `docs:`, `refactor:`, `test:`, or `chore:`.

Every pull request should explain the user or operational problem, the approach taken, the validation performed, and any required Supabase, Vercel, Redis, AI-provider, or migration configuration. Include screenshots or a short recording for meaningful UI changes. Call out breaking changes, rollout steps, rollback steps, and follow-up work when relevant.

The `main` branch requires a pull request, at least one approval, CODEOWNERS review, resolved review threads, successful CI, linear history, and no force pushes. Reviewers should focus on correctness, user impact, security, accessibility, performance, and maintainability rather than only style.

## Database and security-sensitive changes

Deliver every database change as a new timestamped migration under `supabase/migrations/`. Do not rewrite historical migrations, weaken or disable RLS, expose service-role credentials, or work around an authorization error in client code. Review both read and write ownership checks for every changed route, Server Action, RPC, and Storage path.

For uploads, verify file signatures and resource limits. For AI endpoints, preserve bounded inputs, rate limits, safe provider errors, and protection against prompt or document-content leakage. For roles, use trusted database-backed authorization rather than client-provided role values.

## Review and merge

Keep commits focused and avoid unrelated formatting churn. Respond to review comments, resolve every thread, and rerun the relevant checks after changes. CODEOWNERS review is required for API, Supabase, rate limiting, push, database, and GitHub configuration changes.

Use squash merge for completed pull requests. Delete the merged branch. Release and production configuration changes should be documented in the pull request and verified in staging before deployment.

## License

By contributing, you agree that your contribution is provided under the repository's [MIT License](LICENSE).
