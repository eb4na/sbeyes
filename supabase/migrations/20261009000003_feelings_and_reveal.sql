-- Each note ("thing") carries an emotion and a 1-5 stress level, and stays
-- hidden from the admin until they reveal it.
alter table public.notes
  add column emotion text check (emotion in
    ('hurt','angry','frustrated','sad','disappointed','anxious','confused','lonely')),
  add column stress smallint check (stress between 1 and 5),
  add column revealed_at timestamptz;

alter table public.note_revisions
  add column emotion text,
  add column stress smallint;

-- Writers may edit content fields only; revealed_at changes through set_note_revealed().
revoke update on public.notes from authenticated, anon;
grant update (title, body, emotion, stress) on public.notes to authenticated;

-- Revealing must not look like an edit: only bump updated_at for content changes.
create or replace function public.notes_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (old.title, old.body, old.emotion, old.stress)
     is distinct from (new.title, new.body, new.emotion, new.stress) then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.notes_snapshot_revision()
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
     or ((last_rev.title, last_rev.body, last_rev.emotion, last_rev.stress)
           is distinct from (new.title, new.body, new.emotion, new.stress)
         and last_rev.saved_at < now() - interval '30 seconds') then
    insert into public.note_revisions (note_id, title, body, emotion, stress)
    values (new.id, new.title, new.body, new.emotion, new.stress);
  end if;
  return new;
end;
$$;

create or replace trigger notes_snapshot_revision
  after update on public.notes
  for each row
  when ((old.title, old.body, old.emotion, old.stress)
        is distinct from (new.title, new.body, new.emotion, new.stress))
  execute function public.notes_snapshot_revision();

-- Admin-only: reveal or re-hide a note.
create function public.set_note_revealed(note_id uuid, revealed boolean)
returns timestamptz
language plpgsql
security definer set search_path = ''
as $$
declare
  result timestamptz;
begin
  if not private.is_admin() then
    raise exception 'Only admins can reveal notes' using errcode = '42501';
  end if;
  update public.notes
  set revealed_at = case when revealed then coalesce(revealed_at, now()) else null end
  where id = note_id
  returning revealed_at into result;
  return result;
end;
$$;
revoke execute on function public.set_note_revealed(uuid, boolean) from public, anon;
grant execute on function public.set_note_revealed(uuid, boolean) to authenticated;
