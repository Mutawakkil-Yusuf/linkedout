-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · direct messages
-- Adds: can_dm_user, get_or_create_dm_thread, list_my_dm_threads
-- Adds: realtime publication for dm_messages
--
-- dm_threads / dm_members / dm_messages tables and their RLS policies
-- already exist (0001_init.sql). This migration only adds the RPC
-- helpers the DM UI needs and turns on realtime for new messages.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.can_dm_user(p_other uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and auth.uid() <> p_other
    and not public.is_blocked_pair(auth.uid(), p_other)
    and exists (
      select 1
      from room_members a
      join room_members b on a.room_id = b.room_id
      where a.user_id = auth.uid() and b.user_id = p_other
    );
$$;

create or replace function public.get_or_create_dm_thread(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_thread_id uuid;
begin
  if v_me is null then
    raise exception 'not signed in';
  end if;
  if v_me = p_other then
    raise exception 'cannot dm yourself';
  end if;
  if not public.can_dm_user(p_other) then
    raise exception 'no shared room';
  end if;

  select t.id into v_thread_id
  from dm_threads t
  join dm_members m1 on m1.thread_id = t.id and m1.user_id = v_me
  join dm_members m2 on m2.thread_id = t.id and m2.user_id = p_other
  where (select count(*) from dm_members where thread_id = t.id) = 2
  limit 1;

  if v_thread_id is not null then
    return v_thread_id;
  end if;

  insert into dm_threads default values returning id into v_thread_id;
  insert into dm_members (thread_id, user_id)
  values (v_thread_id, v_me), (v_thread_id, p_other);

  return v_thread_id;
end;
$$;

create or replace function public.list_my_dm_threads()
returns table (
  thread_id uuid,
  other_user_id uuid,
  other_handle citext,
  other_display_name text,
  other_avatar_style text,
  other_avatar_seed text,
  last_body text,
  last_sender_id uuid,
  last_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    t.id as thread_id,
    p.id as other_user_id,
    p.handle as other_handle,
    p.display_name as other_display_name,
    p.avatar_style as other_avatar_style,
    p.avatar_seed as other_avatar_seed,
    (select body      from dm_messages where thread_id = t.id order by created_at desc limit 1) as last_body,
    (select sender_id from dm_messages where thread_id = t.id order by created_at desc limit 1) as last_sender_id,
    coalesce(
      (select created_at from dm_messages where thread_id = t.id order by created_at desc limit 1),
      t.created_at
    ) as last_at
  from dm_threads t
  join dm_members me    on me.thread_id    = t.id and me.user_id    = auth.uid()
  join dm_members other on other.thread_id = t.id and other.user_id <> auth.uid()
  join profiles p       on p.id            = other.user_id
  order by last_at desc nulls last;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dm_messages'
  ) then
    alter publication supabase_realtime add table public.dm_messages;
  end if;
end $$;

comment on table public.dm_messages is
  'Direct messages. No read receipts, no typing indicators, no presence. Do not add them.';
