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

const leaveSchema = z.object({ roomId: z.string().uuid(), slug: z.string().min(1) });

export async function leaveRoom(input: z.infer<typeof leaveSchema>): Promise<Result> {
  const parsed = leaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid room" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: membership } = await supabase
    .from("room_members").select("role")
    .eq("room_id", parsed.data.roomId).eq("user_id", user.id).maybeSingle();

  if (!membership) return { ok: false, error: "You're not in this room" };
  const wasOwner = membership.role === "owner";

  const { error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  // Owner just left — hand the room to whoever's been here longest
  // (mods first, then members, by join date). If no one's left, the
  // room simply has no owner until someone new joins.
  if (wasOwner) {
    await supabase.rpc("promote_next_owner", { p_room: parsed.data.roomId });
  }

  revalidatePath(`/rooms/${parsed.data.slug}`);
  revalidatePath(`/rooms/${parsed.data.slug}/mod/members`);
  revalidatePath("/rooms");
  return { ok: true };
}

const deleteRoomSchema = z.object({ roomId: z.string().uuid() });

export async function deleteRoom(input: z.infer<typeof deleteRoomSchema>): Promise<Result> {
  const parsed = deleteRoomSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid room" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: membership } = await supabase
    .from("room_members").select("role")
    .eq("room_id", parsed.data.roomId).eq("user_id", user.id).maybeSingle();
  if (membership?.role !== "owner") return { ok: false, error: "Only the room owner can delete it" };

  const { error } = await supabase.from("rooms").delete().eq("id", parsed.data.roomId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/rooms");
  return { ok: true };
}

const appointModSchema = z.object({ roomId: z.string().uuid(), userId: z.string().uuid(), slug: z.string().min(1) });

export async function appointMod(input: z.infer<typeof appointModSchema>): Promise<Result> {
  const parsed = appointModSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: mine } = await supabase
    .from("room_members").select("role")
    .eq("room_id", parsed.data.roomId).eq("user_id", user.id).maybeSingle();
  if (mine?.role !== "owner") return { ok: false, error: "Only the room owner can appoint moderators" };

  const { error } = await supabase
    .from("room_members")
    .update({ role: "mod" })
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", parsed.data.userId)
    .eq("role", "member");
  if (error) return { ok: false, error: error.message };

  await supabase.from("mod_actions").insert({
    room_id: parsed.data.roomId,
    mod_id: user.id,
    action: "appoint_mod",
    reason: "Appointed by room owner",
    target_user_id: parsed.data.userId,
  });

  revalidatePath(`/rooms/${parsed.data.slug}`);
  revalidatePath(`/rooms/${parsed.data.slug}/mod/members`);
  revalidatePath(`/rooms/${parsed.data.slug}/mod/log`);
  return { ok: true };
}

const removeModSchema = z.object({ roomId: z.string().uuid(), userId: z.string().uuid(), slug: z.string().min(1) });

export async function removeMod(input: z.infer<typeof removeModSchema>): Promise<Result> {
  const parsed = removeModSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: mine } = await supabase
    .from("room_members").select("role")
    .eq("room_id", parsed.data.roomId).eq("user_id", user.id).maybeSingle();
  if (mine?.role !== "owner") return { ok: false, error: "Only the room owner can remove moderators" };

  const { error } = await supabase
    .from("room_members")
    .update({ role: "member" })
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", parsed.data.userId)
    .eq("role", "mod");
  if (error) return { ok: false, error: error.message };

  await supabase.from("mod_actions").insert({
    room_id: parsed.data.roomId,
    mod_id: user.id,
    action: "remove_mod",
    reason: "Removed by room owner",
    target_user_id: parsed.data.userId,
  });

  revalidatePath(`/rooms/${parsed.data.slug}`);
  revalidatePath(`/rooms/${parsed.data.slug}/mod/members`);
  revalidatePath(`/rooms/${parsed.data.slug}/mod/log`);
  return { ok: true };
}
