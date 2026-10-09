-- Push notifications to the reader when a writer shares a new thing.
-- Devices register Expo push tokens; a trigger on notes sends one push per
-- thing (never its contents) through Expo's push service using pg_net.
create extension if not exists pg_net with schema extensions;

create table public.push_tokens (
  token      text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;
-- No direct access; devices register through register_push_token().

create or replace function public.register_push_token(p_token text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null or p_token !~ '^Expo(nent)?PushToken\[.+\]$' then
    raise exception 'Invalid push token' using errcode = '22023';
  end if;
  insert into public.push_tokens (token, user_id) values (p_token, auth.uid())
  on conflict (token) do update set user_id = excluded.user_id, created_at = now();
end;
$$;
revoke execute on function public.register_push_token(text) from public, anon;
grant execute on function public.register_push_token(text) to authenticated;

alter table public.notes add column notified_at timestamptz;

create or replace function public.notes_notify_reader()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  writer text := (select name from public.profiles where id = new.user_id);
  messages jsonb;
begin
  select jsonb_agg(jsonb_build_object(
           'to', t.token,
           'title', coalesce(nullif(writer, ''), 'Someone') || ' wrote something new 🌙',
           'body', 'It’s waiting for you, hidden until you open it.',
           'sound', 'default'))
    into messages
  from public.push_tokens t
  join public.profiles p on p.id = t.user_id
  where p.is_admin and p.id <> new.user_id;

  if messages is not null then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end if;

  update public.notes set notified_at = now() where id = new.id;
  return null;
end;
$$;
revoke execute on function public.notes_notify_reader() from public, anon, authenticated;

-- Fire once per thing: the first time it is shared (not held) and has words in it.
create trigger notes_notify_reader
  after insert or update on public.notes
  for each row
  when (new.notified_at is null and not new.held
        and (btrim(new.title) <> '' or btrim(new.body) <> ''))
  execute function public.notes_notify_reader();
