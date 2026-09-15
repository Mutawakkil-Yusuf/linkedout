"use server";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const RESERVED = new Set(["admin", "root", "support", "mod", "staff", "linkedout", "system", "help", "api", "me", "u", "p"]);
const schema = z.object({
  handle: z.string().regex(/^[a-z0-9_]{3,24}$/, "3–24 chars, a–z 0–9 _"),
  display_name: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  now: z.string().max(140).optional(),
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
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "That didn't look right — try again." };
  if (RESERVED.has(parsed.data.handle)) return { error: "That handle is reserved." };
  const { error } = await supabase.from("profiles").insert({
    id: user.id, handle: parsed.data.handle,
    display_name: parsed.data.display_name ?? null,
    bio: parsed.data.bio ?? null, now: parsed.data.now ?? null,
  });
  if (error) {
    if (error.code === "23505") return { error: "Handle is taken." };
    return { error: error.message };
  }
  redirect("/rooms");
}
