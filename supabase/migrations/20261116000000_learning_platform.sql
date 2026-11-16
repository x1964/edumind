-- ===========================================================================
-- EduMind — Learning Platform
--
-- Adds the academic profile, curriculum hierarchy, AI study planner,
-- mastery/revision tracking, assessment metadata, historical exam archive,
-- study rooms, XP/achievements and voice lessons.
--
-- Design notes
--   • Curriculum content is database-driven. Nothing is hardcoded in the UI.
--   • Student-owned rows are protected by RLS and owner checks.
--   • Scores, mastery and XP are written server-side only (Security Definer
--     functions). The browser can never grant itself points or grades.
--   • The existing quizzes/quizzes_attempts engine is reused for assessments
--     instead of duplicating a second grading system.
--
-- v2 hardening (verified against a local PostgreSQL 16 harness):
--   * adds the missing public.has_role(text) (admin via JWT app_metadata)
--   * preflight check: fails early with a readable message if a dependency is missing
--   * study-room participants can no longer self-promote, re-activate or edit score
--   * removed members can no longer rejoin through join_study_room()
--   * XP is idempotent (ledger) and capped per day; plan items cannot be un-completed
--   * submit_quiz_attempt 2-arg wrapper no longer collides with the 3-arg version
--   * unpublished catalog / unverified exam archives are hidden from students
--   * default Supabase grants are revoked first, then granted explicitly
-- ===========================================================================
begin;

-- ---------------------------------------------------------------------------
-- Preflight: objects this migration extends but does not create
-- ---------------------------------------------------------------------------
do $$
declare
  v_missing text[] := '{}';
  r record;
begin
  for r in select * from (values
    ('profiles','id'), ('profiles','full_name'),
    ('tutor_threads','id'),
    ('quizzes','id'), ('quizzes','user_id'), ('quizzes','title'), ('quizzes','created_at'), ('quizzes','material_id'),
    ('quiz_questions','id'), ('quiz_questions','quiz_id'), ('quiz_questions','user_id'),
    ('quiz_questions','type'), ('quiz_questions','prompt'), ('quiz_questions','options'), ('quiz_questions','position'),
    ('quiz_question_keys','question_id'), ('quiz_question_keys','quiz_id'), ('quiz_question_keys','user_id'),
    ('quiz_question_keys','correct_answer'), ('quiz_question_keys','explanation'),
    ('quiz_attempts','quiz_id'), ('quiz_attempts','user_id'), ('quiz_attempts','answers'),
    ('quiz_attempts','results'), ('quiz_attempts','score'), ('quiz_attempts','correct_count'),
    ('quiz_attempts','total_count')
  ) as x(t, c)
  loop
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = r.t and column_name = r.c
    ) then
      v_missing := v_missing || (r.t || '.' || r.c);
    end if;
  end loop;
  if array_length(v_missing, 1) > 0 then
    raise exception 'EduMind preflight failed. Missing: %', array_to_string(v_missing, ', ');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
-- Admin check. Reads ONLY app_metadata (server-controlled). Never user_metadata,
-- which end users can edit themselves. Claims refresh when the JWT is renewed.
create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = p_role
    or (auth.jwt() -> 'app_metadata' -> 'roles') ? p_role,
    false
  );
$$;
revoke all on function public.has_role(text) from public, anon;
grant execute on function public.has_role(text) to authenticated;

-- Only created when the project does not already define it.
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'touch_updated_at'
  ) then
    execute $f$
      create function public.touch_updated_at() returns trigger
      language plpgsql set search_path = public as $b$
      begin new.updated_at = now(); return new; end;
      $b$
    $f$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Academic catalog
-- ---------------------------------------------------------------------------
create table if not exists public.educational_systems (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_ar text not null,
  name_en text not null,
  country_code text not null default 'EG',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_stages (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null references public.educational_systems (id) on delete cascade,
  code text not null,
  name_ar text not null,
  name_en text not null,
  position integer not null default 0,
  published boolean not null default true,
  unique (system_id, code)
);

create table if not exists public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.academic_stages (id) on delete cascade,
  code text not null,
  name_ar text not null,
  name_en text not null,
  position integer not null default 0,
  published boolean not null default true,
  unique (stage_id, code)
);

create table if not exists public.academic_tracks (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references public.grade_levels (id) on delete cascade,
  code text not null,
  name_ar text not null,
  name_en text not null,
  position integer not null default 0,
  published boolean not null default true,
  unique (grade_id, code)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references public.grade_levels (id) on delete cascade,
  track_id uuid references public.academic_tracks (id) on delete cascade,
  code text not null,
  name_ar text not null,
  name_en text not null,
  color text not null default 'emerald',
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
-- NULL track_id means the subject belongs to every track in the grade.
create unique index if not exists subjects_grade_code_general_uidx
  on public.subjects (grade_id, code) where track_id is null;
create unique index if not exists subjects_grade_track_code_uidx
  on public.subjects (grade_id, track_id, code) where track_id is not null;

create table if not exists public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.curriculum_units (id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  description_ar text,
  description_en text,
  content text,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  estimated_minutes integer not null default 30 check (estimated_minutes between 10 and 480),
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_objectives (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  text_ar text not null,
  text_en text not null,
  position integer not null default 0
);

create index if not exists subjects_grade_idx on public.subjects (grade_id, position);
create index if not exists units_subject_idx on public.curriculum_units (subject_id, position);
create index if not exists lessons_unit_idx on public.lessons (unit_id, position);
create index if not exists objectives_lesson_idx on public.lesson_objectives (lesson_id, position);

-- ---------------------------------------------------------------------------
-- Student academic profile
-- ---------------------------------------------------------------------------
create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  system_id uuid references public.educational_systems (id) on delete set null,
  stage_id uuid references public.academic_stages (id) on delete set null,
  grade_id uuid references public.grade_levels (id) on delete set null,
  track_id uuid references public.academic_tracks (id) on delete set null,
  academic_year text,
  daily_minutes integer not null default 120 check (daily_minutes between 15 and 720),
  preferred_start_minute integer not null default 1020 check (preferred_start_minute between 0 and 1439),
  study_days smallint[] not null default '{0,1,2,3,4,6}'
    check (study_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  goals text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  exam_date date,
  target_score integer check (target_score between 0 and 100),
  self_rating integer check (self_rating between 0 and 100),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  unique (user_id, subject_id)
);

create index if not exists student_subjects_user_idx on public.student_subjects (user_id);

-- ---------------------------------------------------------------------------
-- Study plans
-- ---------------------------------------------------------------------------
create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  start_date date not null default current_date,
  end_date date not null default (current_date + 30),
  generator_version integer not null default 1,
  status text not null default 'active' check (status in ('active', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  lesson_id uuid references public.lessons (id) on delete set null,
  title text not null,
  learning_objective text,
  recommended_activity text,
  planned_date date not null,
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 480),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  kind text not null default 'learn' check (kind in ('learn', 'revise', 'assess')),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'missed', 'rescheduled', 'skipped')),
  completed_at timestamptz,
  reschedule_count integer not null default 0,
  source text not null default 'generated' check (source in ('generated', 'manual')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_plans_user_idx on public.study_plans (user_id, status, created_at desc);
create index if not exists plan_items_user_date_idx
  on public.study_plan_items (user_id, planned_date, status);
create index if not exists plan_items_plan_idx on public.study_plan_items (plan_id, sort_order);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  status text not null default 'in_progress'
    check (status in ('not_started', 'in_progress', 'studied', 'mastered')),
  mastery integer not null default 0 check (mastery between 0 and 100),
  study_minutes integer not null default 0,
  attempts integer not null default 0,
  last_score integer check (last_score between 0 and 100),
  last_studied_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists lesson_progress_user_idx on public.lesson_progress (user_id, mastery);

create table if not exists public.revision_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null,
  stage integer not null default 1 check (stage between 1 and 8),
  due_date date not null,
  interval_days integer not null default 1 check (interval_days between 1 and 120),
  status text not null default 'due' check (status in ('due', 'done', 'skipped')),
  last_score integer check (last_score between 0 and 100),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id, stage)
);

