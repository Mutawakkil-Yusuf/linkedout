-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Copyright (C) 2026 Mutawakkil Yusuf

-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · public room recent posts
--
-- public_room_wall (0015) intentionally shows aggregate counts only —
-- "no member identities, no post bodies" per its own comment. That's
-- still the right call for identity: this function does not change it.
-- But counts alone give a stranger nothing to react to, which is a
-- real growth problem (see the README/growth notes on the join-link
-- and wall pages that consume this).
--
-- This adds body text only — no author id, no handle, no avatar, no
-- room-internal reply/reaction ids — for public rooms only, capped to
-- a small, recent, non-deleted/non-hidden set. It's strictly less than
-- what posts_read already grants any *member* (full row, identity
-- included); this is a narrower, anon-safe slice of the same
-- already-public-room data, not a new exposure.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.public_room_recent_posts(p_room uuid, p_limit int default 3)
returns table (body text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select p.body, p.created_at
  from posts p
  join rooms r on r.id = p.room_id
  where p.room_id = p_room
    and r.visibility = 'public'
    and p.deleted_at is null
    and p.hidden_at is null
    and p.mode = 'normal'
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 10);
$$;

revoke execute on function public.public_room_recent_posts(uuid, int) from public;
grant execute on function public.public_room_recent_posts(uuid, int) to anon, authenticated;

comment on function public.public_room_recent_posts(uuid, int) is
  'Public rooms only, body text only, no identity. Normal-mode posts only (spoiler/quiet excluded on purpose — those are opt-in-visibility within the room, not meant for an anonymous preview).';
