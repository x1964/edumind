-- ===========================================================================
-- EduMind — core database schema baseline
--
-- Incremental features are maintained in timestamped migrations. The Student
-- Feed schema and storage policies are in
-- supabase/migrations/20261104000000_student_feed.sql and must be applied
-- after this baseline when provisioning a new project.
-- This file remains idempotent for the core EduMind schema and is safe to run on:
--
--   • a brand new Supabase project              → creates the core schema
--   • an existing project made by the migrations → repairs / completes the core schema
--   • the same project again                     → no-op
--
-- How to apply
--   Supabase CLI :  supabase db push          (uses supabase/migrations/)
--   Dashboard    :  SQL Editor → run this file, then apply subsequent migrations
--   psql         :  psql "$DATABASE_URL" -f supabase/schema.sql
--
-- Security model
--   Tables use Row Level Security. Private learning data is owner-scoped;
--   Student Feed content is readable to authenticated students, while writes
--   and deletions are owner-scoped. The browser uses only the public anon key;
--   the service-role key must never be exposed to the client.
-- ===========================================================================

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Keeps `updated_at` accurate on every UPDATE.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Marks an account as onboarded as soon as the required answers exist.
-- Used by the repair backfill at the end of this file.
create or replace function public.profile_answers_complete(
  p_education_level text,
  p_learning_interests text[],
  p_learning_goals text[]
)
returns boolean
language sql
immutable
as $$
  select coalesce(p_education_level, '') <> ''
     and coalesce(array_length(p_learning_interests, 1), 0) > 0
     and coalesce(array_length(p_learning_goals, 1), 0) > 0;
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user (created by the trigger below)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  username text,
  phone text,
  avatar_url text,
  education_level text check (
    education_level is null
    or education_level in ('school', 'university', 'independent')
  ),
  learning_interests text[] not null default '{}',
  learning_goals text[] not null default '{}',
  learning_language text not null default 'ar' check (learning_language in ('ar', 'en')),
  theme text not null default 'light' check (theme in ('dark', 'light', 'system')),
  notifications jsonb not null default '{"email": false, "study_reminders": true}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Repair columns for projects created before the onboarding repair migration.
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists phone text;
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
  learning_language = case
    when learning_language in ('ar', 'en') then learning_language
    else 'ar'
  end,
  theme = case
    when theme in ('dark', 'light', 'system') then theme
    else 'light'
  end,
  notifications = coalesce(
    notifications,
    '{"email": false, "study_reminders": true}'::jsonb
  ),
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
alter table public.profiles alter column theme set default 'light';
alter table public.profiles alter column theme set not null;
alter table public.profiles alter column notifications
  set default '{"email": false, "study_reminders": true}'::jsonb;
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

alter table public.profiles drop constraint if exists profiles_username_format_check;
alter table public.profiles add constraint profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9_]{3,30}$');

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles drop constraint if exists profiles_phone_format_check;
alter table public.profiles add constraint profiles_phone_format_check
  check (phone is null or phone ~ '^\+?[0-9]{8,19}$');

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

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (auth.uid() = id);

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Every new auth user gets a profile row automatically.
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

-- Final onboarding save. Atomic, Security Definer, scoped to auth.uid().
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

-- ---------------------------------------------------------------------------
-- materials — one row per uploaded study file (file lives in storage)
-- ---------------------------------------------------------------------------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_type text not null check (file_type in ('pdf', 'docx', 'txt')),
  mime_type text not null,
  file_size integer not null check (file_size > 0 and file_size <= 52428800),
  storage_path text not null unique,
  status text not null default 'processing'
    check (status in ('processing', 'ready', 'failed')),
  error_message text,
  extracted_text text,
  page_count integer,
  word_count integer,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists materials_user_created_idx
  on public.materials (user_id, created_at desc);
create index if not exists materials_user_status_idx
  on public.materials (user_id, status);

alter table public.materials enable row level security;