create index if not exists revision_user_due_idx
  on public.revision_schedule (user_id, status, due_date);

create table if not exists public.learning_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('lesson', 'revision', 'assessment', 'subject')),
  lesson_id uuid references public.lessons (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete cascade,
  title text not null,
  reason text not null,
  priority integer not null default 2 check (priority between 1 and 5),
  status text not null default 'open' check (status in ('open', 'dismissed', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists recommendations_user_idx
  on public.learning_recommendations (user_id, status, priority);

-- ---------------------------------------------------------------------------
-- Assessment metadata on the existing quiz engine
-- ---------------------------------------------------------------------------
alter table public.quizzes alter column material_id drop not null;
alter table public.quizzes add column if not exists subject_id uuid references public.subjects (id) on delete set null;
alter table public.quizzes add column if not exists lesson_id uuid references public.lessons (id) on delete set null;
alter table public.quizzes add column if not exists source text not null default 'practice'
  check (source in ('practice', 'mock', 'official', 'challenge'));
alter table public.quizzes add column if not exists assessment_kind text not null default 'topic_quiz'
  check (assessment_kind in ('topic_quiz', 'mock_exam', 'challenge', 'placement'));
alter table public.quizzes add column if not exists time_limit_minutes integer
  check (time_limit_minutes is null or time_limit_minutes between 1 and 300);

alter table public.quiz_questions add column if not exists lesson_id uuid references public.lessons (id) on delete set null;
alter table public.quiz_questions add column if not exists topic text;
alter table public.quiz_questions add column if not exists difficulty text
  check (difficulty is null or difficulty in ('easy', 'medium', 'hard'));

alter table public.quiz_attempts add column if not exists duration_seconds integer
  check (duration_seconds is null or duration_seconds between 0 and 14400);
alter table public.quiz_attempts add column if not exists timed_out boolean not null default false;

create index if not exists quizzes_lesson_idx on public.quizzes (lesson_id, created_at desc);
create index if not exists quiz_questions_lesson_idx on public.quiz_questions (lesson_id);

-- ---------------------------------------------------------------------------
-- Historical examination archive
-- ---------------------------------------------------------------------------
create table if not exists public.exam_archives (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects (id) on delete set null,
  grade_id uuid references public.grade_levels (id) on delete set null,
  academic_year text not null,
  exam_type text not null default 'final'
    check (exam_type in ('final', 'midterm', 'mock', 'official', 'other')),
  title_ar text not null,
  title_en text not null,
  source_reference text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified', 'rejected')),
  published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_archive_questions (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null references public.exam_archives (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  unit_title text,
  topic text not null,
  question_type text not null default 'multiple_choice'
    check (question_type in ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching')),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  prompt text not null,
  marks integer not null default 1 check (marks between 1 and 100),
  position integer not null default 0,
  ai_classified boolean not null default false,
  admin_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists archive_questions_archive_idx
  on public.exam_archive_questions (archive_id, position);
create index if not exists archive_questions_topic_idx on public.exam_archive_questions (topic);
create index if not exists archives_subject_idx on public.exam_archives (subject_id, academic_year);

-- Aggregate view. security_invoker means the caller's RLS on the underlying
-- tables applies, so unpublished archives never leak into public statistics.
create or replace view public.exam_topic_frequency
with (security_invoker = true)
as
select
  q.archive_id,
  a.subject_id,
  a.academic_year,
  a.grade_id,
  q.topic,
  q.question_type,
  q.difficulty,
  count(*)::integer as question_count,
  sum(q.marks)::integer as total_marks
from public.exam_archive_questions q
join public.exam_archives a on a.id = q.archive_id
where a.published = true and a.verification_status = 'verified'
group by q.archive_id, a.subject_id, a.academic_year, a.grade_id, q.topic, q.question_type, q.difficulty;

-- ---------------------------------------------------------------------------
-- Study rooms, challenges and moderation
-- ---------------------------------------------------------------------------
create table if not exists public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  name text not null,
  subject_id uuid references public.subjects (id) on delete set null,
  lesson_id uuid references public.lessons (id) on delete set null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  max_participants integer not null default 8 check (max_participants between 2 and 20),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 hours')
);

create table if not exists public.study_room_participants (
  room_id uuid not null references public.study_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'active' check (status in ('active', 'left', 'removed')),
  score integer check (score between 0 and 100),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists room_participants_user_idx on public.study_room_participants (user_id, status);

create table if not exists public.study_challenges (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'finished')),
  started_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists challenges_room_idx on public.study_challenges (room_id, status);

create table if not exists public.challenge_attempts (
  challenge_id uuid not null references public.study_challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  correct_count integer not null default 0,
  total_count integer not null default 0,
  duration_seconds integer not null default 0,
  completed_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table if not exists public.study_room_reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists room_reports_status_idx on public.study_room_reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- XP and achievements
-- ---------------------------------------------------------------------------
create table if not exists public.student_xp (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, code)
);

create index if not exists achievements_user_idx on public.student_achievements (user_id, unlocked_at desc);

-- ---------------------------------------------------------------------------
-- Voice lessons (transcript + optional cached audio path)
-- ---------------------------------------------------------------------------
create table if not exists public.audio_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  thread_id uuid references public.tutor_threads (id) on delete set null,
  title text not null,
  transcript text not null,
  language text not null default 'ar' check (language in ('ar', 'en')),
  voice text,
  status text not null default 'ready' check (status in ('processing', 'ready', 'failed')),
  duration_seconds integer,
  storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists audio_lessons_user_idx on public.audio_lessons (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- XP ledger: makes awards idempotent per (source, ref) and enables a daily cap.
-- No client policies and no client grants: only definer functions touch it.
-- ---------------------------------------------------------------------------
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null,
  ref_id uuid,
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now()
);
create unique index if not exists xp_events_once_uidx
  on public.xp_events (user_id, source, ref_id) where ref_id is not null;
create index if not exists xp_events_user_day_idx on public.xp_events (user_id, created_at desc);
alter table public.xp_events enable row level security;

-- ---------------------------------------------------------------------------
-- Supporting indexes for foreign keys / policy lookups
-- ---------------------------------------------------------------------------
create index if not exists subjects_track_idx on public.subjects (track_id) where track_id is not null;
create index if not exists plan_items_lesson_idx on public.study_plan_items (lesson_id) where lesson_id is not null;
create index if not exists plan_items_subject_idx on public.study_plan_items (subject_id) where subject_id is not null;
create index if not exists lesson_progress_lesson_idx on public.lesson_progress (lesson_id);
create index if not exists revision_lesson_idx on public.revision_schedule (lesson_id) where lesson_id is not null;
create index if not exists study_rooms_owner_idx on public.study_rooms (owner_id);
create index if not exists study_rooms_expiry_idx on public.study_rooms (expires_at);
create index if not exists challenges_quiz_idx on public.study_challenges (quiz_id);
create index if not exists challenge_attempts_user_idx on public.challenge_attempts (user_id);
create index if not exists room_reports_room_idx on public.study_room_reports (room_id);
create index if not exists audio_lessons_lesson_idx on public.audio_lessons (lesson_id) where lesson_id is not null;
create index if not exists archives_grade_idx on public.exam_archives (grade_id) where grade_id is not null;
create index if not exists archive_questions_lesson_idx on public.exam_archive_questions (lesson_id) where lesson_id is not null;
-- One open recommendation per (user, lesson, reason): makes "on conflict do nothing" real.
create unique index if not exists recommendations_open_uidx
  on public.learning_recommendations (user_id, kind, lesson_id, reason)
  where status = 'open' and lesson_id is not null;

-- ---------------------------------------------------------------------------
-- RLS: catalog is readable by signed-in students, writable only by admins.
-- ---------------------------------------------------------------------------
alter table public.educational_systems enable row level security;
alter table public.academic_stages enable row level security;
alter table public.grade_levels enable row level security;
alter table public.academic_tracks enable row level security;
alter table public.subjects enable row level security;
alter table public.curriculum_units enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_objectives enable row level security;
alter table public.exam_archives enable row level security;
alter table public.exam_archive_questions enable row level security;

do $$
declare
  t text;
begin
  -- Students only see published catalog rows; admins see everything.
  foreach t in array array[
    'educational_systems', 'academic_stages', 'grade_levels', 'academic_tracks',
    'subjects', 'curriculum_units', 'lessons'
  ]
  loop
    execute format('drop policy if exists "%1$s_public_read" on public.%1$s', t);
    execute format(
      'create policy "%1$s_public_read" on public.%1$s for select to authenticated using (published = true or (select public.has_role(''admin'')))', t
    );
  end loop;

  -- Objectives inherit visibility from their lesson (lessons RLS applies inside the subquery).
  drop policy if exists "lesson_objectives_public_read" on public.lesson_objectives;
  create policy "lesson_objectives_public_read" on public.lesson_objectives
    for select to authenticated using (
      exists (select 1 from public.lessons l where l.id = lesson_id)
    );

  -- Admin writes, split per command (a single FOR ALL policy would add a second
  -- permissive SELECT policy to evaluate on every read).
  foreach t in array array[
    'educational_systems', 'academic_stages', 'grade_levels', 'academic_tracks',
    'subjects', 'curriculum_units', 'lessons', 'lesson_objectives'
  ]
  loop
    execute format('drop policy if exists "%1$s_admin_write" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_admin_insert" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_admin_update" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_admin_delete" on public.%1$s', t);
    execute format('create policy "%1$s_admin_insert" on public.%1$s for insert to authenticated with check ((select public.has_role(''admin'')))', t);
    execute format('create policy "%1$s_admin_update" on public.%1$s for update to authenticated using ((select public.has_role(''admin''))) with check ((select public.has_role(''admin'')))', t);
    execute format('create policy "%1$s_admin_delete" on public.%1$s for delete to authenticated using ((select public.has_role(''admin'')))', t);
  end loop;
end $$;

-- Students see only archives that are BOTH published and verified.
drop policy if exists "exam_archives_read" on public.exam_archives;
create policy "exam_archives_read" on public.exam_archives
  for select to authenticated using (
    (published = true and verification_status = 'verified') or (select public.has_role('admin'))
  );

drop policy if exists "exam_archives_admin_write" on public.exam_archives;
drop policy if exists "exam_archives_admin_insert" on public.exam_archives;
drop policy if exists "exam_archives_admin_update" on public.exam_archives;
drop policy if exists "exam_archives_admin_delete" on public.exam_archives;
create policy "exam_archives_admin_insert" on public.exam_archives
  for insert to authenticated with check ((select public.has_role('admin')));
create policy "exam_archives_admin_update" on public.exam_archives
  for update to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "exam_archives_admin_delete" on public.exam_archives
  for delete to authenticated using ((select public.has_role('admin')));

-- Questions inherit visibility from their archive (archive RLS applies in the subquery).
drop policy if exists "archive_questions_read" on public.exam_archive_questions;
create policy "archive_questions_read" on public.exam_archive_questions
  for select to authenticated using (
    exists (select 1 from public.exam_archives a where a.id = archive_id)
  );

drop policy if exists "archive_questions_admin_write" on public.exam_archive_questions;
drop policy if exists "archive_questions_admin_insert" on public.exam_archive_questions;
drop policy if exists "archive_questions_admin_update" on public.exam_archive_questions;
drop policy if exists "archive_questions_admin_delete" on public.exam_archive_questions;
create policy "archive_questions_admin_insert" on public.exam_archive_questions
  for insert to authenticated with check ((select public.has_role('admin')));
create policy "archive_questions_admin_update" on public.exam_archive_questions
  for update to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "archive_questions_admin_delete" on public.exam_archive_questions
  for delete to authenticated using ((select public.has_role('admin')));

-- ---------------------------------------------------------------------------
-- RLS: student-owned tables (generic owner-scoped policies)
-- ---------------------------------------------------------------------------
alter table public.student_profiles enable row level security;
alter table public.student_subjects enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_plan_items enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.revision_schedule enable row level security;
alter table public.learning_recommendations enable row level security;
alter table public.audio_lessons enable row level security;
alter table public.student_xp enable row level security;
alter table public.student_achievements enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'student_profiles', 'student_subjects', 'study_plans', 'study_plan_items',
    'lesson_progress', 'revision_schedule', 'learning_recommendations',
    'audio_lessons', 'student_xp', 'student_achievements'
  ]
  loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$s', t);
    execute format(
      'create policy "%1$s_select_own" on public.%1$s for select to authenticated using ((select auth.uid()) = user_id)', t
    );
  end loop;
end $$;

-- Profiles and plan metadata are editable by their owner. Mastery, XP and
-- achievements are not client-writable: they are written by definer RPCs.
drop policy if exists "student_profiles_write_own" on public.student_profiles;
create policy "student_profiles_write_own" on public.student_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "student_profiles_update_own" on public.student_profiles;
create policy "student_profiles_update_own" on public.student_profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "student_subjects_write_own" on public.student_subjects;
create policy "student_subjects_write_own" on public.student_subjects
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "study_plans_write_own" on public.study_plans;
create policy "study_plans_write_own" on public.study_plans
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "study_plan_items_write_own" on public.study_plan_items;
create policy "study_plan_items_write_own" on public.study_plan_items
  for all to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.study_plans p where p.id = plan_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "audio_lessons_write_own" on public.audio_lessons;
create policy "audio_lessons_write_own" on public.audio_lessons
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Spaced-revision rows are created by RPCs; the student may only skip/reopen them
-- (column grant below limits UPDATE to the status column).
drop policy if exists "revision_schedule_update_own" on public.revision_schedule;
create policy "revision_schedule_update_own" on public.revision_schedule
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and status in ('due', 'skipped'));

drop policy if exists "recommendations_update_own" on public.learning_recommendations;
create policy "recommendations_update_own" on public.learning_recommendations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and status in ('open', 'dismissed'));
drop policy if exists "recommendations_delete_own" on public.learning_recommendations;
create policy "recommendations_delete_own" on public.learning_recommendations
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Rooms: members can read their room. Only the owner can modify it.
alter table public.study_rooms enable row level security;
alter table public.study_room_participants enable row level security;
alter table public.study_challenges enable row level security;
alter table public.challenge_attempts enable row level security;
alter table public.study_room_reports enable row level security;

create or replace function public.is_room_member(p_room_id uuid)
returns boolean language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.study_room_participants
    where room_id = p_room_id and user_id = (select auth.uid()) and status = 'active'
  );
$$;
revoke all on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

-- Participant display names are intentionally exposed only to fellow members of
-- the same room. Profile rows themselves stay private to their owner.
create or replace function public.get_room_participants(p_room_id uuid)
returns table (user_id uuid, full_name text, role text)
language sql security definer set search_path = public stable
as $$
  select p.user_id, coalesce(nullif(pr.full_name, ''), 'Student') as full_name, p.role
  from public.study_room_participants p
  left join public.profiles pr on pr.id = p.user_id
  where p.room_id = p_room_id
    and p.status = 'active'
    and public.is_room_member(p_room_id);
$$;
revoke all on function public.get_room_participants(uuid) from public, anon;
grant execute on function public.get_room_participants(uuid) to authenticated;

drop policy if exists "rooms_read_member" on public.study_rooms;
create policy "rooms_read_member" on public.study_rooms
  for select to authenticated using (
    owner_id = (select auth.uid()) or public.is_room_member(id) or (select public.has_role('admin'))
  );
drop policy if exists "rooms_insert_owner" on public.study_rooms;
create policy "rooms_insert_owner" on public.study_rooms
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "rooms_update_owner" on public.study_rooms;
create policy "rooms_update_owner" on public.study_rooms
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "participants_read_room" on public.study_room_participants;
create policy "participants_read_room" on public.study_room_participants
  for select to authenticated using (public.is_room_member(room_id) or user_id = (select auth.uid()));
drop policy if exists "participants_join_self" on public.study_room_participants;
-- Membership is granted only through join_study_room() (a definer function that
-- validates the room code, capacity and expiry). The only direct insert allowed
-- here is the owner creating their own owner row.
drop policy if exists "participants_insert_owner" on public.study_room_participants;
create policy "participants_insert_owner" on public.study_room_participants
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1 from public.study_rooms r where r.id = room_id and r.owner_id = (select auth.uid())
    )
  );
