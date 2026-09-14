export type Profile = {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  now: string | null;
  avatar_style: "lorelei" | "notionists" | "shadows" | null;
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
};

export type Reply = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
};
