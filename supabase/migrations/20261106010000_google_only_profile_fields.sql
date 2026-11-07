-- ===========================================================================
-- Google-only authentication: profile details collected during onboarding
--
-- Sign-in/sign-up now happen exclusively through Google OAuth. The profile
-- fields below (username and mobile number) are captured on the onboarding
-- screen, alongside the full name already provided by Google.
-- ===========================================================================

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists phone text;

-- Normalise any pre-existing usernames before enforcing the format.
update public.profiles
set username = lower(nullif(trim(username), ''))
where username is not null;

alter table public.profiles drop constraint if exists profiles_username_format_check;
alter table public.profiles add constraint profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9_]{3,30}$');

-- Case-insensitive uniqueness: @Ahmed and @ahmed are the same handle.
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles drop constraint if exists profiles_phone_format_check;
alter table public.profiles add constraint profiles_phone_format_check
  check (phone is null or phone ~ '^\+?[0-9]{8,19}$');
