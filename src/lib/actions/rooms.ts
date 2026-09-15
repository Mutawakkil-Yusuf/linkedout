"use server";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

const joinSchema = z.object({ roomId: z.string().uuid(), slug: z.string().min(1) });

export async function joinRoom(input: z.infer<typeof joinSchema>): Promise<Result> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid room" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("room_members")
    .insert({ room_id: parsed.data.roomId, user_id: user.id });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rooms/${parsed.data.slug}`);
  return { ok: true };
}
