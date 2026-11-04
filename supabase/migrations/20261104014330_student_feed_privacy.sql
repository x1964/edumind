-- Like membership is exposed only through authenticated Feed RPC responses.
-- Keep this version aligned with the migration applied to the linked Supabase project.
drop policy if exists student_post_likes_read_authenticated on public.student_post_likes;
revoke select on public.student_post_likes from anon, authenticated;