-- UPDATE is allowed on a participant row for the member themself or the room
-- owner. WHAT may change is enforced twice: column grants (status, last_seen_at
-- only) and guard_room_participant_write() (legal status transitions only).
drop policy if exists "participants_update_self" on public.study_room_participants;
create policy "participants_update_self" on public.study_room_participants
  for update to authenticated using (
    user_id = (select auth.uid()) or exists (
      select 1 from public.study_rooms r where r.id = room_id and r.owner_id = (select auth.uid())
    )
  ) with check (
    user_id = (select auth.uid()) or exists (
      select 1 from public.study_rooms r where r.id = room_id and r.owner_id = (select auth.uid())
    )
  );

drop policy if exists "reports_admin_update" on public.study_room_reports;
create policy "reports_admin_update" on public.study_room_reports
  for update to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

drop policy if exists "challenges_read_member" on public.study_challenges;
create policy "challenges_read_member" on public.study_challenges
  for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "challenges_owner_write" on public.study_challenges;
create policy "challenges_owner_write" on public.study_challenges
  for all to authenticated using (
    created_by = (select auth.uid()) and exists (
      select 1 from public.study_rooms r where r.id = room_id and r.owner_id = (select auth.uid())
    )
  ) with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.study_rooms r where r.id = room_id and r.owner_id = (select auth.uid())
    )
    -- Never let a room owner attach another student's quiz and expose its questions.
    and exists (
      select 1 from public.quizzes q where q.id = quiz_id and q.user_id = (select auth.uid())
    )
  );

