-- EduMind Push reminders: one notification per task/due-date/window.
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

-- Reminder claims are server-owned. Students do not need direct table access.
revoke all on public.push_task_reminders from anon, authenticated;
