-- Adds DiceBear-backed avatar selection to profiles.
-- avatar_style + avatar_seed together fully determine the generated
-- SVG (https://api.dicebear.com/10.x/{avatar_style}/svg?seed={avatar_seed}).
-- Both are nullable: a profile with no selection falls back to the
-- original gradient-initials avatar (see src/lib/avatar.ts).

alter table public.profiles
  add column avatar_style text check (avatar_style in ('lorelei', 'notionists', 'shadows')),
  add column avatar_seed text check (char_length(avatar_seed) <= 64);
