# EduMind Security Guide

This document is the security baseline for the EduMind application. It is intended for maintainers, reviewers, and deployment operators. It describes the controls that are implemented in this repository and the checks that must be completed in the Supabase and Vercel consoles.

## Security principles

EduMind follows least privilege, defense in depth, server-side authorization, data minimization, and fail-closed behavior. Browser input, client state, route visibility, and Supabase client filters are never treated as the only authorization boundary.

## Secrets and environment variables

- Never commit `.env.local`, production credentials, service-role keys, provider API keys, access tokens, or database connection strings.
- Only values prefixed with `NEXT_PUBLIC_` may be exposed to the browser. Keep `AI_API_KEY` and every server-side provider secret unprefixed.
- Use `.env.example` as the documented template and configure production values in Vercel Environment Variables.
- Use separate Supabase projects or credentials for local, preview, and production environments where possible.
- Rotate a secret immediately if it appears in Git history, logs, a screenshot, or a client bundle. Removing the file is not sufficient; the leaked credential must be revoked.

## Authentication and authorization

- Protected routes are guarded by `src/proxy.ts`, and server/API code must independently verify the authenticated user with Supabase `auth.getUser()`.
- Do not replace `getUser()` with `getSession()` for authorization decisions.
- Every user-owned query and mutation must scope records to the authenticated `user.id` and must be backed by Supabase Row Level Security (RLS).
- Redirect targets must remain relative, same-origin paths. Do not accept arbitrary external URLs in `next` parameters.
- Server actions and route handlers must validate input with Zod or an equivalent server-side schema before any database, storage, or provider call.

## Supabase and RLS checklist

Before production release, verify in the Supabase SQL Editor or Table Editor that:

1. RLS is enabled on every user-owned table, including materials, material chunks, tutor threads/messages, tasks, summaries, quizzes, mind maps, and profiles.
2. SELECT, INSERT, UPDATE, and DELETE policies require ownership through `auth.uid()`.
3. Storage policies restrict the private `materials` bucket to paths beginning with the authenticated user's ID.
4. The service-role key is never placed in a `NEXT_PUBLIC_` variable and is not imported into client code.
5. Anonymous and unauthenticated execution is revoked for privileged functions; grants are limited to the roles that need them.
6. New migrations are additive and idempotent. Apply them in filename order and verify the resulting policies after deployment.

This repository does not claim that remote Supabase changes have been applied. The deployment operator must run and verify migrations in the target project.

## File uploads and private materials

- Accepted files are validated by extension, size, and content signature on the server.
- The upload limit is 50 MB; empty, oversized, malformed, and unsupported files must be rejected.
- Storage paths are scoped to the authenticated user ID and use generated names rather than trusting the original filename.
- Material objects remain private. Use authenticated download handlers or signed URLs; never publish a permanent public URL for private study material.
- On database or chunk-processing failure, remove the uploaded object and material row where possible.
- Do not log file contents, extracted text, questions, answers, or tokens.

## AI and abuse controls

- Provider API keys stay server-side and are never returned in responses.
- Tutor and upload endpoints apply per-user rate limits and bounded request sizes.
- Validate thread ownership and material ownership before loading context or writing messages.
- Treat uploaded documents and user messages as untrusted content. Do not allow them to override the system instruction or authorize tools.
- Provider errors should return safe, localized messages without exposing upstream URLs, credentials, prompts, or stack traces.

## Browser and transport protections

The application currently sends baseline headers from `next.config.ts`, including `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`. Production must also be served over HTTPS by the hosting platform. Review CSP compatibility before enabling a strict Content-Security-Policy because analytics, authentication, AI provider requests, and any worker assets must be explicitly allow-listed.

Recommended Vercel checks:

- Confirm the production domain uses HTTPS and redirects HTTP to HTTPS.
- Confirm preview and production environment variables are not mixed.
- Review response headers after each security-header change.
- Keep dependencies and the lockfile updated through reviewed pull requests.

## Secure development checklist

Run locally before opening a pull request:

```bash
npm ci
npm run lint
npm run type-check
npm run build
```

Review changed code for authorization on both read and write paths, unsafe redirects, accidental secret exposure, unbounded request bodies, public storage URLs, and logs containing personal or educational data.

## Incident response

1. Disable or rotate the affected credential immediately in its provider console.
2. Preserve the minimum useful evidence: timestamp, deployment ID, route, status code, and request correlation data. Do not preserve raw user content unless required and authorized.
3. Check Supabase Auth logs, Storage logs, database audit data, Vercel deployment logs, and provider usage for the affected time window.
4. Revoke sessions or tokens when account compromise is suspected.
5. Patch the cause, deploy through the normal review path, and verify the affected control with a regression check.
6. Notify affected users and maintainers according to the applicable legal and contractual requirements.

## Reporting a vulnerability

Do not open a public issue containing exploit details or secrets. Report privately to the project maintainers with the affected route or component, reproduction steps, impact, and a safe contact method. Allow time for triage and remediation before public disclosure.

## Release sign-off

A release is security-ready only when local checks pass, production secrets are configured in Vercel, Supabase migrations and RLS are verified in the target project, private storage access is tested with two different users, and no sensitive values appear in the built client assets or deployment logs.
