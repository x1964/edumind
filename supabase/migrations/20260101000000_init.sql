-- ===========================================================================
-- EduMind core schema
-- All user-owned rows are protected with Row Level Security.
-- Run with: supabase db push   (or apply in the Supabase SQL editor)
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  education_level text check (
    education_level is null
    or education_level in ('school', 'university', 'independent')
  ),
  learning_interests text[] not null default '{}',
  learning_goals text[] not null default '{}',
  learning_language text not null default 'ar' check (learning_language in ('ar', 'en')),
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  notifications jsonb not null default '{"email": false, "study_reminders": true}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Create a profile row for every new auth user.
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

-- ---------------------------------------------------------------------------
-- materials
-- ---------------------------------------------------------------------------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_type text not null check (file_type in ('pdf', 'docx', 'txt')),
  mime_type text not null,
  file_size integer not null check (file_size > 0 and file_size <= 20971520),
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

-- ---------------------------------------------------------------------------
-- material_chunks
-- ---------------------------------------------------------------------------
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
-- tutor_threads / tutor_messages
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
  style text not null check (style in ('short', 'detailed', 'key_points', 'exam_revision', 'simplified')),
  title text not null,
  content text not null,
  edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists summaries_user_idx
  on public.summaries (user_id, created_at desc);

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
-- quizzes (correct answers live in a table the browser cannot read)
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  title text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

create index if not exists quizzes_user_idx on public.quizzes (user_id, created_at desc);

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

create index if not exists quiz_questions_quiz_idx on public.quiz_questions (quiz_id, position);

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

-- Answer keys: RLS enabled and intentionally no SELECT policy.
create table if not exists public.quiz_question_keys (
  question_id uuid primary key references public.quiz_questions (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  correct_answer text not null,
  explanation text
);

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

alter table public.quiz_attempts enable row level security;

drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select to authenticated using (auth.uid() = user_id);

-- No insert/update/delete policies: attempts are only written by the
-- SECURITY DEFINER function below, which computes the score server-side.

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
    select * from public.quiz_questions where quiz_id = p_quiz_id order by position
  loop
    v_total := v_total + 1;
    select * into v_key from public.quiz_question_keys where question_id = v_question.id;
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
-- study_tasks
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
-- study_sessions (created by the tracked study-session endpoint)
-- ---------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  activity text not null default 'material' check (activity in ('material', 'tutor', 'quiz', 'summary', 'mind_map')),
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

-- ---------------------------------------------------------------------------
-- mind_maps
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

create index if not exists mind_maps_user_idx on public.mind_maps (user_id, created_at desc);

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
-- flashcards (generated from a material)
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

create index if not exists flashcards_material_idx on public.flashcards (material_id, position);

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
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'materials', 'tutor_threads', 'summaries', 'study_tasks', 'mind_maps']
  loop
    execute format('drop trigger if exists touch_%1$s_updated_at on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s_updated_at before update on public.%1$s for each row execute function public.touch_updated_at()',
      t
    );
  end loop;
end $$;
