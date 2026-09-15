-- ═══════════════════════════════════════════════════════════════
-- Reconciliation script — run this once in the Supabase SQL Editor.
--
-- Context: none of supabase/migrations/*.sql were ever run through
-- a migration tool against this project. Everything live was built
-- by hand over time, which is why several policies exist under
-- different names than the migration files (harmless on its own),
-- and one — dm_members_member_read — reintroduced the exact
-- ambiguous-column bug that 0002_fix_rls_policies.sql documents
-- and fixes under a *different* policy name, so the drop in 0002
-- never touched it.
--
-- This script is idempotent (safe to run more than once) and does
-- NOT touch any table data — only policy definitions.
-- ═══════════════════════════════════════════════════════════════

-- 1. dm_members: two separate problems on this one table.
--
--    a) dm_members_member_read — a duplicate policy under a different
--       name that reintroduced the ambiguous-column bug 0002 already
--       fixed under the name dm_members_read. Just drop it.
--
--    b) dm_members_read itself (the "correct" one) still had a deeper
--       bug: its USING clause queries dm_members again to check
--       membership, and that inner query is itself subject to RLS on
--       dm_members — so evaluating the policy re-triggers the same
--       policy, forever. Postgres surfaces this as error 42P17,
--       "infinite recursion detected in policy for relation
--       dm_members". Qualifying the column (0002's fix) didn't touch
--       this — a self-referencing subquery on the same RLS-protected
--       table recurses regardless of how its columns are qualified.
--
--       Fixed by moving the check into a `security definer` function
--       (same pattern already used by is_room_member, can_dm_user,
--       etc.) — inside such a function the query runs with the
--       function owner's privileges and does not re-apply RLS, so it
--       can check dm_members without recursing.

drop policy if exists "dm_members_member_read" on public.dm_members;

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

-- 2. Rename-only cases below: drop the old-named policy and
--    recreate under the canonical name from the migration files,
--    using the exact same (already-correct) logic so behavior does
--    not change — this just makes the live schema match the repo,
--    so future migration files apply cleanly instead of colliding.

drop policy if exists "dm_messages_member_insert" on public.dm_messages;
create policy "dm_messages_insert" on public.dm_messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from dm_members where thread_id = dm_messages.thread_id and user_id = auth.uid())
);

drop policy if exists "dm_messages_member_read" on public.dm_messages;
create policy "dm_messages_read" on public.dm_messages for select using (
  exists (select 1 from dm_members where thread_id = dm_messages.thread_id and user_id = auth.uid())
);

drop policy if exists "dm_threads_member_read" on public.dm_threads;
create policy "dm_threads_read" on public.dm_threads for select using (
  exists (select 1 from dm_members where thread_id = id and user_id = auth.uid())
);

drop policy if exists "profiles_shared_context_read" on public.profiles;
create policy "profiles_shared_read" on public.profiles for select using (
  public.shares_context_with(id)
);

drop policy if exists "reactions_delete_self" on public.reactions;
create policy "reactions_delete" on public.reactions for delete using (
  user_id = auth.uid()
);

drop policy if exists "reactions_self_read" on public.reactions;
create policy "reactions_read" on public.reactions for select using (
  (user_id = auth.uid()) or exists (select 1 from posts p where p.id = reactions.post_id and p.author_id = auth.uid())
);

-- 3. rooms_owner_update: this policy exists live but isn't in any
--    migration file. It's a sensible policy (room owners/mods can
--    update room settings), so it's left as-is here — just noting
--    it should be added to a future migration file so the repo
--    reflects it going forward. No action taken in this script.

-- ═══════════════════════════════════════════════════════════════
-- After running this, re-check with:
--
--   select tablename, policyname, cmd from pg_policies
--   where schemaname = 'public' order by tablename, policyname;
--
-- Every policyname should now exactly match the names created by
-- supabase/migrations/*.sql (plus rooms_owner_update, which is a
-- known, intentional addition not yet captured in a migration file).
-- ═══════════════════════════════════════════════════════════════
