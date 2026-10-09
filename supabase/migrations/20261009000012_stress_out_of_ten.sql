-- Stress is now a 1–10 slider (1–4 stressed, 5–7 overwhelmed, 8–10 depressed).
-- Existing 1–5 values are doubled to keep their place on the scale. Triggers
-- are skipped for the rescale so it doesn't count as an edit or send pushes.
set local session_replication_role = replica;
alter table public.notes drop constraint notes_stress_check;
update public.notes set stress = stress * 2 where stress is not null;
update public.note_revisions set stress = stress * 2 where stress is not null;
alter table public.notes add constraint notes_stress_check check (stress between 1 and 10);
set local session_replication_role = origin;
