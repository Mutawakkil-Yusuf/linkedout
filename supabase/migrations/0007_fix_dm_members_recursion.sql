-- Fixes: "infinite recursion detected in policy for relation dm_members"
-- (Postgres error 42P17).
--
-- Root cause: dm_members_read's USING clause queried dm_members again
-- (aliased m) to check membership. That inner query is itself subject
-- to RLS on dm_members, which means evaluating the policy re-triggers
-- the same policy, forever. The earlier fix in 0002 (qualifying the
-- ambiguous `thread_id` column) was a real, separate bug — but it
-- didn't touch this structural issue, since a self-referencing
-- subquery on the same RLS-protected table recurses regardless of
-- whether its columns are qualified correctly.
--
-- Fix: move the membership check into a `security definer` function
-- (same pattern already used by is_room_member, can_dm_user, etc.
-- elsewhere in this schema). Inside a security definer function body,
-- the query runs with the function owner's privileges and does not
-- re-apply RLS, so it can safely check dm_members without recursing.

create or replace function public.is_dm_member(p_thread uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from dm_members
    where thread_id = p_thread and user_id = p_user
  );
$$;

drop policy if exists "dm_members_read" on public.dm_members;
create policy "dm_members_read" on public.dm_members for select using (
  public.is_dm_member(thread_id, auth.uid())
);
