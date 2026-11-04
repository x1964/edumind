# Push notifications

EduMind can notify a student on every browser/device that they have explicitly subscribed when a new study task is created for their account.

## 1. Generate VAPID keys

Run this once locally:

```bash
npx web-push generate-vapid-keys
```

Add the generated values to `.env.local` for local testing and to the Vercel project environment variables for production:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:security@edumindapp.vercel.app

# Server-only values for the hourly task reminder cron.
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...
```

The private key must never use the `NEXT_PUBLIC_` prefix and must never be committed.
`SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` are server-only as well.

## 2. Apply the database migration

Run the migration with the Supabase CLI:

```bash
supabase db push
```

Or run `supabase/migrations/20260101000003_push_subscriptions.sql` in the Supabase SQL Editor. The `push_subscriptions` table is protected by RLS and stores only the browser endpoint and encrypted Web Push key material needed for delivery.

## 3. Enable it in the app

A signed-in student opens **Settings → Push notifications → Enable notifications**. The browser asks for permission, then the subscription is saved for that user and device. Disabling notifications removes that device subscription.

The service worker displays the notification and opens the study plan when the student taps it. Expired subscriptions are removed automatically when a delivery returns HTTP 404 or 410.

## 4. Hourly task reminders

Vercel runs `/api/push/reminders` every hour from `vercel.json`. It checks incomplete tasks due within the next hour and sends one reminder per task/due-date window. The `push_task_reminders` migration stores an idempotency claim so retries or overlapping cron runs do not send duplicates.

For local testing, call the endpoint with the configured secret:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/push/reminders
```

Apply migrations in filename order, including `20260101000004_push_task_reminders.sql`. In Vercel, add `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` as encrypted environment variables for the same deployment environment. Never put the service-role key in a `NEXT_PUBLIC_` variable.

## Browser notes

- Push requires HTTPS in production; `localhost` is allowed for local development.
- The browser permission is per device and per browser profile, so students can enable it on more than one device.
- iOS/iPadOS requires the site to be installed to the Home Screen before Web Push is available.
- If the VAPID variables or the migration are missing, the rest of EduMind continues to work and the Push card reports that setup is incomplete.
