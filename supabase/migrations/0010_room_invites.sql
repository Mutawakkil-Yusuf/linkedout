-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · room invites
--
-- Design constraint this follows: nothing else in this app lets two
-- people interact before they already share a room (can_dm_user in
-- 0005_dms.sql is the clearest example — DMs require shared room
-- membership first, there is no "message a stranger" path). Invites
-- keep that shape: you can only invite someone you already share a
-- room with (shares_context_with, 0001_init.sql). This is a way to
-- pull someone from a room you're both already in into a *different*
-- room — not a way to reach people you've never shared space with.
--
-- Why accept/decline are RPCs, not plain inserts/updates:
-- room_members_self_join (0001, tightened in 0004) lets someone join
-- a room via plain insert only when visibility = 'public' and
-- they're not banned. Private/unlisted rooms are correctly
-- undiscoverable — rooms_public_read won't even let a non-member see
-- the room row. An invite has to be the deliberate exception to
-- that: proof of a specific, live invite is what authorizes joining
-- a room you otherwise can't see or reach. That authorization check
-- (does a pending invite exist, is the room's ban list clear) has to
-- run as one atomic, security-definer operation — a plain client
-- insert into room_members has no way to prove "I was invited."
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  message text check (char_length(message) <= 280),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Only one *pending* invite per (room, invitee) at a time — stops
-- duplicate/spam invites while a decision is outstanding. Once an
-- invite resolves (accepted/declined/revoked) it's no longer pending,
-- so this index no longer blocks it, and a fresh invite can be sent
-- later. A plain `unique(room_id, invitee_id)` would have permanently
-- blocked re-inviting after a single decline, which isn't what we
-- want — declining should be reversible-by-a-new-invite, not final.
create unique index if not exists room_invites_one_pending_idx
  on public.room_invites (room_id, invitee_id)
  where status = 'pending';

create index if not exists room_invites_invitee_status_idx
  on public.room_invites (invitee_id, status, created_at desc);
create index if not exists room_invites_room_idx
  on public.room_invites (room_id, status);

alter table public.room_invites enable row level security;

-- Invitee reads their own invites; inviter reads invites they sent
-- (so they can see if it's still pending, e.g. to avoid re-inviting).
drop policy if exists "room_invites_read" on public.room_invites;
create policy "room_invites_read" on public.room_invites for select using (
  invitee_id = auth.uid() or inviter_id = auth.uid()
);

-- Sending an invite: must be a member of the target room, must
-- already share context with the invitee (see header note), can't
-- invite someone already banned from the room, can't invite yourself.
drop policy if exists "room_invites_insert" on public.room_invites;
create policy "room_invites_insert" on public.room_invites for insert with check (
  inviter_id = auth.uid()
  and invitee_id <> auth.uid()
  and public.is_room_member(room_id, auth.uid())
  and public.shares_context_with(invitee_id)
  and not public.is_banned_from_room(room_id, invitee_id)
);

-- Only the inviter can revoke their own still-pending invite (soft
-- delete via status, not a hard delete — keeps a record).
drop policy if exists "room_invites_inviter_revoke" on public.room_invites;
create policy "room_invites_inviter_revoke" on public.room_invites for update using (
  inviter_id = auth.uid() and status = 'pending'
) with check (
  status = 'revoked'
);

-- accept / decline go through respond_to_room_invite below (security
-- definer), not a direct client update — see header note on why.

create or replace function public.respond_to_room_invite(p_invite uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_invite record;
begin
  if v_me is null then raise exception 'not signed in'; end if;

  select * into v_invite from room_invites where id = p_invite for update;
  if v_invite is null then raise exception 'invite not found'; end if;
  if v_invite.invitee_id <> v_me then raise exception 'not your invite'; end if;
  if v_invite.status <> 'pending' then raise exception 'invite already resolved'; end if;

  if not p_accept then
    update room_invites set status = 'declined', resolved_at = now() where id = p_invite;
    return;
  end if;

  if public.is_banned_from_room(v_invite.room_id, v_me) then
    raise exception 'you are banned from this room';
  end if;

  -- already a member (e.g. joined some other way since the invite went out) —
  -- resolve the invite as accepted without erroring, no duplicate row
  if not public.is_room_member(v_invite.room_id, v_me) then
    insert into room_members (room_id, user_id, role) values (v_invite.room_id, v_me, 'member');
  end if;

  update room_invites set status = 'accepted', resolved_at = now() where id = p_invite;
end;
$$;