drop policy if exists "challenge_attempts_read_room" on public.challenge_attempts;
create policy "challenge_attempts_read_room" on public.challenge_attempts
  for select to authenticated using (
    exists (
      select 1 from public.study_challenges c
      where c.id = challenge_id and public.is_room_member(c.room_id)
    )
  );
-- Attempts are written only by submit_challenge_attempt().

drop policy if exists "reports_insert_member" on public.study_room_reports;
create policy "reports_insert_member" on public.study_room_reports
  for insert to authenticated with check (
    reporter_id = (select auth.uid()) and public.is_room_member(room_id)
  );
drop policy if exists "reports_read_own" on public.study_room_reports;
create policy "reports_read_own" on public.study_room_reports
  for select to authenticated using (reporter_id = (select auth.uid()) or (select public.has_role('admin')));

-- ---------------------------------------------------------------------------
-- Server-only progression helpers
-- ---------------------------------------------------------------------------
drop function if exists public.award_xp(uuid, integer);
-- Returns the XP actually granted (0 when duplicate or over the daily cap).
create or replace function public.award_xp(
  p_user uuid, p_amount integer, p_source text default null, p_ref uuid default null
)
returns integer language plpgsql security definer set search_path = public
as $$
declare
  c_daily_cap constant integer := 300;
  v_today integer;
  v_grant integer;
  v_total integer;
  v_level integer;
  v_rows integer;
