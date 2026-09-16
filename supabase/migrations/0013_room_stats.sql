-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · room listing stats
-- Returns only aggregate counts. No user data, no post bodies.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.room_listing_stats(p_room_ids uuid[])
returns table (
  room_id uuid,
  member_count bigint,
  posts_today bigint,
  last_post_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.id as room_id,
    (select count(*) from room_members where room_id = r.id)::bigint as member_count,
    (
      select count(*) from posts
      where room_id = r.id
        and deleted_at is null
        and created_at > now() - interval '1 day'
    )::bigint as posts_today,
    (
      select max(created_at) from posts
      where room_id = r.id
        and deleted_at is null
    ) as last_post_at
  from unnest(p_room_ids) as r(id);
$$;

revoke execute on function public.room_listing_stats(uuid[]) from public;
grant execute on function public.room_listing_stats(uuid[]) to authenticated;

comment on function public.room_listing_stats(uuid[]) is
  'Aggregate stats for room listing cards. Returns no user-identifiable data.';
