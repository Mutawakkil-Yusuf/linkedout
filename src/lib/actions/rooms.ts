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

  // Owner just left. Hand the room to whoever's been here longest
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

// ═══════════════════════════════════════════════════════════════
// transfer ownership
// ═══════════════════════════════════════════════════════════════

const transferSchema = z.object({
  roomId: z.string().uuid(),
  toUserId: z.string().uuid(),
});

export async function transferOwnership(
  input: z.infer<typeof transferSchema>
): Promise<Result> {
  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase.rpc("transfer_room_ownership", {
    p_room: parsed.data.roomId,
    p_to: parsed.data.toUserId,
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from("mod_actions").insert({
    room_id: parsed.data.roomId,
    mod_id: user.id,
    action: "appoint_mod",
    target_user_id: parsed.data.toUserId,
    reason: "transferred room ownership",
  });

  const { data: room } = await supabase
    .from("rooms").select("slug").eq("id", parsed.data.roomId).maybeSingle();
  if (room?.slug) {
    revalidatePath(`/rooms/${room.slug}/mod/members`);
    revalidatePath(`/rooms/${room.slug}`);
  }

  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// pin / unpin a post to a room
// ═══════════════════════════════════════════════════════════════

const pinSchema = z.object({
  roomId: z.string().uuid(),
  postId: z.string().uuid(),
});

async function slugForRoom(supabase: Awaited<ReturnType<typeof createClient>>, roomId: string): Promise<string | null> {
  const { data } = await supabase
    .from("rooms").select("slug").eq("id", roomId).maybeSingle();
  return data?.slug ?? null;
}

export async function pinPost(input: z.infer<typeof pinSchema>): Promise<Result> {
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: isMod } = await supabase.rpc("is_room_mod", {
    p_room: parsed.data.roomId,
    p_user: user.id,
  });
  if (!isMod) return { ok: false, error: "Only moderators can pin." };

  const { data: post } = await supabase
    .from("posts")
    .select("id, room_id, author_id, deleted_at")
    .eq("id", parsed.data.postId)
    .maybeSingle();
  if (!post || post.room_id !== parsed.data.roomId || post.deleted_at) {
    return { ok: false, error: "That post isn't in this room." };
  }

  const { error } = await supabase
    .from("rooms")
    .update({ pinned_post_id: parsed.data.postId })
    .eq("id", parsed.data.roomId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("mod_actions").insert({
    room_id: parsed.data.roomId,
    mod_id: user.id,
    action: "pin_post",
    reason: "pinned a post to the room",
    target_post_id: parsed.data.postId,
  });

  const slug = await slugForRoom(supabase, parsed.data.roomId);
  if (slug) revalidatePath(`/rooms/${slug}`);
  return { ok: true };
}

export async function unpinPost(input: z.infer<typeof pinSchema>): Promise<Result> {
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: isMod } = await supabase.rpc("is_room_mod", {
    p_room: parsed.data.roomId,
    p_user: user.id,
  });
  if (!isMod) return { ok: false, error: "Only moderators can unpin." };

  const { error } = await supabase
    .from("rooms")
    .update({ pinned_post_id: null })
    .eq("id", parsed.data.roomId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("mod_actions").insert({
    room_id: parsed.data.roomId,
    mod_id: user.id,
    action: "unpin_post",
    reason: "unpinned a post from the room",
  });

  const slug = await slugForRoom(supabase, parsed.data.roomId);
  if (slug) revalidatePath(`/rooms/${slug}`);
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// invites: send, accept, decline, revoke
// ═══════════════════════════════════════════════════════════════

const sendInviteSchema = z.object({
  roomId: z.string().uuid(),
  inviteeId: z.string().uuid(),
  message: z.string().max(280).optional(),
});

export async function sendInvite(input: z.infer<typeof sendInviteSchema>): Promise<Result> {
  const parsed = sendInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase.from("room_invites").insert({
    room_id: parsed.data.roomId,
    inviter_id: user.id,
    invitee_id: parsed.data.inviteeId,
    message: parsed.data.message?.trim() || null,
  });

  if (error) {
    // Unique-violation on the "one pending invite" partial index reads as
    // a generic constraint error from Postgres. Translate it so the
    // person gets a sentence, not a raw DB message.
    if (error.code === "23505") return { ok: false, error: "You've already invited this person." };
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

const respondSchema = z.object({
  inviteId: z.string().uuid(),
});

export async function acceptInvite(input: z.infer<typeof respondSchema>): Promise<Result> {
  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_to_room_invite", {
    p_invite: parsed.data.inviteId,
    p_accept: true,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/rooms");
  return { ok: true };
}

export async function declineInvite(input: z.infer<typeof respondSchema>): Promise<Result> {
  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_to_room_invite", {
    p_invite: parsed.data.inviteId,
    p_accept: false,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/rooms");
  return { ok: true };
}

const revokeInviteSchema = z.object({ inviteId: z.string().uuid() });

export async function revokeInvite(input: z.infer<typeof revokeInviteSchema>): Promise<Result> {
  const parsed = revokeInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("room_invites")
    .update({ status: "revoked", resolved_at: new Date().toISOString() })
    .eq("id", parsed.data.inviteId);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// room share links — see 0018_room_share_links.sql for the trust
// model. Distinct from room_invites above: these are public-room-only,
// token-based, and don't require the sharer and joiner to already
// know each other.
// ─────────────────────────────────────────────────────────────

function randomToken(len = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

const createShareLinkSchema = z.object({ roomId: z.string().uuid(), slug: z.string().min(1) });

export type ShareLinkResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function createShareLink(
  input: z.infer<typeof createShareLinkSchema>
): Promise<ShareLinkResult> {
  const parsed = createShareLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid room" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Retry on the (extremely unlikely) token collision — unique constraint
  // in the migration is the real guarantee, this just makes it painless.
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = randomToken();
    const { error } = await supabase.from("room_share_links").insert({
      room_id: parsed.data.roomId,
      created_by: user.id,
      token,
    });
    if (!error) {
      revalidatePath(`/rooms/${parsed.data.slug}`);
      return { ok: true, token };
    }
    if (error.code !== "23505") return { ok: false, error: error.message };
  }
  return { ok: false, error: "Couldn't create a link, try again." };
}

const revokeShareLinkSchema = z.object({ linkId: z.string().uuid(), slug: z.string().min(1) });

export async function revokeShareLink(input: z.infer<typeof revokeShareLinkSchema>): Promise<Result> {
  const parsed = revokeShareLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("room_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.linkId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rooms/${parsed.data.slug}`);
  return { ok: true };
}

const redeemShareLinkSchema = z.object({ token: z.string().min(1) });

export type RedeemResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function redeemShareLink(
  input: z.infer<typeof redeemShareLinkSchema>
): Promise<RedeemResult> {
  const parsed = redeemShareLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid link" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("redeem_room_share_link", { p_token: parsed.data.token })
    .single<{ room_id: string; room_slug: string }>();

  if (error || !data) return { ok: false, error: error?.message ?? "Link not found" };

  revalidatePath(`/rooms/${data.room_slug}`);
  return { ok: true, slug: data.room_slug };
}
