-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · moderation
-- Adds: reports, mod_actions (public log), room_bans
-- Adds: hidden_at / hidden_by on posts + replies
-- Principle: hide is reversible and default. Removal is soft delete.
--            Mod log is public, summary-only. No shadowbans. Ever.
--
-- Builds on 0002_fix_rls_policies.sql's corrected replies_read /
-- replies_insert / reactions_insert (which check deleted_at,
-- is_blocked_pair and shares_context_with on the parent post) rather
-- than the original 0001 versions, so this migration does not
-- reintroduce the leak 0002 closed.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. hidden state ───
alter table public.posts
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references public.profiles(id) on delete set null;

alter table public.replies
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references public.profiles(id) on delete set null;

-- ─── 2. room_bans ───
create table if not exists public.room_bans (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid references public.profiles(id) on delete set null,
  reason text not null check (char_length(reason) between 1 and 280),
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- ─── 3. reports ───
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_post_id uuid references public.posts(id) on delete cascade,
  target_reply_id uuid references public.replies(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null check (reason in (
    'harassment','doxxing','bad_faith','spam','off_topic','other'
  )),
  note text check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (target_post_id  is not null)::int +
    (target_reply_id is not null)::int +
    (target_user_id  is not null)::int = 1
  )
);
create index if not exists reports_room_status_idx
  on public.reports (room_id, status, created_at desc);

-- ─── 4. mod_actions (public log) ───
create table if not exists public.mod_actions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  mod_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in (
    'hide_post','unhide_post','remove_post',
    'hide_reply','unhide_reply','remove_reply',
    'ban_user','unban_user',
    'appoint_mod','remove_mod',
    'dismiss_report','resolve_report'
  )),
  target_post_id  uuid references public.posts(id) on delete set null,
  target_reply_id uuid references public.replies(id) on delete set null,
  target_user_id  uuid references public.profiles(id) on delete set null,
  report_id       uuid references public.reports(id) on delete set null,
  reason text not null check (char_length(reason) between 1 and 280),
  created_at timestamptz not null default now()
);
create index if not exists mod_actions_room_created_idx
  on public.mod_actions (room_id, created_at desc);

-- ─── 5. helper functions ───
create or replace function public.is_room_mod(p_room uuid, p_user uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from room_members
    where room_id = p_room
      and user_id = p_user
      and role in ('mod','owner')
  );
$$;

create or replace function public.is_banned_from_room(p_room uuid, p_user uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from room_bans
    where room_id = p_room and user_id = p_user
  );
$$;

create or replace function public.report_rate_ok(p_user uuid)
returns boolean language sql security definer set search_path = public as $$
  select (
    select count(*) from reports
    where reporter_id = p_user
      and created_at > now() - interval '1 hour'
  ) < 5;
$$;

-- ─── 6. RLS: new tables ───
alter table public.room_bans   enable row level security;
alter table public.reports     enable row level security;
alter table public.mod_actions enable row level security;

drop policy if exists "room_bans_read" on public.room_bans;
create policy "room_bans_read" on public.room_bans
  for select using (
    public.is_room_member(room_id, auth.uid())
    or user_id = auth.uid()
  );

drop policy if exists "room_bans_write" on public.room_bans;
create policy "room_bans_write" on public.room_bans
  for all using (public.is_room_mod(room_id, auth.uid()))
  with check (public.is_room_mod(room_id, auth.uid()));

drop policy if exists "reports_read" on public.reports;
create policy "reports_read" on public.reports
  for select using (
    reporter_id = auth.uid()
    or public.is_room_mod(room_id, auth.uid())
  );

drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports
  for insert with check (
    reporter_id = auth.uid()
    and public.is_room_member(room_id, auth.uid())
    and public.report_rate_ok(auth.uid())
    and not public.is_room_mod(room_id, auth.uid())
  );

drop policy if exists "reports_update_mod" on public.reports;
create policy "reports_update_mod" on public.reports
  for update using (public.is_room_mod(room_id, auth.uid()));

drop policy if exists "mod_actions_read" on public.mod_actions;
create policy "mod_actions_read" on public.mod_actions
  for select using (public.is_room_member(room_id, auth.uid()));

drop policy if exists "mod_actions_insert" on public.mod_actions;
create policy "mod_actions_insert" on public.mod_actions
  for insert with check (
    mod_id = auth.uid()
    and public.is_room_mod(room_id, auth.uid())
  );

-- ─── 7. update existing policies for hidden + bans ───

drop policy if exists "posts_read" on public.posts;
create policy "posts_read" on public.posts for select using (
  deleted_at is null
  and not public.is_blocked_pair(auth.uid(), author_id)
  and (
    (room_id is null and public.shares_context_with(author_id))
    or (room_id is not null and public.is_room_member(room_id, auth.uid()))
  )
  and (
    hidden_at is null
    or author_id = auth.uid()
    or (room_id is not null and public.is_room_mod(room_id, auth.uid()))
  )
);

drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert" on public.posts for insert with check (
  author_id = auth.uid()
  and (
    room_id is null
    or (
      public.is_room_member(room_id, auth.uid())
      and not public.is_banned_from_room(room_id, auth.uid())
    )
  )
);

-- Carries forward the 0002 fix (deleted_at / is_blocked_pair /
-- shares_context_with on the parent post) and layers hidden-state
-- visibility on top of it.
drop policy if exists "replies_read" on public.replies;
create policy "replies_read" on public.replies for select using (
  deleted_at is null
  and exists (
    select 1 from public.posts p
    where p.id = post_id
      and p.deleted_at is null
      and not public.is_blocked_pair(auth.uid(), p.author_id)
      and (
        (p.room_id is null and public.shares_context_with(p.author_id))
        or (p.room_id is not null and public.is_room_member(p.room_id, auth.uid()))
      )
      and (
        p.hidden_at is null
        or p.author_id = auth.uid()
        or (p.room_id is not null and public.is_room_mod(p.room_id, auth.uid()))
      )
  )
  and (
    hidden_at is null
    or author_id = auth.uid()
    or exists (
      select 1 from public.posts p
      where p.id = replies.post_id
        and p.room_id is not null
        and public.is_room_mod(p.room_id, auth.uid())
    )
  )
);

-- Carries forward the 0002 fix and adds the room-ban check.
drop policy if exists "replies_insert" on public.replies;
create policy "replies_insert" on public.replies for insert with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.posts p
    where p.id = post_id
      and p.deleted_at is null
      and (
        (p.room_id is null and public.shares_context_with(p.author_id))
        or (p.room_id is not null and public.is_room_member(p.room_id, auth.uid()))
      )
      and (
        p.room_id is null
        or not public.is_banned_from_room(p.room_id, auth.uid())
      )
  )
);

drop policy if exists "room_members_self_join" on public.room_members;
create policy "room_members_self_join" on public.room_members for insert with check (
  user_id = auth.uid()
  and not public.is_banned_from_room(room_id, auth.uid())
);
