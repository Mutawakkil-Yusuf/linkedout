-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · room member management
-- Adds: mod/owner ability to remove a member from a room ("kick"),
--       a "remove_member" mod_actions verb to log it.
--
-- Root cause this also fixes: 0001_init.sql's "room_members_self_leave"
-- policy only ever allowed a user to delete their OWN room_members row
-- (user_id = auth.uid()). No policy has ever allowed a mod to delete
-- someone ELSE's row. banUser() in lib/actions/moderation.ts has been
-- calling exactly that delete (mod deleting the banned user's
-- membership row) since 0004_moderation.sql — under RLS, a DELETE with
-- no matching USING clause matches zero rows and returns no error, so
-- banUser() has been reporting success while leaving a stale
-- room_members row behind for every ban where mod_id <> user_id (i.e.
-- almost every real ban). This migration's new policy fixes that path
-- as a side effect, in addition to enabling the new standalone kick.
--
-- Kick vs ban: kick deletes the room_members row only, no room_bans
-- row, so the user can rejoin immediately. Ban does both (unchanged).
-- Owners can't be kicked, mirroring banUser's existing owner guard.
-- ═══════════════════════════════════════════════════════════════

alter table public.mod_actions
  drop constraint if exists mod_actions_action_check;

alter table public.mod_actions
  add constraint mod_actions_action_check check (action in (
    'hide_post','unhide_post','remove_post',
    'hide_reply','unhide_reply','remove_reply',
    'ban_user','unban_user',
    'remove_member',
    'appoint_mod','remove_mod',
    'dismiss_report','resolve_report'
  ));

drop policy if exists "room_members_mod_kick" on public.room_members;
create policy "room_members_mod_kick" on public.room_members
  for delete using (
    public.is_room_mod(room_id, auth.uid())
    and role <> 'owner'
  );