begin
  if p_user is null or p_amount is null or p_amount <= 0 then return 0; end if;
  -- Serialise per user so parallel calls cannot overshoot the daily cap.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  select coalesce(sum(amount), 0) into v_today from public.xp_events
    where user_id = p_user and created_at >= date_trunc('day', now());
  v_grant := least(least(p_amount, 200), greatest(0, c_daily_cap - v_today));
  if v_grant <= 0 then return 0; end if;

  insert into public.xp_events (user_id, source, ref_id, amount)
  values (p_user, coalesce(p_source, 'misc'), p_ref, v_grant)
  on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return 0; end if;   -- this (source, ref) was already rewarded

  insert into public.student_xp (user_id, xp, level)
  values (p_user, v_grant, 1)
  on conflict (user_id) do update set
    xp = public.student_xp.xp + v_grant,
    updated_at = now()
  returning xp into v_total;

  v_level := greatest(1, floor(sqrt(v_total::numeric / 50))::integer + 1);
  update public.student_xp set level = v_level, updated_at = now() where user_id = p_user;

  if v_level >= 5 then
    insert into public.student_achievements (user_id, code) values (p_user, 'level_5')
    on conflict (user_id, code) do nothing;
  end if;
  if v_total >= 100 then
    insert into public.student_achievements (user_id, code) values (p_user, 'xp_100')
    on conflict (user_id, code) do nothing;
  end if;
  return v_grant;
end;
$$;
revoke all on function public.award_xp(uuid, integer, text, uuid) from public, anon, authenticated;

