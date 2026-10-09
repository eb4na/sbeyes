-- No login: users are anonymous (no email). Every new user is a writer named
-- Dohyun; the reader is chosen by setting profiles.is_admin by ID.
-- Requires Authentication → Sign In / Providers → "Allow anonymous sign-ins".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  reader_email text := (select value from private.settings where key = 'reader_email');
  is_reader boolean := coalesce(new.email is not null and lower(new.email) = lower(reader_email), false);
begin
  insert into public.profiles (id, name, is_admin)
  values (
    new.id,
    case when is_reader
      then coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1))
      else 'Dohyun'
    end,
    is_reader
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