drop policy if exists "materials_select_own" on public.materials;
create policy "materials_select_own" on public.materials
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "materials_insert_own" on public.materials;
create policy "materials_insert_own" on public.materials
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "materials_update_own" on public.materials;
create policy "materials_update_own" on public.materials
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "materials_delete_own" on public.materials;
create policy "materials_delete_own" on public.materials
  for delete to authenticated using (auth.uid() = user_id);

-- Extracted text split into chunks, used as AI context.
create table if not exists public.material_chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  chunk_index integer not null,
  page integer,
  content text not null,
  created_at timestamptz not null default now(),
  unique (material_id, chunk_index)
);

create index if not exists material_chunks_material_idx
  on public.material_chunks (material_id, chunk_index);

alter table public.material_chunks enable row level security;

drop policy if exists "material_chunks_select_own" on public.material_chunks;
create policy "material_chunks_select_own" on public.material_chunks
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "material_chunks_insert_own" on public.material_chunks;
create policy "material_chunks_insert_own" on public.material_chunks
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "material_chunks_delete_own" on public.material_chunks;
create policy "material_chunks_delete_own" on public.material_chunks
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- tutor_threads / tutor_messages — AI tutor conversations
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tutor_threads_user_idx
  on public.tutor_threads (user_id, updated_at desc);

alter table public.tutor_threads enable row level security;

drop policy if exists "tutor_threads_select_own" on public.tutor_threads;
create policy "tutor_threads_select_own" on public.tutor_threads
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "tutor_threads_insert_own" on public.tutor_threads;
create policy "tutor_threads_insert_own" on public.tutor_threads
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "tutor_threads_update_own" on public.tutor_threads;
create policy "tutor_threads_update_own" on public.tutor_threads
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tutor_threads_delete_own" on public.tutor_threads;
create policy "tutor_threads_delete_own" on public.tutor_threads
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.tutor_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  citations jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tutor_messages_thread_idx
  on public.tutor_messages (thread_id, created_at);
create index if not exists tutor_messages_user_idx
  on public.tutor_messages (user_id, created_at desc);

alter table public.tutor_messages enable row level security;

drop policy if exists "tutor_messages_select_own" on public.tutor_messages;
create policy "tutor_messages_select_own" on public.tutor_messages
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "tutor_messages_insert_own" on public.tutor_messages;
create policy "tutor_messages_insert_own" on public.tutor_messages
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "tutor_messages_delete_own" on public.tutor_messages;
create policy "tutor_messages_delete_own" on public.tutor_messages
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- summaries
-- ---------------------------------------------------------------------------
create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  style text not null check (
    style in ('short', 'detailed', 'key_points', 'exam_revision', 'simplified')
  ),
  title text not null,
  content text not null,
  edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists summaries_user_idx
  on public.summaries (user_id, created_at desc);
create index if not exists summaries_material_idx
  on public.summaries (material_id);

alter table public.summaries enable row level security;

drop policy if exists "summaries_select_own" on public.summaries;
create policy "summaries_select_own" on public.summaries
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "summaries_insert_own" on public.summaries;
create policy "summaries_insert_own" on public.summaries
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "summaries_update_own" on public.summaries;
create policy "summaries_update_own" on public.summaries
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "summaries_delete_own" on public.summaries;
create policy "summaries_delete_own" on public.summaries
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- quizzes / questions / answer keys / attempts
-- Correct answers live in quiz_question_keys, which the browser cannot read.
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  title text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

create index if not exists quizzes_user_idx
  on public.quizzes (user_id, created_at desc);
create index if not exists quizzes_material_idx
  on public.quizzes (material_id);

alter table public.quizzes enable row level security;

drop policy if exists "quizzes_select_own" on public.quizzes;
create policy "quizzes_select_own" on public.quizzes
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "quizzes_insert_own" on public.quizzes;
create policy "quizzes_insert_own" on public.quizzes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "quizzes_delete_own" on public.quizzes;
create policy "quizzes_delete_own" on public.quizzes
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null,
  type text not null check (type in ('multiple_choice', 'true_false', 'short_answer')),
  prompt text not null,
  options jsonb,
  created_at timestamptz not null default now(),
  unique (quiz_id, position)
);