create or replace function public.complete_plan_item(p_item_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item record;
  v_next_stage integer;
  v_interval integer;
  v_xp integer;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  select * into v_item from public.study_plan_items
    where id = p_item_id and user_id = v_user for update;
  if not found then raise exception 'item_not_found'; end if;
  if v_item.status = 'completed' then
    return jsonb_build_object('itemId', v_item.id, 'xpAwarded', 0, 'alreadyCompleted', true);
  end if;

  update public.study_plan_items
    set status = 'completed', completed_at = now(), updated_at = now()
    where id = v_item.id;

  if v_item.lesson_id is not null then
    insert into public.lesson_progress (user_id, lesson_id, subject_id, status, study_minutes, last_studied_at)
    values (v_user, v_item.lesson_id, v_item.subject_id, 'studied', v_item.duration_minutes, now())
    on conflict (user_id, lesson_id) do update set
      status = case when public.lesson_progress.status = 'mastered' then 'mastered' else 'studied' end,
      study_minutes = public.lesson_progress.study_minutes + excluded.study_minutes,
      last_studied_at = now();

    -- First spaced revision one day later (revise items advance the schedule below
    -- instead; re-opening stage 1 here would undo their own progress).
    if v_item.kind <> 'revise' then
      insert into public.revision_schedule (user_id, lesson_id, subject_id, title, stage, due_date, interval_days)
      values (v_user, v_item.lesson_id, v_item.subject_id, v_item.title, 1, (current_date + 1), 1)
      on conflict (user_id, lesson_id, stage) do update set
        due_date = least(public.revision_schedule.due_date, excluded.due_date),
        status = case when public.revision_schedule.status = 'done' then 'due' else public.revision_schedule.status end;
    end if;
  end if;

  -- Completing a revision item advances the spaced schedule instead of
  -- creating a duplicate revision.
  if v_item.kind = 'revise' and v_item.lesson_id is not null then
    update public.revision_schedule
      set status = 'done', completed_at = now()
      where user_id = v_user and lesson_id = v_item.lesson_id and status = 'due';
    select coalesce(max(stage), 0) + 1 into v_next_stage from public.revision_schedule
      where user_id = v_user and lesson_id = v_item.lesson_id;
    v_interval := least(60, power(2, greatest(v_next_stage - 1, 0))::integer);
    if v_next_stage <= 4 then
      insert into public.revision_schedule (user_id, lesson_id, subject_id, title, stage, due_date, interval_days)
      values (v_user, v_item.lesson_id, v_item.subject_id, v_item.title, v_next_stage,
        (current_date + v_interval), v_interval)
      on conflict (user_id, lesson_id, stage) do nothing;
    end if;
  end if;

  v_xp := public.award_xp(
    v_user, least(30, greatest(5, round(v_item.duration_minutes / 5.0)::integer)), 'plan_item', v_item.id);

  insert into public.student_achievements (user_id, code)
  select v_user, 'first_plan_item'
  where not exists (
    select 1 from public.student_achievements where user_id = v_user and code = 'first_plan_item'
  );

  return jsonb_build_object('itemId', v_item.id, 'xpAwarded', v_xp, 'alreadyCompleted', false);
end;
$$;
revoke all on function public.complete_plan_item(uuid) from public, anon;
grant execute on function public.complete_plan_item(uuid) to authenticated;

-- Replace the grading RPC so assessments also update mastery and revision.
-- (Dropped first: a 3-arg version with a DEFAULT collides with the 2-arg wrapper.)
drop function if exists public.submit_quiz_attempt(uuid, jsonb, integer);
create or replace function public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers jsonb,
  p_duration_seconds integer
)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_quiz record; v_total integer := 0; v_correct integer := 0;
  v_score integer := 0; v_results jsonb := '[]'::jsonb; v_question record; v_key record;
  v_answer text; v_is_correct boolean; v_attempt_id uuid; v_xp integer;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if jsonb_typeof(p_answers) is distinct from 'object' then
    raise exception 'invalid_answers';
  end if;
  if (select count(*) from jsonb_object_keys(p_answers)) > 500 then
    raise exception 'invalid_answers';
  end if;
  select * into v_quiz from public.quizzes where id = p_quiz_id and user_id = v_user;
  if not found then raise exception 'quiz_not_found'; end if;

  for v_question in
    select * from public.quiz_questions where quiz_id = p_quiz_id and user_id = v_user order by position
  loop
    v_total := v_total + 1;
    select * into v_key from public.quiz_question_keys
      where question_id = v_question.id and quiz_id = p_quiz_id and user_id = v_user;
    v_answer := coalesce(p_answers ->> v_question.id::text, '');
    if v_key is null then v_is_correct := false;
    elsif v_question.type = 'short_answer' then
      v_is_correct := lower(regexp_replace(trim(v_answer), '\s+', ' ', 'g'))
        = lower(regexp_replace(trim(v_key.correct_answer), '\s+', ' ', 'g'));
    else v_is_correct := trim(v_answer) = trim(v_key.correct_answer); end if;
    if v_is_correct then v_correct := v_correct + 1; end if;
    v_results := v_results || jsonb_build_object(
      'questionId', v_question.id, 'given', v_answer, 'correct', v_key.correct_answer,
      'isCorrect', v_is_correct, 'explanation', v_key.explanation, 'topic', v_question.topic);
  end loop;

  if v_total = 0 then raise exception 'quiz_empty'; end if;
  v_score := round((v_correct::numeric / v_total::numeric) * 100);

  insert into public.quiz_attempts
    (quiz_id, user_id, answers, results, score, correct_count, total_count, duration_seconds)
  values
    (p_quiz_id, v_user, p_answers, v_results, v_score, v_correct, v_total,
      least(greatest(coalesce(p_duration_seconds, 0), 0), 14400))
  returning id into v_attempt_id;

  if v_quiz.lesson_id is not null then
    insert into public.lesson_progress
      (user_id, lesson_id, subject_id, status, mastery, attempts, last_score, last_studied_at)
    values
      (v_user, v_quiz.lesson_id, v_quiz.subject_id,
       case when v_score >= 85 then 'mastered' else 'in_progress' end,
       v_score, 1, v_score, now())
    on conflict (user_id, lesson_id) do update set
      mastery = round((public.lesson_progress.mastery * 0.4) + (excluded.mastery * 0.6)),
      status = case
        when round((public.lesson_progress.mastery * 0.4) + (excluded.mastery * 0.6)) >= 85 then 'mastered'
        else 'in_progress' end,
      attempts = public.lesson_progress.attempts + 1,
      last_score = excluded.last_score,
      subject_id = coalesce(excluded.subject_id, public.lesson_progress.subject_id),
      last_studied_at = now();

    -- Weak result creates an early revision; strong result pushes it back.
    insert into public.revision_schedule
      (user_id, lesson_id, subject_id, title, stage, due_date, interval_days, last_score)
    values
      (v_user, v_quiz.lesson_id, v_quiz.subject_id, v_quiz.title, 1,
       current_date + case when v_score < 60 then 1 else 3 end,
       case when v_score < 60 then 1 else 3 end, v_score)
    on conflict (user_id, lesson_id, stage) do update set
      status = 'due',
      due_date = least(public.revision_schedule.due_date, excluded.due_date),
      last_score = excluded.last_score;

    if v_score < 60 then
      insert into public.learning_recommendations
        (user_id, kind, lesson_id, subject_id, title, reason, priority)
      values
        (v_user, 'lesson', v_quiz.lesson_id, v_quiz.subject_id, v_quiz.title,
         'assessment_below_60', 1)
      on conflict do nothing;
    end if;
  end if;

  -- XP only for the first attempt of a quiz: results reveal the answers, so
  -- paid retakes would be a trivial XP loop. Mastery still updates on retakes.
  v_xp := public.award_xp(
    v_user, greatest(5, least(40, round(v_score / 2.5)::integer)), 'quiz_attempt', p_quiz_id);

  return jsonb_build_object(
    'attemptId', v_attempt_id, 'score', v_score, 'correctCount', v_correct,
    'totalCount', v_total, 'results', v_results, 'xpAwarded', v_xp);
end;
$$;
revoke all on function public.submit_quiz_attempt(uuid, jsonb, integer) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, jsonb, integer) to authenticated;

-- Keep the old two-argument signature working for already-deployed clients.
drop function if exists public.submit_quiz_attempt(uuid, jsonb);
create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns jsonb language sql security definer set search_path = public
as $$ select public.submit_quiz_attempt(p_quiz_id, p_answers, null::integer); $$;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

create or replace function public.join_study_room(p_code text)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_room record;
  v_existing record;
  v_count integer;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  select * into v_room from public.study_rooms
    where code = upper(trim(p_code)) for update;
  if not found then raise exception 'room_not_found'; end if;
  if v_room.status = 'closed' or v_room.expires_at < now() then
    raise exception 'room_closed';
  end if;

  select * into v_existing from public.study_room_participants
    where room_id = v_room.id and user_id = v_user;
  -- A member the owner removed stays removed.
  if found and v_existing.status = 'removed' then raise exception 'removed_from_room'; end if;

  -- Capacity applies to everyone who is not currently active (new or returning).
  if not (found and v_existing.status = 'active') then
    select count(*) into v_count from public.study_room_participants
      where room_id = v_room.id and status = 'active';
    if v_count >= v_room.max_participants then raise exception 'room_full'; end if;
  end if;

  insert into public.study_room_participants (room_id, user_id, role, status, joined_at, last_seen_at)
  values (v_room.id, v_user, case when v_room.owner_id = v_user then 'owner' else 'member' end,
    'active', now(), now())
  on conflict (room_id, user_id) do update
    set status = 'active', last_seen_at = now()
    where public.study_room_participants.status <> 'removed';

  return jsonb_build_object('roomId', v_room.id, 'code', v_room.code, 'name', v_room.name);
end;
$$;
revoke all on function public.join_study_room(text) from public, anon;
grant execute on function public.join_study_room(text) to authenticated;

