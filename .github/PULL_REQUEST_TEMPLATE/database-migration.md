## Database change

### Purpose

<!-- What data, authorization, or application behavior requires this migration? -->

### Migration

- **File:** `supabase/migrations/`
- **Reversible or rollback plan:**
- **Staging verification:**

## Security review

- [ ] This is a new timestamped migration; historical migrations were not rewritten.
- [ ] RLS remains enabled on user-owned tables and Storage buckets.
- [ ] Read, insert, update, and delete policies were reviewed.
- [ ] Cross-user access was considered and tested where possible.
- [ ] Security-definer functions use a safe `search_path` and restricted grants.
- [ ] Client roles cannot assign trusted roles or bypass ownership checks.
- [ ] No service-role credentials or private data are included.

## Application impact

- [ ] Related Server Actions, API routes, RPC calls, and types were updated.
- [ ] Required environment or deployment changes are documented.
- [ ] Tests and production build pass.

## Verification evidence

<!-- Include SQL checks, staging results, and rollback notes. Redact identifiers and secrets. -->
