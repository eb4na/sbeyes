-- Notes app schema: writers own their notes; admins can read everything.

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default '',
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title      text not null default '',
  body       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_id_idx on public.notes (user_id, updated_at desc);

-- Progress history: snapshots of a note over time.
create table public.note_revisions (
  id       bigint generated always as identity primary key,
  note_id  uuid not null references public.notes (id) on delete cascade,
  title    text not null,
  body     text not null,
  saved_at timestamptz not null default now()
);
create index note_revisions_note_id_idx on public.note_revisions (note_id, saved_at desc);

-- Create a profile for every new sign-up, using the name passed at sign-up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh and snapshot a revision at most every 30 seconds
-- while someone is typing, so admins can see how a note progressed.
create function public.notes_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.notes_before_update();

create function public.notes_snapshot_revision()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  last_rev public.note_revisions;
begin
  select * into last_rev
  from public.note_revisions
  where note_id = new.id
  order by saved_at desc
  limit 1;

  if last_rev is null
     or ((last_rev.title, last_rev.body) is distinct from (new.title, new.body)
         and last_rev.saved_at < now() - interval '30 seconds') then
    insert into public.note_revisions (note_id, title, body)
    values (new.id, new.title, new.body);
  end if;
  return new;
end;
$$;

create trigger notes_snapshot_revision
  after update on public.notes
  for each row
  when ((old.title, old.body) is distinct from (new.title, new.body))
  execute function public.notes_snapshot_revision();

-- Admin check used by policies. security definer so it can read profiles
-- without recursing through the profiles policies.
create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.note_revisions enable row level security;

create policy "Read own profile, admins read all" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may change their name but never grant themselves admin.
revoke update on public.profiles from authenticated, anon;
grant update (name) on public.profiles to authenticated;

create policy "Read own notes, admins read all" on public.notes
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Create own notes" on public.notes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Update own notes" on public.notes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Delete own notes" on public.notes
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Read own revisions, admins read all" on public.note_revisions
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.notes n where n.id = note_id and n.user_id = (select auth.uid()))
  );

revoke execute on function public.is_admin() from anon;

-- Live updates for the admin "All notes" screen.
alter publication supabase_realtime add table public.notes;
