-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · room lifecycle: appoint/remove mod, delete room,
-- owner succession on leave.
--
-- Three gaps closed here, all the same shape as 0008: app code that
-- assumed a capability existed at the RLS layer when it never did.
--
-- 1. APPOINT / REMOVE MOD
--    No UPDATE policy has ever existed on room_members. An owner
--    trying to promote a member to mod (or demote a mod back to
--    member) would have the UPDATE silently match zero rows under
--    RLS — same failure shape as the kick bug fixed in 0008. Adds
--    "room_members_owner_manage_roles": only the owner may change
--    another member's role, and only between 'member' and 'mod'
--    (never touches 'owner' — ownership only moves via succession
--    below or a future explicit transfer feature).
--
--    This policy's USING clause needs to check "is auth.uid() the
--    owner of this row's room" — a lookup against room_members
--    itself. Doing that as a raw subquery directly inside a policy
--    defined ON room_members is exactly the shape 0007 fixed for
--    dm_members: the subquery is itself RLS-protected by this same
--    policy, so evaluating it re-triggers the policy and recurses
--    (Postgres error 42P17). Fix is the same as 0007's: put the
--    lookup in a `security definer` function (is_room_owner, added
--    below, alongside the existing is_room_mod/is_dm_member/etc
--    pattern) so it runs with the function owner's privileges and
--    doesn't re-apply RLS.
--
-- 2. DELETE ROOM
--    rooms has select/insert/update policies (0001, 0006) but no
--    delete policy has ever existed — room deletion was impossible
--    at the DB layer regardless of what UI might call for it. Adds
--    "rooms_owner_delete": owner only, via the same is_room_owner
--    function (this one's safe as a plain subquery too, since it's
--    querying room_members from a policy on the DIFFERENT table
--    rooms — no self-reference, no recursion risk — but reusing the
--    function keeps the "who is the owner" logic in one place).
--    Cascades to room_members, posts, replies, reactions, reports,
--    mod_actions, room_bans via each table's existing
--    `on delete cascade` foreign keys (0001_init.sql /
--    0004_moderation.sql) — no new cascade logic needed here.
--
-- 3. OWNER SUCCESSION
--    When the owner leaves, room_members_self_leave (0001) lets the
--    delete happen, but nothing has ever picked a successor — the
--    room would be left with zero owners and zero mods able to
--    manage it (existing mods, if any, could still moderate content,
--    but no one could appoint further mods or delete the room).
--    Adds promote_next_owner(p_room), a security definer function:
--    finds the earliest-joined remaining member (mods first, then
--    plain members, by joined_at) and makes them owner. Called from
--    leaveRoom() in lib/actions/rooms.ts, in the same request as the
--    owner's own leave, after their row is deleted. Not a trigger:
--    this codebase's existing pattern (is_room_mod, can_dm_user, etc)
--    is security-definer functions invoked from app code, not DB
--    triggers, and leaveRoom() is currently the only path that can
--    ever remove an owner's membership row, so a trigger would add a
--    new architectural pattern to cover a single call site.
-- ═══════════════════════════════════════════════════════════════

-- ─── 0. is_room_owner (security definer, mirrors is_room_mod) ───
create or replace function public.is_room_owner(p_room uuid, p_user uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from room_members
    where room_id = p_room and user_id = p_user and role = 'owner'
  );
$$;

-- ─── 1. appoint / remove mod ───
drop policy if exists "room_members_owner_manage_roles" on public.room_members;
create policy "room_members_owner_manage_roles" on public.room_members
  for update using (
    public.is_room_owner(room_id, auth.uid())
    and role <> 'owner'
  )
  with check (role in ('member', 'mod'));

-- ─── 2. delete room ───
drop policy if exists "rooms_owner_delete" on public.rooms;
create policy "rooms_owner_delete" on public.rooms
  for delete using (
    public.is_room_owner(id, auth.uid())
  );

-- ─── 3. owner succession ───
create or replace function public.promote_next_owner(p_room uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_next uuid;
begin
  -- already has an owner (e.g. called after a no-op leave) — nothing to do
  if exists (select 1 from room_members where room_id = p_room and role = 'owner') then
    return null;
  end if;

  select user_id into v_next
  from room_members
  where room_id = p_room
  order by (role = 'mod') desc, joined_at asc
  limit 1;

  if v_next is not null then
    update room_members set role = 'owner'
    where room_id = p_room and user_id = v_next;
  end if;

  return v_next;
end;
$$;
