-- Lets writers see who reads their things (the master account's name), without
-- exposing any other profile.
create or replace function public.get_reader_name()
returns text
language sql
stable
security definer set search_path = ''
as $$
  select string_agg(name, ', ' order by name) from public.profiles where is_admin and btrim(name) <> '';
$$;
revoke execute on function public.get_reader_name() from public, anon;
grant execute on function public.get_reader_name() to authenticated;