create index if not exists quiz_questions_quiz_idx
  on public.quiz_questions (quiz_id, position);

alter table public.quiz_questions enable row level security;

drop policy if exists "quiz_questions_select_own" on public.quiz_questions;
create policy "quiz_questions_select_own" on public.quiz_questions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "quiz_questions_insert_own" on public.quiz_questions;
create policy "quiz_questions_insert_own" on public.quiz_questions
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "quiz_questions_delete_own" on public.quiz_questions;
create policy "quiz_questions_delete_own" on public.quiz_questions
  for delete to authenticated using (auth.uid() = user_id);

-- RLS is enabled and there is intentionally NO select policy: answer keys are
-- never readable from the browser, only by the submit_quiz_attempt RPC.
create table if not exists public.quiz_question_keys (
  question_id uuid primary key references public.quiz_questions (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  correct_answer text not null,
  explanation text
);

create index if not exists quiz_question_keys_quiz_idx
  on public.quiz_question_keys (quiz_id);

alter table public.quiz_question_keys enable row level security;

drop policy if exists "quiz_question_keys_insert_own" on public.quiz_question_keys;
create policy "quiz_question_keys_insert_own" on public.quiz_question_keys
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "quiz_question_keys_delete_own" on public.quiz_question_keys;
create policy "quiz_question_keys_delete_own" on public.quiz_question_keys
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null,
  results jsonb not null,
  score integer not null check (score between 0 and 100),
  correct_count integer not null,
  total_count integer not null,
  completed_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_idx
  on public.quiz_attempts (user_id, completed_at desc);
create index if not exists quiz_attempts_quiz_idx
  on public.quiz_attempts (quiz_id);

alter table public.quiz_attempts enable row level security;

drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select to authenticated using (auth.uid() = user_id);

-- No insert/update/delete policies: attempts are written only by the
-- Security Definer function below, which computes the score on the server.
create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_quiz record;
  v_total integer := 0;
  v_correct integer := 0;
  v_score integer := 0;
  v_results jsonb := '[]'::jsonb;
  v_question record;
  v_key record;
  v_answer text;
  v_is_correct boolean;
  v_attempt_id uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_quiz from public.quizzes where id = p_quiz_id and user_id = v_user;
  if not found then
    raise exception 'quiz_not_found';
  end if;

  for v_question in
    select * from public.quiz_questions where quiz_id = p_quiz_id and user_id = v_user order by position
  loop
    v_total := v_total + 1;
    select * into v_key from public.quiz_question_keys
      where question_id = v_question.id and quiz_id = p_quiz_id and user_id = v_user;
    v_answer := coalesce(p_answers ->> v_question.id::text, '');

    if v_key is null then
      v_is_correct := false;
    elsif v_question.type = 'short_answer' then
      v_is_correct := lower(regexp_replace(trim(v_answer), '\s+', ' ', 'g'))
        = lower(regexp_replace(trim(v_key.correct_answer), '\s+', ' ', 'g'));
    else
      v_is_correct := trim(v_answer) = trim(v_key.correct_answer);
    end if;

    if v_is_correct then
      v_correct := v_correct + 1;
    end if;

    v_results := v_results || jsonb_build_object(
      'questionId', v_question.id,
      'given', v_answer,
      'correct', v_key.correct_answer,
      'isCorrect', v_is_correct,
      'explanation', v_key.explanation
    );
  end loop;

  if v_total = 0 then
    raise exception 'quiz_empty';
  end if;

  v_score := round((v_correct::numeric / v_total::numeric) * 100);

  insert into public.quiz_attempts
    (quiz_id, user_id, answers, results, score, correct_count, total_count)
  values
    (p_quiz_id, v_user, p_answers, v_results, v_score, v_correct, v_total)
  returning id into v_attempt_id;

  return jsonb_build_object(
    'attemptId', v_attempt_id,
    'score', v_score,
    'correctCount', v_correct,
    'totalCount', v_total,
    'results', v_results
  );
end;
$$;

revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- study_tasks — planner
-- ---------------------------------------------------------------------------
create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  title text not null,
  description text,
  subject text,
  due_date timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 5 and 1440),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_tasks_user_due_idx
  on public.study_tasks (user_id, completed, due_date);
