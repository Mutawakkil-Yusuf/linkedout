-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · extend mod_actions for pinning
--
-- 0008_room_member_management.sql already extended this same check
-- constraint once (added 'remove_member' for the kick feature). This
-- migration extends it again, on top of that — not a fresh rewrite —
-- so 'remove_member' stays in the allowed set alongside the two new
-- pin/unpin verbs. (A migration that redefined this constraint from
-- scratch without 'remove_member' would silently break kicking.)
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
    'dismiss_report','resolve_report',
    'pin_post','unpin_post'
  ));
