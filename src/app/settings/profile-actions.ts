"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  display_name: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  now: z.string().max(140).optional(),
});

export async function updateProfile(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You've been signed out — refresh and try again." };

  const parsed = schema.safeParse({
    display_name: String(formData.get("display_name") || "").trim() || undefined,
    bio: String(formData.get("bio") || "").trim() || undefined,
    now: String(formData.get("now") || "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "That didn't look right — try again." };
  }

  const { data: profile } = await supabase.from("profiles").select("handle").eq("id", user.id).maybeSingle();

  const { error } = await supabase.from("profiles").update({
    display_name: parsed.data.display_name ?? null,
    bio: parsed.data.bio ?? null,
    now: parsed.data.now ?? null,
  }).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  if (profile?.handle) revalidatePath(`/u/${profile.handle}`);
  return { ok: true };
}