create index if not exists study_tasks_user_created_idx
  on public.study_tasks (user_id, created_at desc);

alter table public.study_tasks enable row level security;

drop policy if exists "study_tasks_select_own" on public.study_tasks;
create policy "study_tasks_select_own" on public.study_tasks
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "study_tasks_insert_own" on public.study_tasks;
create policy "study_tasks_insert_own" on public.study_tasks
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "study_tasks_update_own" on public.study_tasks;
create policy "study_tasks_update_own" on public.study_tasks
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "study_tasks_delete_own" on public.study_tasks;
create policy "study_tasks_delete_own" on public.study_tasks
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- study_sessions — tracked study time (dashboard + progress charts)
-- ---------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  activity text not null default 'material' check (
    activity in ('material', 'tutor', 'quiz', 'summary', 'mind_map')
  ),
  duration_seconds integer not null check (duration_seconds between 5 and 14400),
  started_at timestamptz not null default now(),
  ended_at timestamptz not null default now()
);

create index if not exists study_sessions_user_idx
  on public.study_sessions (user_id, ended_at desc);

alter table public.study_sessions enable row level security;

drop policy if exists "study_sessions_select_own" on public.study_sessions;
create policy "study_sessions_select_own" on public.study_sessions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "study_sessions_insert_own" on public.study_sessions;
create policy "study_sessions_insert_own" on public.study_sessions
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "study_sessions_delete_own" on public.study_sessions;
create policy "study_sessions_delete_own" on public.study_sessions
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- mind_maps — nodes/edges stored as JSON
-- ---------------------------------------------------------------------------
create table if not exists public.mind_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  title text not null,
  nodes jsonb not null,
  edges jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mind_maps_user_idx
  on public.mind_maps (user_id, created_at desc);
create index if not exists mind_maps_material_idx
  on public.mind_maps (material_id);

alter table public.mind_maps enable row level security;

drop policy if exists "mind_maps_select_own" on public.mind_maps;
create policy "mind_maps_select_own" on public.mind_maps
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "mind_maps_insert_own" on public.mind_maps;
create policy "mind_maps_insert_own" on public.mind_maps
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "mind_maps_update_own" on public.mind_maps;
create policy "mind_maps_update_own" on public.mind_maps
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "mind_maps_delete_own" on public.mind_maps;
create policy "mind_maps_delete_own" on public.mind_maps
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- flashcards — generated from a material
-- ---------------------------------------------------------------------------
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  front text not null,
  back text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists flashcards_material_idx
  on public.flashcards (material_id, position);

alter table public.flashcards enable row level security;

