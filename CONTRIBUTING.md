# Contributing to EduMind

Thank you for helping improve EduMind, a bilingual Arabic/English learning platform. Contributions should preserve user privacy, accessibility, localization, and the existing Supabase ownership model.

## Development workflow

1. Create a focused branch from `main`.
2. Copy `.env.example` to `.env.local` and use non-production credentials.
3. Install with `npm ci`.
4. Make the smallest isolated change that solves the problem.
5. Run the full local checks before opening a pull request:

```bash
npm run type-check
npm run lint
npm run test
npx prettier --check .
npm audit
npm run build
```

## Pull requests

Describe the user or operational problem, the implementation, test evidence, and any required Supabase/Vercel configuration. Include screenshots or a short recording for meaningful UI changes. Never include credentials, service-role keys, private document contents, or real user data.

Database changes must be delivered as a new timestamped migration. Do not rewrite historical migrations and do not disable RLS to work around a permission error.

## Security

Do not report suspected vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md) for confidential reporting.
