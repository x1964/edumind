-- Like membership is exposed only as a per-post count and the caller's own boolean via Feed RPCs.
-- Do not expose the voter user_id list through direct PostgREST table reads.
drop policy if exists student_post_likes_read_authenticated on public.student_post_likes;
revoke select on public.student_post_likes from anon, authenticated;