drop policy if exists "flashcards_select_own" on public.flashcards;
create policy "flashcards_select_own" on public.flashcards
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "flashcards_insert_own" on public.flashcards;
create policy "flashcards_insert_own" on public.flashcards
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "flashcards_delete_own" on public.flashcards;
create policy "flashcards_delete_own" on public.flashcards
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers for every table that has the column
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'materials',
    'tutor_threads',
    'summaries',
    'study_tasks',
    'mind_maps'
  ]
  loop
    execute format('drop trigger if exists touch_%1$s_updated_at on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s_updated_at before update on public.%1$s for each row execute function public.touch_updated_at()',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Table privileges (RLS still decides which rows are visible)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.materials to authenticated;
grant select, insert, delete on public.material_chunks to authenticated;
grant select, insert, update, delete on public.tutor_threads to authenticated;
grant select, insert, delete on public.tutor_messages to authenticated;
grant select, insert, update, delete on public.summaries to authenticated;
grant select, insert, delete on public.quizzes to authenticated;
grant select, insert, delete on public.quiz_questions to authenticated;
grant select, insert, delete on public.quiz_question_keys to authenticated;
grant select on public.quiz_attempts to authenticated;
grant select, insert, update, delete on public.study_tasks to authenticated;
grant select, insert, delete on public.study_sessions to authenticated;
grant select, insert, update, delete on public.mind_maps to authenticated;
grant select, insert, delete on public.flashcards to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private bucket for study files
-- Path layout: materials/<user_id>/<uuid>.<ext>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials',
  'materials',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "materials_storage_select_own" on storage.objects;
create policy "materials_storage_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "materials_storage_insert_own" on storage.objects;
create policy "materials_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "materials_storage_update_own" on storage.objects;
create policy "materials_storage_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "materials_storage_delete_own" on storage.objects;
create policy "materials_storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Storage: public bucket for profile pictures
-- Path layout: avatars/<user_id>/<uuid>.<ext>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_storage_select_own" on storage.objects;
create policy "avatars_storage_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_storage_insert_own" on storage.objects;
create policy "avatars_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_storage_update_own" on storage.objects;
create policy "avatars_storage_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_storage_delete_own" on storage.objects;
create policy "avatars_storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- push_subscriptions — one browser/device endpoint per user
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);
create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated using (auth.uid() = user_id);
drop trigger if exists touch_push_subscriptions_updated_at on public.push_subscriptions;
create trigger touch_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- push_task_reminders — server-owned idempotency claims for cron reminders
-- ---------------------------------------------------------------------------
create table if not exists public.push_task_reminders (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.study_tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  due_date timestamptz not null,
  kind text not null check (kind in ('one_hour')),
  created_at timestamptz not null default now(),
  unique (task_id, due_date, kind)
);
create index if not exists push_task_reminders_user_idx
  on public.push_task_reminders (user_id, created_at desc);
alter table public.push_task_reminders enable row level security;
revoke all on public.push_task_reminders from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Trusted application roles. Client roles are intentionally not writable.
-- Teacher/admin assignments are provisioned server-side or in the SQL editor.
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;

create or replace function public.has_role(p_role text)
returns boolean language sql security definer set search_path = public stable
as $$
  select p_role in ('teacher', 'admin') and exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = p_role
  );
$$;
revoke all on function public.has_role(text) from public;
grant execute on function public.has_role(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Rate limiting. Used when Upstash Redis is not configured so production keeps
-- distributed protection instead of rejecting every request.
create table if not exists public.rate_limits (
  bucket text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql security definer set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_uid text := auth.uid()::text;
  v_count integer;
  v_reset timestamptz;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_bucket is null or length(p_bucket) > 300 or right(p_bucket, length(v_uid)) <> v_uid then
    raise exception 'invalid_bucket';
  end if;
  if p_limit is null or p_limit < 1 or p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'invalid_arguments';
  end if;

  insert into public.rate_limits as rl (bucket, count, reset_at)
  values (p_bucket, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (bucket) do update
    set count = case when rl.reset_at <= v_now then 1 else rl.count + 1 end,
        reset_at = case when rl.reset_at <= v_now then excluded.reset_at else rl.reset_at end
  returning rl.count, rl.reset_at into v_count, v_reset;

  if random() < 0.01 then
    delete from public.rate_limits where reset_at < v_now - interval '1 day';
  end if;

  return query
    select
      v_count <= p_limit,
      case
        when v_count <= p_limit then 0
        else greatest(1, ceil(extract(epoch from (v_reset - v_now)))::integer)
      end;
end;
$$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_rate_limit(text, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Repair / backfill
-- ---------------------------------------------------------------------------

-- 1) Users who saved complete answers but never got the flag (the bug that
--    sent students back to onboarding) are repaired here.
update public.profiles
set onboarding_completed = true
where onboarding_completed = false
  and public.profile_answers_complete(
    education_level,
    learning_interests,
    learning_goals
  );

-- 2) Auth users created before the trigger existed get a profile row.
insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    ''
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

commit;
