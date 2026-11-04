-- EduMind Student Feed: authenticated student posts, likes, comments, reports, and public read-only image delivery.
-- Additive and idempotent: existing learning data and policies are untouched.

create table if not exists public.student_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Student',
  author_avatar_url text,
  content text not null check (char_length(btrim(content)) between 1 and 3000),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists student_posts_feed_idx on public.student_posts (created_at desc, id desc);
create index if not exists student_posts_user_idx on public.student_posts (user_id, created_at desc);

create table if not exists public.student_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.student_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint student_post_likes_unique unique (post_id, user_id)
);
create index if not exists student_post_likes_post_idx on public.student_post_likes (post_id);

create table if not exists public.student_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.student_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Student',
  author_avatar_url text,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists student_post_comments_post_idx on public.student_post_comments (post_id, created_at desc);
create index if not exists student_post_comments_user_idx on public.student_post_comments (user_id, created_at desc);

create table if not exists public.student_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.student_posts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  created_at timestamptz not null default now(),
  constraint student_post_reports_unique unique (post_id, reporter_id)
);
create index if not exists student_post_reports_created_idx on public.student_post_reports (created_at desc);

-- Author snapshots are sourced from the caller's own profile, never trusted from request payloads.
create or replace function public.set_student_feed_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_avatar text;
begin
  if auth.uid() is null or new.user_id <> auth.uid() then
    raise exception 'not_authenticated';
  end if;
  select coalesce(nullif(btrim(full_name), ''), 'Student'), avatar_url
    into v_name, v_avatar
    from public.profiles
    where id = auth.uid();
  if tg_table_name = 'student_posts' then
    new.author_name := coalesce(v_name, 'Student');
    new.author_avatar_url := v_avatar;
  else
    new.author_name := coalesce(v_name, 'Student');
    new.author_avatar_url := v_avatar;
  end if;
  return new;
end;
$$;
revoke all on function public.set_student_feed_author() from public, anon, authenticated;

drop trigger if exists student_posts_set_author on public.student_posts;
create trigger student_posts_set_author before insert on public.student_posts
for each row execute function public.set_student_feed_author();
drop trigger if exists student_post_comments_set_author on public.student_post_comments;
create trigger student_post_comments_set_author before insert on public.student_post_comments
for each row execute function public.set_student_feed_author();
drop trigger if exists touch_student_posts_updated_at on public.student_posts;
create trigger touch_student_posts_updated_at before update on public.student_posts
for each row execute function public.touch_updated_at();
drop trigger if exists touch_student_post_comments_updated_at on public.student_post_comments;
create trigger touch_student_post_comments_updated_at before update on public.student_post_comments
for each row execute function public.touch_updated_at();

alter table public.student_posts enable row level security;
alter table public.student_post_likes enable row level security;
alter table public.student_post_comments enable row level security;
alter table public.student_post_reports enable row level security;

drop policy if exists student_posts_read_authenticated on public.student_posts;
create policy student_posts_read_authenticated on public.student_posts
for select to authenticated using (true);
drop policy if exists student_posts_insert_own on public.student_posts;
create policy student_posts_insert_own on public.student_posts
for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists student_posts_delete_own on public.student_posts;
create policy student_posts_delete_own on public.student_posts
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists student_post_likes_read_authenticated on public.student_post_likes;
create policy student_post_likes_read_authenticated on public.student_post_likes
for select to authenticated using (true);
drop policy if exists student_post_likes_insert_own on public.student_post_likes;
create policy student_post_likes_insert_own on public.student_post_likes
for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists student_post_likes_delete_own on public.student_post_likes;
create policy student_post_likes_delete_own on public.student_post_likes
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists student_post_comments_read_authenticated on public.student_post_comments;
create policy student_post_comments_read_authenticated on public.student_post_comments
for select to authenticated using (true);
drop policy if exists student_post_comments_insert_own on public.student_post_comments;
create policy student_post_comments_insert_own on public.student_post_comments
for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists student_post_comments_delete_own on public.student_post_comments;
create policy student_post_comments_delete_own on public.student_post_comments
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists student_post_reports_insert_own on public.student_post_reports;
create policy student_post_reports_insert_own on public.student_post_reports
for insert to authenticated with check (auth.uid() = reporter_id);

-- Explicit table grants: no post/comment updates, no report reads/updates/deletes.
revoke all on public.student_posts, public.student_post_likes, public.student_post_comments, public.student_post_reports from anon, authenticated;
grant select, insert, delete on public.student_posts to authenticated;
grant select, insert, delete on public.student_post_likes to authenticated;
grant select, insert, delete on public.student_post_comments to authenticated;
grant insert on public.student_post_reports to authenticated;

create or replace function public.get_student_feed(
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 20
)
returns table (
  id uuid,
  user_id uuid,
  author_name text,
  author_avatar_url text,
  content text,
  image_path text,
  created_at timestamptz,
  likes_count bigint,
  comments_count bigint,
  liked_by_me boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if (p_before_created_at is null) <> (p_before_id is null) then
    raise exception 'invalid_cursor';
  end if;
  return query
    select p.id, p.user_id, p.author_name, p.author_avatar_url, p.content, p.image_path, p.created_at,
      (select count(*) from public.student_post_likes l where l.post_id = p.id),
      (select count(*) from public.student_post_comments c where c.post_id = p.id),
      exists(select 1 from public.student_post_likes l where l.post_id = p.id and l.user_id = v_user)
    from public.student_posts p
    where p_before_created_at is null or (p.created_at, p.id) < (p_before_created_at, p_before_id)
    order by p.created_at desc, p.id desc
    limit least(greatest(coalesce(p_limit, 20), 1), 30);
end;
$$;
revoke all on function public.get_student_feed(timestamptz, uuid, integer) from public, anon;
grant execute on function public.get_student_feed(timestamptz, uuid, integer) to authenticated;

create or replace function public.toggle_student_post_like(p_post_id uuid)
returns table (liked boolean, likes_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if not exists(select 1 from public.student_posts p where p.id = p_post_id) then
    raise exception 'post_not_found';
  end if;
  if exists(select 1 from public.student_post_likes l where l.post_id = p_post_id and l.user_id = v_user) then
    delete from public.student_post_likes l where l.post_id = p_post_id and l.user_id = v_user;
    liked := false;
  else
    insert into public.student_post_likes(post_id, user_id) values (p_post_id, v_user)
      on conflict (post_id, user_id) do nothing;
    liked := true;
  end if;
  select count(*) into likes_count from public.student_post_likes l where l.post_id = p_post_id;
  return next;
end;
$$;
revoke all on function public.toggle_student_post_like(uuid) from public, anon;
grant execute on function public.toggle_student_post_like(uuid) to authenticated;

-- Feed images are intentionally readable by signed-in students via public URLs; write/delete stay user-folder scoped.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-feed-images', 'student-feed-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists student_feed_images_insert_own on storage.objects;
create policy student_feed_images_insert_own on storage.objects
for insert to authenticated with check (
  bucket_id = 'student-feed-images' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists student_feed_images_update_own on storage.objects;
create policy student_feed_images_update_own on storage.objects
for update to authenticated using (
  bucket_id = 'student-feed-images' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'student-feed-images' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists student_feed_images_delete_own on storage.objects;
create policy student_feed_images_delete_own on storage.objects
for delete to authenticated using (
  bucket_id = 'student-feed-images' and (storage.foldername(name))[1] = auth.uid()::text
);
