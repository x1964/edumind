begin;

-- Distributed rate limiting without an external Redis dependency.
-- The application prefers Upstash when it is configured, then this RPC, then a
-- bounded in-memory fallback. Buckets are keyed per authenticated user by the
-- caller, and the function refuses keys that are not scoped to auth.uid().
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
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_uid text := auth.uid()::text;
  v_count integer;
  v_reset timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
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

  -- Opportunistic cleanup so the table never grows without bound.
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

commit;
