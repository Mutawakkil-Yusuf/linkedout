-- Fixes for RLS bugs found in review of 0001_init.sql
--
-- 1. dm_members_read: unqualified `thread_id` inside the correlated
--    subquery resolved to the subquery's own `dm_members.thread_id`
--    (Postgres inner-scope shadowing) instead of the outer row's,
--    collapsing the check to `m.thread_id = m.thread_id` (always true).
--    Net effect: any user who belongs to at least one DM thread could
--    read every row in dm_members, enumerating all DM memberships.
--
-- 2. replies_read: only checked that the parent post row exists, not
--    that it's visible to the reader (room membership / shared context,
--    not blocked, not soft-deleted). Leaked replies on posts in private
--    rooms the reader isn't a member of, and on deleted posts.
--
-- 3. replies_insert: didn't verify the reader has access to the room
--    the parent post belongs to, unlike posts_insert's equivalent check.

drop policy if exists "dm_members_read" on public.dm_members;
create policy "dm_members_read" on public.dm_members for select using (
  exists (
    select 1 from dm_members m
    where m.thread_id = dm_members.thread_id and m.user_id = auth.uid()
  )
);

drop policy if exists "replies_read" on public.replies;
create policy "replies_read" on public.replies for select using (
  deleted_at is null and exists (
    select 1 from public.posts p
    where p.id = post_id
      and p.deleted_at is null
      and not public.is_blocked_pair(auth.uid(), p.author_id)
      and (
        (p.room_id is null and public.shares_context_with(p.author_id))
        or (p.room_id is not null and public.is_room_member(p.room_id, auth.uid()))
      )
  )
);

drop policy if exists "replies_insert" on public.replies;
create policy "replies_insert" on public.replies for insert with check (
  author_id = auth.uid() and exists (
    select 1 from public.posts p
    where p.id = post_id
      and p.deleted_at is null
      and (
        (p.room_id is null and public.shares_context_with(p.author_id))
        or (p.room_id is not null and public.is_room_member(p.room_id, auth.uid()))
      )
  )
);

-- Bonus consistency fix: reactions_insert didn't check room membership
-- on the parent post either (posts_insert does). Low severity (worst
-- case is an unwanted "ack" on a post you can't otherwise reach) but
-- inconsistent with the rest of the write policies, so closing it too.
drop policy if exists "reactions_insert" on public.reactions;
create policy "reactions_insert" on public.reactions for insert with check (
  user_id = auth.uid() and exists (
    select 1 from public.posts p
    where p.id = post_id
      and p.deleted_at is null
      and (
        (p.room_id is null and public.shares_context_with(p.author_id))
        or (p.room_id is not null and public.is_room_member(p.room_id, auth.uid()))
      )
  )
);
