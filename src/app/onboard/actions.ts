"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AVATAR_STYLES } from "@/lib/avatar";

const RESERVED = new Set(["admin", "root", "support", "mod", "staff", "linkedout", "system", "help", "api", "me", "u", "p"]);
const schema = z.object({
  handle: z.string().regex(/^[a-z0-9_]{3,24}$/, "3–24 chars, a–z 0–9 _"),
  display_name: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  now: z.string().max(140).optional(),
  avatar_style: z.enum(AVATAR_STYLES).optional(),
  avatar_seed: z.string().max(64).optional(),
});

export async function createProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const parsed = schema.safeParse({
    handle: String(formData.get("handle") || "").trim().toLowerCase(),
    display_name: String(formData.get("display_name") || "").trim() || undefined,
    bio: String(formData.get("bio") || "").trim() || undefined,
    now: String(formData.get("now") || "").trim() || undefined,
    avatar_style: String(formData.get("avatar_style") || "").trim() || undefined,
    avatar_seed: String(formData.get("avatar_seed") || "").trim() || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "That didn't look right — try again." };
  if (RESERVED.has(parsed.data.handle)) return { error: "That handle is reserved." };
  const hasAvatar = parsed.data.avatar_style && parsed.data.avatar_seed;
  const { error } = await supabase.from("profiles").insert({
    id: user.id, handle: parsed.data.handle,
    display_name: parsed.data.display_name ?? null,
    bio: parsed.data.bio ?? null, now: parsed.data.now ?? null,
    avatar_style: hasAvatar ? parsed.data.avatar_style : null,
    avatar_seed: hasAvatar ? parsed.data.avatar_seed : null,
  });
  if (error) {
    if (error.code === "23505") return { error: "Handle is taken." };
    return { error: error.message };
  }
  redirect("/rooms");
}