create or replace function public.get_room_challenge(p_challenge_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_challenge record;
  v_quiz record;
  v_questions jsonb;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into v_challenge from public.study_challenges where id = p_challenge_id;
  if not found then raise exception 'challenge_not_found'; end if;
  if not public.is_room_member(v_challenge.room_id) then raise exception 'not_a_member'; end if;
  if v_challenge.status not in ('active', 'finished') then raise exception 'challenge_not_active'; end if;

  select id, title, time_limit_minutes into v_quiz from public.quizzes where id = v_challenge.quiz_id;
  if not found then raise exception 'quiz_not_found'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id, 'type', q.type, 'prompt', q.prompt, 'options', q.options, 'position', q.position
  ) order by q.position), '[]'::jsonb) into v_questions
  from public.quiz_questions q where q.quiz_id = v_challenge.quiz_id;

  return jsonb_build_object(
    'challengeId', v_challenge.id,
    'status', v_challenge.status,
    'endsAt', v_challenge.ends_at,
    'quiz', jsonb_build_object(
      'id', v_quiz.id, 'title', v_quiz.title,
      'timeLimitMinutes', v_quiz.time_limit_minutes, 'questions', v_questions
    )
  );
end;
$$;
revoke all on function public.get_room_challenge(uuid) from public, anon;
grant execute on function public.get_room_challenge(uuid) to authenticated;

-- Grading for synchronized challenges happens entirely on the server.
create or replace function public.submit_challenge_answers(
  p_challenge_id uuid,
  p_answers jsonb
)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_challenge record;
  v_total integer := 0;
  v_correct integer := 0;
  v_score integer := 0;
  v_question record;
  v_key record;
  v_answer text;
  v_is_correct boolean;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if jsonb_typeof(p_answers) is distinct from 'object' then
    raise exception 'invalid_answers';
  end if;
  if (select count(*) from jsonb_object_keys(p_answers)) > 500 then
    raise exception 'invalid_answers';
  end if;
  select * into v_challenge from public.study_challenges where id = p_challenge_id;
  if not found then raise exception 'challenge_not_found'; end if;
  if v_challenge.status <> 'active' then raise exception 'challenge_not_active'; end if;
  if v_challenge.ends_at is not null and now() > v_challenge.ends_at + interval '10 seconds' then
    raise exception 'challenge_ended';
  end if;
  if not public.is_room_member(v_challenge.room_id) then raise exception 'not_a_member'; end if;
  if exists (
    select 1 from public.challenge_attempts
    where challenge_id = p_challenge_id and user_id = v_user
  ) then
    raise exception 'already_submitted';
  end if;

  for v_question in
    select * from public.quiz_questions where quiz_id = v_challenge.quiz_id order by position
  loop
    v_total := v_total + 1;
    select correct_answer into v_key from public.quiz_question_keys
      where question_id = v_question.id;
    v_answer := coalesce(p_answers ->> v_question.id::text, '');
    if v_key.correct_answer is null then
      v_is_correct := false;
    elsif v_question.type = 'short_answer' then
      v_is_correct := lower(regexp_replace(trim(v_answer), '\s+', ' ', 'g'))
        = lower(regexp_replace(trim(v_key.correct_answer), '\s+', ' ', 'g'));
    else
      v_is_correct := trim(v_answer) = trim(v_key.correct_answer);
    end if;
    if v_is_correct then v_correct := v_correct + 1; end if;
  end loop;

  if v_total = 0 then raise exception 'quiz_empty'; end if;
  v_score := round((v_correct::numeric / v_total::numeric) * 100);

  insert into public.challenge_attempts
    (challenge_id, user_id, score, correct_count, total_count, duration_seconds)
  values
    (p_challenge_id, v_user, v_score, v_correct, v_total,
      greatest(0, extract(epoch from (now() - coalesce(v_challenge.started_at, now())))::integer));

  -- participants.score is not client-writable; the server records it here.
  update public.study_room_participants set score = v_score
    where room_id = v_challenge.room_id and user_id = v_user;

  perform public.award_xp(v_user, 10, 'challenge', p_challenge_id);
  return jsonb_build_object(
    'challengeId', p_challenge_id, 'score', v_score,
    'correctCount', v_correct, 'totalCount', v_total);
