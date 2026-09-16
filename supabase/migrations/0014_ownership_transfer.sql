-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · ownership transfer
-- Adds:
--   · one-owner-per-room guarantee (partial unique index)
--   · transfer_room_ownership() — atomic, explicit transfer
--   · rooms.visibility gains 'private' (was public/unlisted only)
--
-- Coexists with promote_next_owner() from 0009_room_lifecycle.sql:
-- that function only ever runs when a room has *zero* owners (it
-- checks this itself before doing anything), and this transfer
-- function's demote-then-promote happens inside one transaction, so
-- there is never a moment with two rows role='owner' for the same
-- room — the partial unique index below is never at risk from either
-- path. Leaving a room still triggers automatic succession (0009);
-- this migration adds the ability to *choose* your successor instead
-- of leaving it to join-order, as an alternative, not a replacement.
-- ═══════════════════════════════════════════════════════════════

create unique index if not exists room_members_one_owner_idx
  on public.room_members (room_id)
  where role = 'owner';

create or replace function public.transfer_room_ownership(
  p_room uuid,
  p_to uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_current_owner uuid;
begin
  if v_me is null then raise exception 'not signed in'; end if;

  select user_id into v_current_owner
  from room_members
  where room_id = p_room and role = 'owner';

  if v_current_owner is null then raise exception 'room has no owner'; end if;
  if v_current_owner <> v_me then raise exception 'only the owner can transfer ownership'; end if;
  if p_to = v_me then raise exception 'you are already the owner'; end if;

  if not exists (
    select 1 from room_members where room_id = p_room and user_id = p_to
  ) then
    raise exception 'target is not a member of this room';
  end if;

  update room_members set role = 'mod'
  where room_id = p_room and user_id = v_me;

  update room_members set role = 'owner'
  where room_id = p_room and user_id = p_to;
end;
$$;

-- The original column definition (0001_init.sql) has an inline,
-- unnamed check constraint — check (visibility in ('public','unlisted'))
-- — which Postgres auto-names 'rooms_visibility_check' by its
-- <table>_<column>_check convention. It's already live under that
-- exact name, so it must be dropped and replaced (not conditionally
-- added) to actually permit 'private' — a plain "if not exists" guard
-- would see the old constraint already there under that name and
-- skip, leaving 'private' rejected by the constraint still in force.
alter table public.rooms drop constraint if exists rooms_visibility_check;
alter table public.rooms
  add constraint rooms_visibility_check
  check (visibility in ('public','unlisted','private'));

-- room_members_self_join (0004_moderation.sql) has never checked
-- room visibility at all — only "not banned." Under 'public'/
-- 'unlisted' that was survivable, since unlisted rooms are only a
-- weak visibility distinction (findable if you have the slug or ID),
-- not an access control. Once 'private' means "invite only," a
-- visibility-blind self-join would let anyone who obtains a private
-- room's UUID join directly, completely bypassing the invite system
-- this migration set adds. Close that: self-join now requires the
-- room to be public or unlisted (unlisted keeps working exactly as
-- before, since it was never meant to require an invite — 'private'
-- is the new, stricter tier that does). Private rooms are joined
-- only via respond_to_room_invite() (0010_room_invites.sql), which
-- is a security definer function and is therefore unaffected by
-- this policy tightening.
drop policy if exists "room_members_self_join" on public.room_members;
create policy "room_members_self_join" on public.room_members for insert with check (
  user_id = auth.uid()
  and not public.is_banned_from_room(room_id, auth.uid())
  and exists (
    select 1 from rooms
    where rooms.id = room_members.room_id
      and rooms.visibility in ('public', 'unlisted')
  )
);
