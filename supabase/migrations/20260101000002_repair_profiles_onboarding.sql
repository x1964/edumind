-- ===========================================================================
-- EduMind profile/onboarding repair migration
--
-- Apply after 20260101000000_init.sql and 20260101000001_storage.sql.
-- This migration is intentionally idempotent so it can repair an existing
-- project where the profile trigger, columns, or RLS policies were incomplete.
-- ===========================================================================

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  education_level text,
  learning_interests text[] not null default '{}',
  learning_goals text[] not null default '{}',
  learning_language text not null default 'ar',
  theme text not null default 'dark',
  notifications jsonb not null default '{"email": false, "study_reminders": true}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists education_level text;
alter table public.profiles add column if not exists learning_interests text[];
alter table public.profiles add column if not exists learning_goals text[];
alter table public.profiles add column if not exists learning_language text;
alter table public.profiles add column if not exists theme text;
alter table public.profiles add column if not exists notifications jsonb;
alter table public.profiles add column if not exists onboarding_completed boolean;
alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;

update public.profiles
set
  full_name = coalesce(full_name, ''),
  learning_interests = coalesce(learning_interests, '{}'),
  learning_goals = coalesce(learning_goals, '{}'),
  learning_language = case when learning_language in ('ar', 'en') then learning_language else 'ar' end,
  theme = case when theme in ('dark', 'light', 'system') then theme else 'dark' end,
  notifications = coalesce(notifications, '{"email": false, "study_reminders": true}'::jsonb),
  onboarding_completed = coalesce(onboarding_completed, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.profiles alter column full_name set default '';
alter table public.profiles alter column full_name set not null;
alter table public.profiles alter column learning_interests set default '{}';
alter table public.profiles alter column learning_interests set not null;
alter table public.profiles alter column learning_goals set default '{}';
alter table public.profiles alter column learning_goals set not null;
alter table public.profiles alter column learning_language set default 'ar';
alter table public.profiles alter column learning_language set not null;
alter table public.profiles alter column theme set default 'dark';
alter table public.profiles alter column theme set not null;
alter table public.profiles alter column notifications set default '{"email": false, "study_reminders": true}'::jsonb;
alter table public.profiles alter column notifications set not null;
alter table public.profiles alter column onboarding_completed set default false;
alter table public.profiles alter column onboarding_completed set not null;
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column created_at set not null;
alter table public.profiles alter column updated_at set default now();
alter table public.profiles alter column updated_at set not null;

alter table public.profiles drop constraint if exists profiles_education_level_check;
alter table public.profiles add constraint profiles_education_level_check
  check (education_level is null or education_level in ('school', 'university', 'independent'));

alter table public.profiles drop constraint if exists profiles_learning_language_check;
alter table public.profiles add constraint profiles_learning_language_check
  check (learning_language in ('ar', 'en'));

alter table public.profiles drop constraint if exists profiles_theme_check;
alter table public.profiles add constraint profiles_theme_check
  check (theme in ('dark', 'light', 'system'));

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Keep profile creation reliable for users created before this trigger existed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Security-definer RPC keeps the final onboarding write atomic and scoped to
-- the authenticated user. The browser never supplies a user id.
create or replace function public.complete_onboarding(
  p_education_level text,
  p_learning_interests text[],
  p_learning_goals text[],
  p_learning_language text,
  p_completed boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_full_name text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_education_level not in ('school', 'university', 'independent') then
    raise exception 'invalid_education_level';
  end if;

  if p_learning_language not in ('ar', 'en') then
    raise exception 'invalid_learning_language';
  end if;

  if coalesce(array_length(p_learning_interests, 1), 0) < 1
     or coalesce(array_length(p_learning_interests, 1), 0) > 8 then
    raise exception 'invalid_learning_interests';
  end if;

  if coalesce(array_length(p_learning_goals, 1), 0) < 1
     or coalesce(array_length(p_learning_goals, 1), 0) > 5 then
    raise exception 'invalid_learning_goals';
  end if;

  select coalesce(full_name, '') into v_full_name
  from public.profiles
  where id = v_user_id;

  insert into public.profiles (
    id,
    full_name,
    education_level,
    learning_interests,
    learning_goals,
    learning_language,
    onboarding_completed
  )
  values (
    v_user_id,
    coalesce(v_full_name, ''),
    p_education_level,
    p_learning_interests,
    p_learning_goals,
    p_learning_language,
    coalesce(p_completed, true)
  )
  on conflict (id) do update set
    education_level = excluded.education_level,
    learning_interests = excluded.learning_interests,
    learning_goals = excluded.learning_goals,
    learning_language = excluded.learning_language,
    onboarding_completed = excluded.onboarding_completed,
    updated_at = now();
end;
$$;

revoke all on function public.complete_onboarding(text, text[], text[], text, boolean) from public;
grant execute on function public.complete_onboarding(text, text[], text[], text, boolean) to authenticated;
