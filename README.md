# EduMind

[![CI/CD Pipeline](https://github.com/x1964/edumind/actions/workflows/ci.yml/badge.svg)](https://github.com/x1964/edumind/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live demo](https://img.shields.io/badge/Live%20demo-edumindapp.vercel.app-black?logo=vercel)](https://edumindapp.vercel.app)

EduMind is a bilingual Arabic/English AI-assisted learning platform built with Next.js 16, Supabase, and any OpenAI-compatible Chat Completions provider.

It ships with a public marketing landing page and a fully authenticated product: onboarding, a materials library, an AI tutor, summaries, quizzes, mind maps, a study planner, real progress analytics and account settings.

> Arabic is the default language. The UI switches between Arabic (RTL) and English (LTR), and the preference is persisted in the user profile.

**Live demo:** [edumindapp.vercel.app](https://edumindapp.vercel.app) · **License:** [MIT](LICENSE) · **Security:** [SECURITY.md](SECURITY.md)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
  - [Migrations](#migrations)
  - [Storage](#storage)
  - [Auth redirect URLs](#auth-redirect-urls)
- [AI provider](#ai-provider)
- [Data model and security](#data-model-and-security)
- [Internationalization](#internationalization)
- [Installable app (PWA)](#installable-app-pwa)
- [Scripts and quality checks](#scripts-and-quality-checks)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

| Area           | What it does                                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Landing page   | Branded, responsive Arabic/English marketing page with product previews and SEO metadata.                                               |
| Authentication | Email/password signup, login, email confirmation, password reset and optional Google OAuth. Sessions are refreshed by `src/proxy.ts`.   |
| Onboarding     | Education level, interests, goals and learning language. Saved to `profiles`.                                                           |
| Materials      | Client-side text extraction from PDF/DOCX/TXT, server-side validation, private storage, signed file access. Max 20 MB.                  |
| AI Tutor       | Threaded chat grounded in the user's material content, with streaming responses and citations/pages where available.                    |
| Summaries      | Generated in several study styles, editable, deletable and tracked as real study activity.                                              |
| Quizzes        | Generated questions, server-side scoring through a `SECURITY DEFINER` RPC, immutable attempts and per-quiz history.                     |
| Mind maps      | Generated nodes/edges rendered with React Flow, editable positions and connections, saved back to the database.                         |
| Study planner  | Create/edit/complete/delete tasks with priorities, due dates and estimated minutes.                                                     |
| Progress       | Recharts analytics computed exclusively from the user's rows (study sessions, quiz attempts, materials).                                |
| Web Analytics  | Vercel Web Analytics tracks aggregate page views, visitors, routes and traffic sources after it is enabled for the Vercel project.      |
| Settings       | Profile, avatar URL, education, interests, goals, language, theme preference, notifications, password reset and bulk material deletion. |
| PWA            | Installable on Android/desktop/iOS, standalone launch, shortcuts, offline fallback page and an in-app update prompt.                    |
| UX states      | Route-level `loading.tsx`, `error.tsx`, `not-found.tsx`, empty states and explicit setup/configuration notices.                         |

There are no seeded statistics and no fabricated AI output. When the AI provider is not configured, AI features render a clear "AI is not configured" state instead of inventing answers.

---

## Tech stack

- **Framework:** Next.js 16.4 (App Router, Cache Components, Partial Prefetching, Turbopack)
- **UI:** React 19, Tailwind CSS 4, Base UI, Lucide icons, Sonner toasts
- **Auth & data:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **AI:** AI SDK UI streaming (`ai`, `@ai-sdk/react`) with a custom OpenAI-compatible `fetch` adapter
- **Documents:** PDF.js, Mammoth (DOCX), native text reading (TXT)
- **Maps / charts:** `@xyflow/react`, Recharts
- **Validation:** Zod

No provider SDK is bundled. No service-role key is used in the browser.

---

## Project structure

```text
src/
  app/
    page.tsx                   Public marketing page at /
    login, signup, ...        Auth pages
    onboarding/               Post-signup onboarding
    dashboard/                Authenticated app shell
      materials/              Library and material detail
      tutor/                  AI tutor workspace
      summaries/              Summary list and editor
      quizzes/                Quiz list, runner and results
      mind-maps/              Mind-map list and editor
      study-plan/             Planner
      progress/               Real-data analytics
      settings/               Account and privacy settings
    api/                      Upload, signed file, AI streaming, search, study sessions
    manifest.ts               Web app manifest (installability, shortcuts, icons)
  components/                 Feature UI and shared primitives
    pwa/                      Service-worker registration, install prompt and update banner
  lib/
    actions/                  Server Actions (auth, materials, AI, planner, settings, ...)
    ai/                       Provider adapter, prompts, schemas, services
    documents/                Shared text utilities, client extraction, server validation
    i18n/                     Dictionaries and server language resolution
    supabase/                 Browser/server clients, auth helpers, config guard
    data/                     Server-side dashboard queries
  proxy.ts                    Supabase session refresh and route protection
public/
  sw.js                       Service worker (precache, offline fallback, update flow)
  offline.html                Branded offline page served by the service worker
  favicon/                    App icons, including maskable and Apple touch variants
supabase/
  schema.sql                  Complete database in one idempotent file
  migrations/                 SQL schema, RLS, RPCs and storage policies
```

---

## Local setup

### Prerequisites

- Node.js 20+
- npm
- A Supabase project (free tier is enough)
- Optional: an OpenAI-compatible AI API key

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase and AI values

# 3. Apply the database migrations
#    Either use the Supabase CLI (recommended) or the SQL editor.
supabase link --project-ref <your-project-ref>
supabase db push

# 4. Start the app
npm run dev
```

Open <http://localhost:3000>. The landing page is public; use **Sign up** to create an account.

The app degrades gracefully when Supabase is not configured: auth and dashboard routes show a setup notice or redirect to login with a configuration message rather than crashing.

---

## Environment variables

Copy `.env.example` to `.env.local`. Only `NEXT_PUBLIC_*` variables reach the browser.

| Variable                           | Required    | Purpose                                                                                                                                          |
| ---------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`         | Yes         | Supabase project URL.                                                                                                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | Yes         | Supabase anon/public key. Safe for browser use with RLS. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is also accepted as an alias for newer projects. |
| `NEXT_PUBLIC_SITE_URL`             | Recommended | Absolute origin used for email confirmation and password-reset redirects. Defaults to the request origin.                                        |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | No          | Set to `true` to show the Google sign-in button. The provider must also be enabled in Supabase.                                                  |
| `AI_PROVIDER`                      | No          | Informational label. The adapter speaks OpenAI-compatible Chat Completions.                                                                      |
| `AI_BASE_URL`                      | For AI      | Base URL ending in `/v1` (for example `https://api.openai.com/v1`).                                                                              |
| `AI_API_KEY`                       | For AI      | Server-only API key. Never exposed to the client.                                                                                                |
| `AI_MODEL`                         | For AI      | Model name accepted by the provider.                                                                                                             |
| `AI_MODEL_FALLBACKS`               | No          | Comma-separated model names tried when the primary model is rate-limited or unavailable (429 / 5xx).                                             |
| `AI_MAX_OUTPUT_TOKENS`             | No          | Maximum completion tokens. Defaults to `2048` (`4096` recommended for thinking models).                                                          |
| `AI_TIMEOUT_MS`                    | No          | Per-request timeout in milliseconds. Defaults to `90000`.                                                                                        |

**Never** put a Supabase service-role key in any `NEXT_PUBLIC_*` variable.

---

## Supabase setup

### One-file database (recommended)

`supabase/schema.sql` is the complete database for the whole app in a single,
idempotent file: every table, index, constraint, RLS policy, trigger, RPC and
the storage bucket. Paste it into **Supabase Dashboard → SQL Editor → Run** on a
new or existing project. Running it again is safe: it repairs what is missing
and never duplicates data.

It can also be applied from a terminal:

```bash
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
```

### Migrations

The same schema is also split into ordered migrations for the Supabase CLI:

1. `supabase/migrations/20260101000000_init.sql`
2. `supabase/migrations/20260101000001_storage.sql`
3. `supabase/migrations/20260101000002_repair_profiles_onboarding.sql`

Apply them with the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste each file into the Supabase SQL editor **in order**. A fresh project
only needs `supabase/schema.sql`; the numbered migrations exist for projects
already tracking migration history.

The third migration is a safe repair migration for existing projects. It
ensures the `profiles` columns, trigger, RLS policies, and the
`complete_onboarding` security-definer RPC exist before the final onboarding
save is attempted.

The schema creates:

- `profiles` with an `auth.users` insert trigger and onboarding repair backfill
- `materials` and `material_chunks`
- `tutor_threads` and `tutor_messages`
- `summaries`
- `quizzes`, `quiz_questions`, `quiz_question_keys`, `quiz_attempts`
- `study_tasks` and `study_sessions`
- `mind_maps`
- `flashcards`
- Row Level Security policies for every user-owned table
- `complete_onboarding`, a `SECURITY DEFINER` RPC that saves onboarding atomically
- `submit_quiz_attempt`, a `SECURITY DEFINER` RPC that scores answers and writes immutable attempts
- `updated_at` triggers

It also creates the private `materials` storage bucket and per-user storage policies.

### Storage

- Bucket name: `materials`
- Visibility: **private**
- Size limit: **20 MB**
- Allowed MIME types: PDF, DOCX, plain text
- Object path: `materials/<user_id>/<uuid>.<ext>`

Files are never exposed as public URLs. The app creates short-lived signed URLs through an authenticated route and verifies ownership first. Storage policies also restrict every operation to the user's own folder (`(storage.foldername(name))[1] = auth.uid()::text`).

### Auth redirect URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL:** your production URL (for local work use `http://localhost:3000`)
- **Redirect URLs:** add
  - `http://localhost:3000/auth/callback**`
  - `https://your-domain.com/auth/callback**`

Password reset and email confirmation links are routed through `/auth/callback`, which exchanges the code for a session before redirecting to the requested page.

To enable Google sign-in:

1. Enable the Google provider in **Authentication → Providers**.
2. Add your Google OAuth credentials.
3. Set `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true`.

---

## AI provider

EduMind uses a small adapter in `src/lib/ai/provider.ts` that calls any OpenAI-compatible `POST /chat/completions` endpoint. Switching providers is only an environment change:

| Provider      | `AI_BASE_URL`                                             | Example `AI_MODEL`        |
| ------------- | --------------------------------------------------------- | ------------------------- |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-3.6-flash`        |
| OpenAI        | `https://api.openai.com/v1`                               | `gpt-4o-mini`             |
| OpenRouter    | `https://openrouter.ai/api/v1`                            | `openai/gpt-4o-mini`      |
| Groq          | `https://api.groq.com/openai/v1`                          | `llama-3.3-70b-versatile` |
| Local Ollama  | `http://localhost:11434/v1`                               | `llama3.1`                |

Notes:

- `AI_BASE_URL`, `AI_API_KEY` and `AI_MODEL` must all be present; otherwise `isAiConfigured()` returns false.
- `AI_MODEL_FALLBACKS` adds resilience: models are tried in order when the previous one returns 408 / 429 / 5xx or is unreachable.
- Thinking models (Gemini Flash) need a large `AI_MAX_OUTPUT_TOKENS` (4096) or they can return an empty body with `finish_reason: length`.
- The tutor streams tokens through an AI SDK UI message stream at `/api/ai/tutor`.
- Summaries, quizzes, mind maps and flashcards use structured JSON output validated with Zod before anything is saved.
- Prompts are grounded in chunks retrieved from the selected material. Provider errors are surfaced as friendly messages; prompt/document content is not logged.
- The adapter never fabricates a fallback answer when the provider is missing or fails.

---

## Data model and security

Security is enforced in depth:

- **RLS on every user table.** Users can only select/insert/update/delete rows where `user_id = auth.uid()` (or `id = auth.uid()` for profiles).
- **Authorization in Server Components, Server Actions and Route Handlers.** `getCurrentUser()` uses `supabase.auth.getUser()`, which validates the JWT with Supabase Auth. `getSession()` alone is never trusted for authorization.
- **No service-role key in the browser.** The browser client only receives the anon key.
- **Server-side ownership checks** before file access, deletion and AI generation.
- **Zod validation** on every Server Action input and on AI structured output.
- **Rate limiting** on AI endpoints and authentication-sensitive actions.
- **Safe redirects** via a helper that only allows internal paths.
- **Quiz answers are never sent to the client.** Correct answers live in `quiz_question_keys` (RLS enabled, no SELECT policy). Scoring happens inside `submit_quiz_attempt`; attempts cannot be edited by clients.
- **File validation:** extension, MIME type, magic bytes, size (≤ 20 MB) and extracted text all re-checked on the server.
- **Private storage + short-lived signed URLs.** No public file URLs.
- **No technical error leakage.** Route-level error boundaries show localized messages.

---

## Internationalization

- Arabic is the default. Dictionaries live in `src/lib/i18n/` (`app.ts` for the product, landing dictionary for the marketing page).
- Root `<html lang="ar" dir="rtl">` is static; an inline bootstrap script applies the saved language before paint to avoid a flash.
- The `edumind_lang` cookie drives server-rendered dictionaries.
- The profile stores `learning_language` (`ar` / `en`) and is synced on login, onboarding and settings updates.
- Layouts/pages that depend on cookies or auth declare `export const instant = false` so Cache Components can render them dynamically.

---

## Installable app (PWA)

EduMind ships as a Progressive Web App, so it can be installed and launched like a native app until a mobile build exists.

- **Manifest:** `src/app/manifest.ts` → `/manifest.webmanifest` with `display: standalone`, `start_url: /dashboard`, RTL Arabic defaults, app shortcuts and both `any` and `maskable` icons.
- **Icons:** `public/favicon/` contains `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png` and `apple-touch-icon.png`. Maskable variants keep the logo inside the safe zone.
- **Service worker:** `public/sw.js` precaches the offline page and icons, uses cache-first for hashed static assets in production (network-first in development), network-first for public pages, and never intercepts `/api/*`, `/auth/*`, Supabase or cross-origin requests.
- **Registration:** `src/components/pwa/pwa-register.tsx` registers `/sw.js?env=dev|prod`, detects waiting updates and shows a small banner with an explicit **Update** action — the page never reloads under the user.
- **Install UI:** `src/components/pwa/install-app.tsx` captures `beforeinstallprompt` (stored early by an inline script in the root layout) and adds an install entry to the account menu plus an install card in **Settings**, including the Safari "Add to Home Screen" steps for iPhone/iPad.
- **Offline:** `public/offline.html` is served when a navigation fails without network.

Installability requires **HTTPS** or **localhost**. Test the real flow with a production build:

```bash
npm run build
npm run start          # then open http://localhost:3000
```

To verify: Chrome DevTools → Application → Manifest / Service Workers, and use "Install app" in the address bar. Changing `VERSION` in `public/sw.js` invalidates old caches.

---

## Scripts and quality checks

```bash
npm run dev            # Start the development server
npm run build          # Production build (Turbopack + TypeScript)
npm run start          # Serve the production build
npm run lint           # ESLint with the project configuration
npm run type-check     # Next.js route type generation + TypeScript
npm run format:check   # Prettier validation
```

The repository currently has no automated test suite. Use the checks above plus the manual test plan below.

---

## Testing

### Automated checks

Run all three before shipping:

```bash
npm run type-check
npm run lint
npx prettier --check .
npm run build
```

### Manual functional checklist

Use a real Supabase project and, if available, a real AI key.

1. **Auth**
   - Sign up, confirm the email, log in, log out.
   - Request a password reset and complete the reset flow.
   - Verify an unauthenticated visit to `/dashboard` redirects to login.
2. **Onboarding**
   - Complete onboarding; refresh and verify answers persisted.
   - Switch language; verify RTL/LTR and dictionary changes.
3. **Materials**
   - Upload PDF, DOCX and TXT files under 20 MB.
   - Confirm rejected files (wrong type, oversized, corrupt) show a safe error.
   - Open a material, download via the signed URL route, delete it.
4. **AI features** (requires AI env vars)
   - Ask the tutor a question grounded in an uploaded file; verify streaming and persistence.
   - Generate a summary, edit and delete it.
   - Generate a quiz, complete it, verify the server-computed score and history.
   - Generate a mind map, move nodes, save and reload.
5. **Planner and progress**
   - Create, edit, complete and delete tasks.
   - Verify progress charts and counts change only from real activity.
6. **Settings**
   - Update profile fields, language and notification toggles.
   - Request a password reset link.
   - Delete all materials and confirm the library is empty.
7. **Unconfigured states**
   - Remove AI env vars: AI pages must show the setup notice, not fake content.
   - Remove Supabase env vars: the app must show a setup notice instead of crashing.

---

## Deployment

### Vercel (recommended)

1. Push the repository to your Git provider and import it into Vercel.
2. Add the environment variables from `.env.example` in **Project Settings → Environment Variables**.
3. Set `NEXT_PUBLIC_SITE_URL` to the production origin.
4. Add the production `/auth/callback**` URL in Supabase Auth settings.
5. Deploy. The default build command is `npm run build`.

Web Analytics is already included in the root layout through `@vercel/analytics/next`. Enable **Analytics** in the Vercel project dashboard to collect aggregate visitors, page views, routes, referrers, devices and browsers. Analytics does not identify users by name or expose account data.

### Other platforms

The app is a standard Next.js 16 App Router deployment:

```bash
npm ci
npm run build
npm run start
```

Requirements:

- Node.js 20+
- Serverless or Node runtime that supports streaming responses (used by the AI tutor)
- Outbound HTTPS access to Supabase and the AI provider

---

## Troubleshooting

| Symptom                                     | Likely cause                                                                                     | Fix                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Login/dashboard shows "Setup required"      | Supabase env vars missing or empty.                                                              | Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then restart.                                             |
| Every table request returns empty or 403    | Migrations/RLS not applied, or user has no profile row.                                          | Run both migrations; the auth trigger creates profiles for new users. Existing users can complete onboarding to upsert theirs. |
| AI pages show "AI is not configured"        | `AI_BASE_URL`, `AI_API_KEY` or `AI_MODEL` is missing.                                            | Add all three and restart the server.                                                                                          |
| Password reset link lands on the wrong host | `NEXT_PUBLIC_SITE_URL` or Supabase redirect URLs are wrong.                                      | Set the site URL and add `/auth/callback**` to Supabase redirect URLs.                                                         |
| Upload rejected                             | File is over 20 MB, has a disallowed extension, or its content does not match the declared type. | Use PDF, DOCX or TXT under 20 MB.                                                                                              |
| PDF extraction fails in the browser         | The PDF is encrypted/corrupt or uses unsupported compression.                                    | Try another file; server-side validation will also reject it safely.                                                           |
| Google button missing                       | `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` is false or the provider is not enabled.                      | Set it to `true` and configure Google in Supabase.                                                                             |
