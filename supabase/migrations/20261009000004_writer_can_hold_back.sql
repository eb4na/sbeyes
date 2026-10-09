-- Writers can hold a thing back: while held, admins can't see it at all.
alter table public.notes add column held boolean not null default false;
grant update (held) on public.notes to authenticated;

alter policy "Read own notes, admins read all" on public.notes
  using (user_id = (select auth.uid()) or ((select private.is_admin()) and not held));

alter policy "Read own revisions, admins read all" on public.note_revisions
  using (exists (
    select 1 from public.notes n
    where n.id = note_id
      and (n.user_id = (select auth.uid()) or ((select private.is_admin()) and not n.held))
  ));
