import type { AvatarStyle } from "./avatar";

export type Profile = {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  now: string | null;
  avatar_style: AvatarStyle | null;
  avatar_seed: string | null;
  created_at: string;
};

export type Room = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: "public" | "unlisted";
  created_by: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  room_id: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  hidden_at: string | null;
  hidden_by: string | null;
};

export type Reply = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  hidden_at: string | null;
  hidden_by: string | null;
};

export type Report = {
  id: string;
  room_id: string;
  reporter_id: string;
  target_post_id: string | null;
  target_reply_id: string | null;
  target_user_id: string | null;
  reason: "harassment" | "doxxing" | "bad_faith" | "spam" | "off_topic" | "other";
  note: string | null;
  status: "open" | "resolved" | "dismissed";
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
};

export type ModAction = {
  id: string;
  room_id: string;
  mod_id: string | null;
  action:
    | "hide_post" | "unhide_post" | "remove_post"
    | "hide_reply" | "unhide_reply" | "remove_reply"
    | "ban_user" | "unban_user"
    | "appoint_mod" | "remove_mod"
    | "dismiss_report" | "resolve_report";
  target_post_id: string | null;
  target_reply_id: string | null;
  target_user_id: string | null;
  report_id: string | null;
  reason: string;
  created_at: string;
};

export type RoomBan = {
  room_id: string;
  user_id: string;
  banned_by: string | null;
  reason: string;
  created_at: string;
};
