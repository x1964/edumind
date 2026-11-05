-- ===========================================================================
-- Raise the study material upload limit from 20 MB to 50 MB.
-- ===========================================================================

begin;

-- Drop whatever auto-generated check constraint guards file_size.
do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'public.materials'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%file_size%'
  loop
    execute format('alter table public.materials drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.materials
  add constraint materials_file_size_check
  check (file_size > 0 and file_size <= 52428800);

update storage.buckets
  set file_size_limit = 52428800
  where id = 'materials';

commit;
