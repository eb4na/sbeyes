-- Username + password accounts, no email. Supabase Auth keys accounts by email,
-- so each username maps to a placeholder address on the reserved ".example"
-- domain (never mailed). register() creates the account already confirmed;
-- the app then signs in with signInWithPassword(username_email(u), password).

create or replace function public.username_email(p_username text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(btrim(p_username)) || '@users.sbeyes.example';
$$;
grant execute on function public.username_email(text) to anon, authenticated;

create or replace function public.register(p_username text, p_password text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  uname text := btrim(p_username);
  new_id uuid := gen_random_uuid();
  addr text := public.username_email(p_username);
begin
  if uname !~ '^[A-Za-z0-9_.-]{2,20}$' then
    raise exception 'Usernames are 2–20 letters, numbers, dots, dashes or underscores.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_password, '')) < 6 then
    raise exception 'Passwords need at least 6 characters.' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where email = addr)
     or exists (select 1 from public.profiles where lower(btrim(name)) = lower(uname)) then
    raise exception 'That username is taken.' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', addr,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('username', uname), now(), now(),
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (new_id::text, new_id, jsonb_build_object('sub', new_id::text, 'email', addr, 'email_verified', true), 'email', now(), now(), now());
end;
$$;
revoke execute on function public.register(text, text) from public;
grant execute on function public.register(text, text) to anon, authenticated;

-- New profiles take their name from the username.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, is_admin)
  values (new.id, coalesce(btrim(new.raw_user_meta_data ->> 'username'), ''), false);
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Usernames are fixed once chosen; nobody renames themselves into someone else.
revoke update (name) on public.profiles from authenticated;
