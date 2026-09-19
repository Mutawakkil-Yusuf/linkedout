-- SPDX-License-Identifier: AGPL-3.0-or-later
-- Copyright (C) 2026 Mutawakkil Yusuf

-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · room share links
--
-- room_invites (0010) is deliberately account-to-account: you can
-- only invite someone you already share a room with. That's correct
-- for pulling an existing member into a different room, but it means
-- there is no way to bring a brand new person in from outside — no
-- link you can post on X, no QR code, nothing to grow the network
-- past whoever already has an account.
--
-- This migration adds a second, distinct mechanism for that: a
-- shareable token per room that resolves straight to a join. It does
-- NOT touch room_invites or its trust model, and it does NOT open up
-- unlisted/private rooms — self-join via plain insert already only
-- works for visibility = 'public' rooms (room_members_self_join,
-- tightened in 0004), and share links follow that exact same rule.
-- A link can't grant access an unauthenticated self-join couldn't
-- already grant; it just makes that existing public path easy to
-- share and lets the room's members see how many people came in
-- through it.
-- ═══════════════════════════════════════════════════════════════

create table public.room_share_links (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  -- short, url-safe token — not the row id, so links can be rotated
  -- (revoke + recreate) without changing the room's primary key shape
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{8,24}$'),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index room_share_links_room_idx on public.room_share_links (room_id, revoked_at);
create index room_share_links_token_idx on public.room_share_links (token) where revoked_at is null;

-- Counts joins attributed to a given link. One row per (link, joiner) —
-- a person can only ever be attributed to a room once, since room_members
-- is itself keyed by (room_id, user_id) and rows disappear if they leave.
-- This table is an append-only join log, so the count survives a leave/rejoin.
create table public.room_share_link_uses (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.room_share_links(id) on delete cascade,
  used_by uuid not null references public.profiles(id) on delete cascade,
  used_at timestamptz not null default now(),
  unique (link_id, used_by)
);

create index room_share_link_uses_link_idx on public.room_share_link_uses (link_id);

alter table public.room_share_links enable row level security;
alter table public.room_share_link_uses enable row level security;

-- Anyone can resolve a token to find out which room it points to — this
-- has to work for signed-out visitors too, since the whole point is
-- letting a stranger land on a link and see where it leads before they
-- sign up. Only non-revoked links resolve, and only for public rooms
-- (belt-and-suspenders: room_share_links_insert below already only
-- allows creating links for public rooms in the first place).
create policy "room_share_links_read" on public.room_share_links for select using (
  revoked_at is null
  and exists (
    select 1 from public.rooms r
    where r.id = room_id and r.visibility = 'public'
  )
);

-- Only current room members can mint a share link, and only for public
-- rooms — this mirrors exactly who's already allowed to see/post in the
-- room, just extended to "and therefore can hand out its public join link."
create policy "room_share_links_insert" on public.room_share_links for insert with check (
  created_by = auth.uid()
  and public.is_room_member(room_id, auth.uid())
  and exists (
    select 1 from public.rooms r
    where r.id = room_id and r.visibility = 'public'
  )
);

-- Only the creator of a link (or the room's owner/mod) can revoke it.
create policy "room_share_links_revoke" on public.room_share_links for update using (
  created_by = auth.uid()
  or exists (
    select 1 from public.room_members rm
    where rm.room_id = room_id and rm.user_id = auth.uid() and rm.role in ('owner', 'mod')
  )
) with check (revoked_at is not null);

-- Members can see how many people a link has brought in (aggregate use,
-- via the redeem_room_share_link function below — this table itself
-- isn't queried directly by anon/authenticated for row-level use data).
create policy "room_share_link_uses_read" on public.room_share_link_uses for select using (
  exists (
    select 1 from public.room_share_links l
    where l.id = link_id and public.is_room_member(l.room_id, auth.uid())
  )
);

-- Resolves a token, joins the caller to the room (if not already a
-- member and not banned), and logs the attribution — one atomic
-- security-definer step, same shape as respond_to_room_invite (0010).
-- A plain client-side insert can't do this because room lookup-by-token
-- has to happen server-side against the unrevoked/public constraints
-- above before membership is granted.
create or replace function public.redeem_room_share_link(p_token text)
returns table (room_id uuid, room_slug citext)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_link record;
begin
  if v_me is null then raise exception 'not signed in'; end if;

  select l.id, l.room_id into v_link
  from room_share_links l
  join rooms r on r.id = l.room_id
  where l.token = p_token and l.revoked_at is null and r.visibility = 'public';

  if v_link is null then raise exception 'invite link not found or expired'; end if;

  if public.is_banned_from_room(v_link.room_id, v_me) then
    raise exception 'you are banned from this room';
  end if;

  if not public.is_room_member(v_link.room_id, v_me) then
    insert into room_members (room_id, user_id, role) values (v_link.room_id, v_me, 'member');
  end if;

  insert into room_share_link_uses (link_id, used_by)
  values (v_link.id, v_me)
  on conflict (link_id, used_by) do nothing;

  return query select r.id, r.slug from rooms r where r.id = v_link.room_id;
end;
$$;

revoke execute on function public.redeem_room_share_link(text) from public;
grant execute on function public.redeem_room_share_link(text) to authenticated;

-- Lets a member see per-link use counts for a room without needing raw
-- select on room_share_link_uses. Returns nothing for non-members.
create or replace function public.room_share_link_stats(p_room uuid)
returns table (link_id uuid, token text, created_by uuid, created_at timestamptz, revoked_at timestamptz, use_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select l.id, l.token, l.created_by, l.created_at, l.revoked_at,
    (select count(*) from room_share_link_uses u where u.link_id = l.id)::bigint
  from room_share_links l
  where l.room_id = p_room
    and public.is_room_member(p_room, auth.uid())
  order by l.created_at desc;
$$;

revoke execute on function public.room_share_link_stats(uuid) from public;
grant execute on function public.room_share_link_stats(uuid) to authenticated;
