-- Documents a policy that already exists on the live database (added
-- directly, outside any migration, at some point before this repo's
-- migration history was reconciled). Written with `if not exists`-style
-- safety via drop-then-create so this is safe to run even though the
-- policy is already live.

drop policy if exists "rooms_owner_update" on public.rooms;
create policy "rooms_owner_update" on public.rooms for update using (
  exists (
    select 1 from room_members
    where room_members.room_id = rooms.id
      and room_members.user_id = auth.uid()
      and room_members.role = any (array['owner', 'mod'])
  )
);
