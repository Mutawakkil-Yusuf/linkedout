-- ═══════════════════════════════════════════════════════════════
-- LinkedOut · room redesign
-- Adds: rooms.accent, rooms.pinned_post_id, posts.mode
-- ═══════════════════════════════════════════════════════════════

alter table public.rooms
  add column if not exists accent text not null default 'flame'
    check (accent in ('flame','moss','amber','plum','sage','indigo'));

alter table public.rooms
  add column if not exists pinned_post_id uuid
    references public.posts(id) on delete set null;

alter table public.posts
  add column if not exists mode text not null default 'normal'
    check (mode in ('normal','spoiler','quiet'));

comment on column public.posts.mode is
  'normal = regular post. spoiler = blurred until clicked. '
  'quiet = does not bump room activity or notify.';

comment on column public.rooms.pinned_post_id is
  'One pinned post per room. Must belong to the room. Set via pinPost action.';
