-- Everyone picks their own name on first launch. Names are unique (ignoring
-- case); an empty name means "not picked yet".
alter table public.profiles alter column name set default '';
alter table public.profiles add constraint profiles_name_length check (char_length(name) <= 30);
create unique index profiles_name_unique on public.profiles (lower(btrim(name))) where btrim(name) <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- New users start without a name and choose one in the app.
  insert into public.profiles (id, name, is_admin) values (new.id, '', false);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
