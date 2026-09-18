-- ═══════════════════════════════════════════════════════════════
-- LinkedOut: seed rooms, first 5 joiners become mods
--
-- created_by is null (no real profile to attribute these to, and
-- this migration runs with RLS bypassed since it's applied as the
-- service role, so rooms_auth_create's auth.uid() = created_by
-- check never runs here). rooms.created_by is nullable and set to
-- null on the owner's account deletion already (0001_init.sql), so
-- a null-created_by room is a normal, supported state, not a hack.
--
-- auto_mod_on_join = true on all five: the first 5 real people who
-- join each room become that room's mods automatically (see
-- maybe_automod_new_member() in 0016). No owner is pre-assigned,
-- so promote_next_owner's existing succession logic picks one the
-- first time it's needed (e.g. if a mod ever leaves).
-- ═══════════════════════════════════════════════════════════════

insert into public.rooms (slug, name, description, visibility, accent, auto_mod_on_join, created_by)
values
  (
    'out-of-office',
    'Permanently out of office',
    'For the auto-reply that never turned back on. No status updates, no "circling back," no calendar Tetris. Just people who stopped performing busy.',
    'public',
    'moss',
    true,
    null
  ),
  (
    'unqualified',
    'Technically unqualified for everything',
    'A room for the "3-5 years experience" jobs that wanted a fresh graduate. Bring your real skills, leave the buzzwords at the door.',
    'public',
    'amber',
    true,
    null
  ),
  (
    'no-synergy',
    'Zero synergy, all substance',
    'Nobody here is going to "circle back" or "touch base." We just talk. Radical, we know.',
    'public',
    'indigo',
    true,
    null
  ),
  (
    'unbothered',
    'Certified unbothered',
    'For people who read the layoff post, felt nothing, and kept scrolling. A calm room for people who stopped catastrophizing their career.',
    'public',
    'sage',
    true,
    null
  ),
  (
    'reply-guys-anonymous',
    'Recovering reply guys',
    'A support group for anyone who has ever left a 4-paragraph comment on a stranger''s LinkedIn post explaining why they''re wrong, actually. First step: admitting it.',
    'public',
    'plum',
    true,
    null
  );
