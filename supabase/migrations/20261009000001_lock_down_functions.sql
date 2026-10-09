-- Trigger functions run on table events only; nobody should call them via the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notes_snapshot_revision() from public, anon, authenticated;

-- Move the admin check out of the exposed API schema. Policies still call it.
create schema if not exists private;
grant usage on schema private to authenticated;
alter function public.is_admin() set schema private;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;
