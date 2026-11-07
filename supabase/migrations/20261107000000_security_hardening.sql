begin;

-- Trusted application roles. There is intentionally no client INSERT/UPDATE policy.
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;

drop function if exists public.has_role(text);
create function public.has_role(p_role text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select p_role in ('teacher', 'admin')
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = p_role
    );
$$;
revoke all on function public.has_role(text) from public;
grant execute on function public.has_role(text) to authenticated;

-- Parent ownership is checked in the database, not only by RLS/application code.
create or replace function public.validate_quiz_question_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare parent_user uuid;
begin
  select user_id into parent_user from public.quizzes where id = new.quiz_id;
  if parent_user is null or parent_user <> new.user_id then
    raise exception 'quiz_question_owner_mismatch';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_quiz_question_owner on public.quiz_questions;
create trigger validate_quiz_question_owner
before insert or update of quiz_id, user_id on public.quiz_questions
for each row execute function public.validate_quiz_question_owner();

create or replace function public.validate_quiz_key_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare question_quiz uuid;
declare question_user uuid;
declare parent_user uuid;
begin
  select quiz_id, user_id into question_quiz, question_user
  from public.quiz_questions where id = new.question_id;
  select user_id into parent_user from public.quizzes where id = new.quiz_id;
  if question_quiz is null or question_quiz <> new.quiz_id
     or question_user is null or question_user <> new.user_id
     or parent_user is null or parent_user <> new.user_id then
    raise exception 'quiz_question_key_owner_mismatch';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_quiz_key_owner on public.quiz_question_keys;
create trigger validate_quiz_key_owner
before insert or update of question_id, quiz_id, user_id on public.quiz_question_keys
for each row execute function public.validate_quiz_key_owner();

-- Tighten policies so a row cannot be attached to another user's parent.
drop policy if exists "quizzes_update_own" on public.quizzes;
create policy "quizzes_update_own" on public.quizzes
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quiz_questions_insert_own" on public.quiz_questions;
create policy "quiz_questions_insert_own" on public.quiz_questions
for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid()
  )
);
drop policy if exists "quiz_questions_update_own" on public.quiz_questions;
create policy "quiz_questions_update_own" on public.quiz_questions
for update to authenticated using (auth.uid() = user_id) with check (
  auth.uid() = user_id and exists (
    select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid()
  )
);

drop policy if exists "quiz_question_keys_insert_own" on public.quiz_question_keys;
create policy "quiz_question_keys_insert_own" on public.quiz_question_keys
for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id and qq.quiz_id = quiz_question_keys.quiz_id
      and qq.user_id = auth.uid() and q.user_id = auth.uid()
  )
);
drop policy if exists "quiz_question_keys_update_own" on public.quiz_question_keys;
create policy "quiz_question_keys_update_own" on public.quiz_question_keys
for update to authenticated using (auth.uid() = user_id) with check (
  auth.uid() = user_id and exists (
    select 1 from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = question_id and qq.quiz_id = quiz_question_keys.quiz_id
      and qq.user_id = auth.uid() and q.user_id = auth.uid()
  )
);

-- Recreate the definer RPC with owner-scoped question/key reads.
create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid(); v_quiz record; v_total integer := 0; v_correct integer := 0;
  v_score integer := 0; v_results jsonb := '[]'::jsonb; v_question record; v_key record;
  v_answer text; v_is_correct boolean; v_attempt_id uuid;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if jsonb_typeof(p_answers) <> 'object' or jsonb_object_length(p_answers) > 500 then
    raise exception 'invalid_answers';
  end if;
  select * into v_quiz from public.quizzes where id = p_quiz_id and user_id = v_user;
  if not found then raise exception 'quiz_not_found'; end if;
  for v_question in select * from public.quiz_questions where quiz_id = p_quiz_id and user_id = v_user order by position loop
    v_total := v_total + 1;
    select * into v_key from public.quiz_question_keys
      where question_id = v_question.id and quiz_id = p_quiz_id and user_id = v_user;
    v_answer := coalesce(p_answers ->> v_question.id::text, '');
    if v_key is null then v_is_correct := false;
    elsif v_question.type = 'short_answer' then
      v_is_correct := lower(regexp_replace(trim(v_answer), '\s+', ' ', 'g')) = lower(regexp_replace(trim(v_key.correct_answer), '\s+', ' ', 'g'));
    else v_is_correct := trim(v_answer) = trim(v_key.correct_answer); end if;
    if v_is_correct then v_correct := v_correct + 1; end if;
    v_results := v_results || jsonb_build_object('questionId', v_question.id, 'given', v_answer, 'correct', v_key.correct_answer, 'isCorrect', v_is_correct, 'explanation', v_key.explanation);
  end loop;
  if v_total = 0 then raise exception 'quiz_empty'; end if;
  v_score := round((v_correct::numeric / v_total::numeric) * 100);
  insert into public.quiz_attempts (quiz_id, user_id, answers, results, score, correct_count, total_count)
  values (p_quiz_id, v_user, p_answers, v_results, v_score, v_correct, v_total) returning id into v_attempt_id;
  return jsonb_build_object('attemptId', v_attempt_id, 'score', v_score, 'correctCount', v_correct, 'totalCount', v_total, 'results', v_results);
end;
$$;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

commit;
