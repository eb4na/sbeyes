-- Private settings (not exposed through the API). The reader's email is stored
-- here, not in the repo, so it stays out of source control. Set it with:
--   insert into private.settings (key, value) values ('reader_email', '<email>');
create table private.settings (
  key   text primary key,
  value text not null
);
revoke all on private.settings from public, anon, authenticated;

-- Sign-up: the reader's email becomes the admin; everyone else is the writer, Dohyun.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  reader_email text := (select value from private.settings where key = 'reader_email');
  is_reader boolean := reader_email is not null and lower(new.email) = lower(reader_email);
begin
  insert into public.profiles (id, name, is_admin)
  values (
    new.id,
    case when is_reader
      then coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
      else 'Dohyun'
    end,
    is_reader
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
