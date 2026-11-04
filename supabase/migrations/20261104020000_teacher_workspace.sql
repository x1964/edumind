begin;

create table if not exists public.teacher_students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  email text,
  grade_level text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teacher_students_teacher_idx
  on public.teacher_students (teacher_id, status, created_at desc);

alter table public.teacher_students enable row level security;
drop policy if exists "teacher_students_select_own" on public.teacher_students;
create policy "teacher_students_select_own" on public.teacher_students
  for select to authenticated using (auth.uid() = teacher_id);
drop policy if exists "teacher_students_insert_own" on public.teacher_students;
create policy "teacher_students_insert_own" on public.teacher_students
  for insert to authenticated with check (auth.uid() = teacher_id);
drop policy if exists "teacher_students_update_own" on public.teacher_students;
create policy "teacher_students_update_own" on public.teacher_students
  for update to authenticated using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
drop policy if exists "teacher_students_delete_own" on public.teacher_students;
create policy "teacher_students_delete_own" on public.teacher_students
  for delete to authenticated using (auth.uid() = teacher_id);
drop trigger if exists touch_teacher_students_updated_at on public.teacher_students;
create trigger touch_teacher_students_updated_at before update on public.teacher_students
  for each row execute function public.touch_updated_at();

create table if not exists public.teacher_student_activity (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.teacher_students (id) on delete cascade,
  activity_date date not null default current_date,
  engagement_score integer check (engagement_score between 0 and 100),
  completion_rate integer check (completion_rate between 0 and 100),
  quiz_score integer check (quiz_score between 0 and 100),
  minutes_studied integer check (minutes_studied between 0 and 1440),
  notes text,
  created_at timestamptz not null default now(),
  unique (student_id, activity_date)
);

create index if not exists teacher_activity_teacher_date_idx
  on public.teacher_student_activity (teacher_id, activity_date desc);

alter table public.teacher_student_activity enable row level security;
drop policy if exists "teacher_activity_select_own" on public.teacher_student_activity;
create policy "teacher_activity_select_own" on public.teacher_student_activity
  for select to authenticated using (auth.uid() = teacher_id);
drop policy if exists "teacher_activity_insert_own" on public.teacher_student_activity;
create policy "teacher_activity_insert_own" on public.teacher_student_activity
  for insert to authenticated with check (auth.uid() = teacher_id);
drop policy if exists "teacher_activity_update_own" on public.teacher_student_activity;
create policy "teacher_activity_update_own" on public.teacher_student_activity
  for update to authenticated using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
drop policy if exists "teacher_activity_delete_own" on public.teacher_student_activity;
create policy "teacher_activity_delete_own" on public.teacher_student_activity
  for delete to authenticated using (auth.uid() = teacher_id);

create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  material_id uuid references public.materials (id) on delete set null,
  title text not null,
  subject text not null,
  grade_level text,
  duration_minutes integer not null check (duration_minutes between 10 and 240),
  objectives jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  assessment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists lesson_plans_teacher_idx
  on public.lesson_plans (teacher_id, created_at desc);

alter table public.lesson_plans enable row level security;
drop policy if exists "lesson_plans_select_own" on public.lesson_plans;
create policy "lesson_plans_select_own" on public.lesson_plans
  for select to authenticated using (auth.uid() = teacher_id);
drop policy if exists "lesson_plans_insert_own" on public.lesson_plans;
create policy "lesson_plans_insert_own" on public.lesson_plans
  for insert to authenticated with check (auth.uid() = teacher_id);
drop policy if exists "lesson_plans_delete_own" on public.lesson_plans;
create policy "lesson_plans_delete_own" on public.lesson_plans
  for delete to authenticated using (auth.uid() = teacher_id);

create table if not exists public.teacher_daily_reports (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  report_date date not null default current_date,
  summary text not null,
  highlights jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (teacher_id, report_date)
);

create index if not exists teacher_reports_teacher_date_idx
  on public.teacher_daily_reports (teacher_id, report_date desc);

alter table public.teacher_daily_reports enable row level security;
drop policy if exists "teacher_reports_select_own" on public.teacher_daily_reports;
create policy "teacher_reports_select_own" on public.teacher_daily_reports
  for select to authenticated using (auth.uid() = teacher_id);
drop policy if exists "teacher_reports_insert_own" on public.teacher_daily_reports;
create policy "teacher_reports_insert_own" on public.teacher_daily_reports
  for insert to authenticated with check (auth.uid() = teacher_id);
drop policy if exists "teacher_reports_update_own" on public.teacher_daily_reports;
create policy "teacher_reports_update_own" on public.teacher_daily_reports
  for update to authenticated using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

grant select, insert, update, delete on public.teacher_students to authenticated;
grant select, insert, update, delete on public.teacher_student_activity to authenticated;
grant select, insert, delete on public.lesson_plans to authenticated;
grant select, insert, update on public.teacher_daily_reports to authenticated;

commit;
