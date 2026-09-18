-- ═══════════════════════════════════════════════════════════════
-- LinkedOut: early-room mods + platform early-user badge
--
-- Two separate mechanics, both requested together but unrelated:
--
-- 1. rooms.auto_mod_on_join: when true, the first 5 people (by
--    joined_at) to join that specific room are automatically
--    promoted to 'mod'. Opt-in per room (existing rooms are
--    unaffected; only rooms created with this flag set get it),
--    enforced by an AFTER INSERT trigger on room_members so it
--    fires no matter which code path creates the membership row
--    (self-join in rooms.ts, or accept_room_invite in
--    0010_room_invites.sql, which inserts role explicitly).
--
-- 2. profiles.early_badge: platform-wide, first 50 users ever
--    (by created_at), set once at signup time via an AFTER INSERT
--    trigger on profiles. Unrelated to which room someone joins.
-- ═══════════════════════════════════════════════════════════════

alter table public.rooms
  add column auto_mod_on_join boolean not null default false;

alter table public.profiles
  add column early_badge boolean not null default false;

-- ─── 1. auto-mod for the first 5 joiners of a flagged room ───

create or replace function public.maybe_automod_new_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flagged boolean;
  v_mod_count integer;
begin
  select auto_mod_on_join into v_flagged from rooms where id = new.room_id;
  if not coalesce(v_flagged, false) then
    return new;
  end if;

  -- room's creator already starts as owner (existing app behavior,
  -- see rooms create action), so count mods+owner together against
  -- the 5-seat cap: owner takes one seat, the next 4 joiners fill
  -- the rest as mods.
  select count(*) into v_mod_count
  from room_members
  where room_id = new.room_id and role in ('owner', 'mod');

  if v_mod_count < 5 and new.role = 'member' then
    update room_members set role = 'mod'
    where room_id = new.room_id and user_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_automod_new_member on public.room_members;
create trigger trg_automod_new_member
  after insert on public.room_members
  for each row execute function public.maybe_automod_new_member();

-- ─── 2. platform-wide early-user badge, first 50 signups ever ───

create or replace function public.maybe_grant_early_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*) into v_count from profiles;
  if v_count <= 50 then
    update profiles set early_badge = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_early_badge on public.profiles;
create trigger trg_early_badge
  after insert on public.profiles
  for each row execute function public.maybe_grant_early_badge();

-- One-time backfill: apply the badge to whoever's already in the
-- first 50 by created_at, so existing users aren't left out just
-- because they signed up before this migration existed.
with earliest as (
  select id from profiles order by created_at asc limit 50
)
update profiles set early_badge = true
where id in (select id from earliest);
