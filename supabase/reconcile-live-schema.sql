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

-- 1. dm_members: remove the buggy duplicate. dm_members_read (the
--    correctly-qualified one) already exists and stays as-is.
drop policy if exists "dm_members_member_read" on public.dm_members;

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
