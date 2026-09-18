-- ═══════════════════════════════════════════════════════════════
-- LinkedOut: public room wall
-- Adds a room stats function grantable to the anon role, so the
-- public /rooms/wall page can show member counts and activity
-- without requiring login. room_listing_stats (0013) stays
-- authenticated-only and untouched; this is a separate function
-- scoped to public rooms only, since that's the only data anon
-- should ever see (private/unlisted rooms are never included).
-- ═══════════════════════════════════════════════════════════════

create or replace function public.public_room_wall()
returns table (
  id uuid,
  slug citext,
  name text,
  description text,
  accent text,
  member_count bigint,
  posts_today bigint,
  last_post_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.id,
    r.slug,
    r.name,
    r.description,
    r.accent,
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
    ) as last_post_at,
    r.created_at
  from rooms r
  where r.visibility = 'public'
  order by r.created_at asc;
$$;

revoke execute on function public.public_room_wall() from public;
grant execute on function public.public_room_wall() to anon, authenticated;

comment on function public.public_room_wall() is
  'Public rooms only, aggregate counts only. Safe for anonymous callers: no member identities, no post bodies, no private/unlisted rooms.';
