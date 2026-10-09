-- The welcome letter shown to the writer. Its text lives in private.settings
-- (key 'welcome_letter'), not in the public repo or web bundle; only signed-in
-- users can read it, through this function.
create function public.get_welcome_letter()
returns text
language sql
stable
security definer set search_path = ''
as $$
  select value from private.settings where key = 'welcome_letter';
$$;
revoke execute on function public.get_welcome_letter() from public, anon;
grant execute on function public.get_welcome_letter() to authenticated;