end;
$$;
revoke all on function public.submit_challenge_answers(uuid, jsonb) from public, anon;
grant execute on function public.submit_challenge_answers(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['student_profiles', 'study_plans', 'study_plan_items', 'lessons', 'exam_archives']
  loop
    execute format('drop trigger if exists touch_%1$s_updated_at on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s_updated_at before update on public.%1$s for each row execute function public.touch_updated_at()',
      t
    );
  end loop;
end $$;

-- Row-level guards. They only constrain direct client writes (anon/authenticated);
-- definer RPCs run as the function owner and service_role is not restricted.
create or replace function public.guard_room_participant_write()
returns trigger language plpgsql set search_path = public
as $$
declare
  v_owner uuid;
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;

  if tg_op = 'INSERT' then
    if new.role <> 'owner' or new.status <> 'active' or new.score is not null then
      raise exception 'participant_insert_forbidden';
    end if;
    return new;
  end if;

  if new.room_id <> old.room_id or new.user_id <> old.user_id or new.role <> old.role
     or new.joined_at <> old.joined_at or new.score is distinct from old.score then
    raise exception 'participant_field_immutable';
  end if;

  select owner_id into v_owner from public.study_rooms where id = old.room_id;

  if old.user_id = auth.uid() then
    -- A member may leave or send a heartbeat. Never re-activate or un-remove.
    if new.status is distinct from old.status
       and not (old.status = 'active' and new.status = 'left') then
      raise exception 'invalid_status_transition';
    end if;
  elsif v_owner = auth.uid() then
    -- The owner may remove other members, nothing else.
    if new.last_seen_at is distinct from old.last_seen_at
       or (new.status is distinct from old.status and new.status <> 'removed') then
      raise exception 'invalid_status_transition';
    end if;
  else
    raise exception 'not_allowed';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_room_participant_write() from public, anon, authenticated;
drop trigger if exists guard_room_participant_write on public.study_room_participants;
create trigger guard_room_participant_write
  before insert or update on public.study_room_participants
  for each row execute function public.guard_room_participant_write();

-- Completion is awarded by complete_plan_item(); the client cannot set or undo it.
create or replace function public.guard_plan_item_completion()
returns trigger language plpgsql set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if tg_op = 'INSERT' then
    if new.status = 'completed' or new.completed_at is not null then
      raise exception 'use_complete_plan_item';
    end if;
  elsif (new.status is distinct from old.status and (new.status = 'completed' or old.status = 'completed'))
     or new.completed_at is distinct from old.completed_at then
    raise exception 'use_complete_plan_item';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_plan_item_completion() from public, anon, authenticated;
drop trigger if exists guard_plan_item_completion on public.study_plan_items;
create trigger guard_plan_item_completion
  before insert or update on public.study_plan_items
  for each row execute function public.guard_plan_item_completion();

-- ---------------------------------------------------------------------------
-- Realtime for live study rooms (ignore when already published)
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.study_room_participants;
  exception when duplicate_object or undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.study_challenges;
  exception when duplicate_object or undefined_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Table privileges. Supabase's default privileges can pre-grant ALL on new
-- public tables to anon/authenticated, so strip everything first and grant back
-- only what the app needs. RLS then decides which rows are visible.
-- ---------------------------------------------------------------------------
revoke all on table
  public.educational_systems, public.academic_stages, public.grade_levels, public.academic_tracks,
  public.subjects, public.curriculum_units, public.lessons, public.lesson_objectives,
  public.exam_archives, public.exam_archive_questions, public.exam_topic_frequency,
  public.student_profiles, public.student_subjects, public.study_plans, public.study_plan_items,
  public.lesson_progress, public.revision_schedule, public.learning_recommendations,
  public.audio_lessons, public.student_xp, public.student_achievements, public.xp_events,
  public.study_rooms, public.study_room_participants, public.study_challenges,
  public.challenge_attempts, public.study_room_reports
from anon, authenticated;

-- Catalog: read for students; writes are gated by the admin RLS policies.
grant select on public.educational_systems, public.academic_stages, public.grade_levels,
  public.academic_tracks, public.subjects, public.curriculum_units, public.lessons,
  public.lesson_objectives, public.exam_archives, public.exam_archive_questions,
  public.exam_topic_frequency
  to authenticated;
grant insert, update, delete on public.educational_systems, public.academic_stages,
  public.grade_levels, public.academic_tracks, public.subjects, public.curriculum_units,
  public.lessons, public.lesson_objectives, public.exam_archives, public.exam_archive_questions
  to authenticated;

-- Student-owned data.
grant select, insert, update on public.student_profiles to authenticated;
grant select, insert, update, delete on public.student_subjects to authenticated;
grant select, insert, update, delete on public.study_plans to authenticated;
grant select, insert, update, delete on public.study_plan_items to authenticated;
grant select, insert, update, delete on public.audio_lessons to authenticated;

-- Server-written progress: read-only for the client (revision/recommendations: status only).
grant select on public.lesson_progress, public.student_xp, public.student_achievements to authenticated;
grant select on public.revision_schedule to authenticated;
grant update (status) on public.revision_schedule to authenticated;
grant select, delete on public.learning_recommendations to authenticated;
grant update (status) on public.learning_recommendations to authenticated;

-- Study rooms: column-level grants keep code/owner/role/score out of client reach.
grant select on public.study_rooms to authenticated;
grant insert (code, name, subject_id, lesson_id, owner_id, status, max_participants, expires_at)
  on public.study_rooms to authenticated;
grant update (name, subject_id, lesson_id, status, max_participants, expires_at)
  on public.study_rooms to authenticated;
grant select on public.study_room_participants to authenticated;
grant insert (room_id, user_id, role) on public.study_room_participants to authenticated;
grant update (status, last_seen_at) on public.study_room_participants to authenticated;
grant select, insert, update, delete on public.study_challenges to authenticated;
grant select on public.challenge_attempts to authenticated;
grant select on public.study_room_reports to authenticated;
grant insert (room_id, reporter_id, reason) on public.study_room_reports to authenticated;
grant update (status) on public.study_room_reports to authenticated;
-- xp_events: no client access at all.

-- ---------------------------------------------------------------------------
-- Seed catalog (structure only; admins add units/lessons content)
-- ---------------------------------------------------------------------------
insert into public.educational_systems (code, name_ar, name_en, country_code)
values ('eg_general', 'التعليم المصري', 'Egyptian Education', 'EG')
on conflict (code) do nothing;

with system as (
  select id from public.educational_systems where code = 'eg_general'
),
stage as (
  insert into public.academic_stages (system_id, code, name_ar, name_en, position)
  select id, 'secondary', 'المرحلة الثانوية', 'Secondary', 1 from system
  on conflict (system_id, code) do update set name_ar = excluded.name_ar
  returning id, system_id
)
insert into public.grade_levels (stage_id, code, name_ar, name_en, position)
select stage.id, g.code, g.name_ar, g.name_en, g.position
from stage
cross join (values
  ('g10', 'الصف الأول الثانوي', 'Grade 10', 1),
  ('g11', 'الصف الثاني الثانوي', 'Grade 11', 2),
  ('g12', 'الصف الثالث الثانوي', 'Grade 12', 3)
) as g(code, name_ar, name_en, position)
on conflict (stage_id, code) do nothing;

insert into public.academic_tracks (grade_id, code, name_ar, name_en, position)
select gl.id, t.code, t.name_ar, t.name_en, t.position
from public.grade_levels gl
cross join (values
  ('general', 'عام', 'General', 1),
  ('baccalaureate', 'البكالوريا المصرية', 'Egyptian Baccalaureate', 2),
  ('science', 'علمي علوم', 'Science', 3),
  ('math', 'علمي رياضة', 'Mathematics', 4),
  ('literature', 'أدبي', 'Literature', 5)
) as t(code, name_ar, name_en, position)
where gl.code in ('g11', 'g12')
on conflict (grade_id, code) do nothing;

-- Shared subject catalog. Subject names are catalog entries, not curriculum
-- claims; units and lessons are added by administrators.
insert into public.subjects (grade_id, track_id, code, name_ar, name_en, color, position)
select gl.id, null, s.code, s.name_ar, s.name_en, s.color, s.position
from public.grade_levels gl
cross join (values
  ('arabic', 'اللغة العربية', 'Arabic', 'emerald', 1),
  ('english', 'اللغة الإنجليزية', 'English', 'sky', 2),
  ('math', 'الرياضيات', 'Mathematics', 'violet', 3),
  ('physics', 'الفيزياء', 'Physics', 'amber', 4),
  ('chemistry', 'الكيمياء', 'Chemistry', 'rose', 5),
  ('biology', 'الأحياء', 'Biology', 'cyan', 6),
  ('history', 'التاريخ', 'History', 'orange', 7),
  ('geography', 'الجغرافيا', 'Geography', 'lime', 8),
  ('philosophy', 'الفلسفة', 'Philosophy', 'indigo', 9),
  ('computer_science', 'علوم الحاسب', 'Computer Science', 'teal', 10)
) as s(code, name_ar, name_en, color, position)
on conflict (grade_id, code) where track_id is null do nothing;

commit;