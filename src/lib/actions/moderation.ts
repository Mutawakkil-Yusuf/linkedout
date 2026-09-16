"use server";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

const REASONS = ["harassment","doxxing","bad_faith","spam","off_topic","other"] as const;

// ─────────────── report ───────────────
const reportSchema = z.object({
  targetType: z.enum(["post","reply","user"]),
  targetId: z.string().uuid(),
  roomId: z.string().uuid(),
  reason: z.enum(REASONS),
  note: z.string().max(500).optional(),
});

export async function createReport(input: z.infer<typeof reportSchema>): Promise<Result> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid report" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const row: Record<string, unknown> = {
    room_id: parsed.data.roomId,
    reporter_id: user.id,
    reason: parsed.data.reason,
    note: parsed.data.note ?? null,
  };
  if (parsed.data.targetType === "post")  row.target_post_id  = parsed.data.targetId;
  if (parsed.data.targetType === "reply") row.target_reply_id = parsed.data.targetId;
  if (parsed.data.targetType === "user")  row.target_user_id  = parsed.data.targetId;

  const { error } = await supabase.from("reports").insert(row);
  if (error) {
    if (error.message.includes("report_rate_ok"))
      return { ok: false, error: "You've reported too many things recently. Try again later." };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ─────────────── helpers ───────────────
async function slugFor(supabase: any, roomId: string): Promise<string | null> {
  const { data } = await supabase.from("rooms").select("slug").eq("id", roomId).maybeSingle();
  return data?.slug ?? null;
}

function revalidateRoom(slug: string | null) {
  if (!slug) return;
  revalidatePath(`/rooms/${slug}`);
  revalidatePath(`/rooms/${slug}/mod`);
  revalidatePath(`/rooms/${slug}/mod/log`);
}

async function logModAction(
  supabase: any,
  args: {
    roomId: string; modId: string; action: string; reason: string;
    targetPostId?: string | null; targetReplyId?: string | null;
    targetUserId?: string | null; reportId?: string | null;
  }
) {
  await supabase.from("mod_actions").insert({
    room_id: args.roomId,
    mod_id: args.modId,
    action: args.action,
    reason: args.reason,
    target_post_id:  args.targetPostId  ?? null,
    target_reply_id: args.targetReplyId ?? null,
    target_user_id:  args.targetUserId  ?? null,
    report_id:       args.reportId      ?? null,
  });
}

async function notifyTarget(supabase: any, modId: string, targetUserId: string, body: string) {
  if (modId === targetUserId) return;

  const { data: thread } = await supabase
    .from("dm_threads").insert({}).select("id").single();
  if (!thread) return;

  await supabase.from("dm_members").insert([
    { thread_id: thread.id, user_id: targetUserId },
    { thread_id: thread.id, user_id: modId },
  ]);

  await supabase.from("dm_messages").insert({
    thread_id: thread.id,
    sender_id: modId,
    body,
  });
}

// ─────────────── post / reply actions ───────────────
const actionSchema = z.object({
  targetId: z.string().uuid(),
  reason: z.string().min(1).max(280),
});

export async function hidePost(input: z.infer<typeof actionSchema>): Promise<Result> {
  return runOnPost(input, "hide");
}
export async function unhidePost(input: z.infer<typeof actionSchema>): Promise<Result> {
  return runOnPost(input, "unhide");
}
export async function removePost(input: z.infer<typeof actionSchema>): Promise<Result> {
  return runOnPost(input, "remove");
}
export async function hideReply(input: z.infer<typeof actionSchema>): Promise<Result> {
  return runOnReply(input, "hide");
}
export async function unhideReply(input: z.infer<typeof actionSchema>): Promise<Result> {
  return runOnReply(input, "unhide");
}
export async function removeReply(input: z.infer<typeof actionSchema>): Promise<Result> {
  return runOnReply(input, "remove");
}

async function runOnPost(
  input: z.infer<typeof actionSchema>,
  mode: "hide" | "unhide" | "remove"
): Promise<Result> {
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: post } = await supabase
    .from("posts").select("id, room_id, author_id").eq("id", parsed.data.targetId).maybeSingle();
  if (!post) return { ok: false, error: "Not found" };
  if (!post.room_id) return { ok: false, error: "Only room posts can be moderated" };

  const { data: isMod } = await supabase.rpc("is_room_mod", { p_room: post.room_id, p_user: user.id });
  if (!isMod) return { ok: false, error: "Not a moderator" };

  const patch: Record<string, unknown> =
    mode === "hide"   ? { hidden_at: new Date().toISOString(), hidden_by: user.id } :
    mode === "unhide" ? { hidden_at: null, hidden_by: null } :
                        { deleted_at: new Date().toISOString() };

  const { error } = await supabase.from("posts").update(patch).eq("id", post.id);
  if (error) return { ok: false, error: error.message };

  await logModAction(supabase, {
    roomId: post.room_id, modId: user.id,
    action: mode === "hide" ? "hide_post" : mode === "unhide" ? "unhide_post" : "remove_post",
    reason: parsed.data.reason,
    targetPostId: post.id,
    targetUserId: post.author_id,
  });

  if (mode !== "unhide") {
    const label = mode === "hide" ? "hidden" : "removed";
    await notifyTarget(
      supabase, user.id, post.author_id,
      `Your post was ${label} by a moderator.\n\nReason: ${parsed.data.reason}\n\nIf you think this was a mistake, you can reply here.`
    );
  }

  revalidateRoom(await slugFor(supabase, post.room_id));
  return { ok: true };
}

async function runOnReply(
  input: z.infer<typeof actionSchema>,
  mode: "hide" | "unhide" | "remove"
): Promise<Result> {
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: reply } = await supabase
    .from("replies")
    .select("id, author_id, post:posts!replies_post_id_fkey(room_id)")
    .eq("id", parsed.data.targetId).maybeSingle();
  if (!reply) return { ok: false, error: "Not found" };

  const roomId = (reply.post as any)?.room_id as string | null;
  if (!roomId) return { ok: false, error: "Only room replies can be moderated" };

  const { data: isMod } = await supabase.rpc("is_room_mod", { p_room: roomId, p_user: user.id });
  if (!isMod) return { ok: false, error: "Not a moderator" };

  const patch: Record<string, unknown> =
    mode === "hide"   ? { hidden_at: new Date().toISOString(), hidden_by: user.id } :
    mode === "unhide" ? { hidden_at: null, hidden_by: null } :
                        { deleted_at: new Date().toISOString() };

  const { error } = await supabase.from("replies").update(patch).eq("id", reply.id);
  if (error) return { ok: false, error: error.message };

  await logModAction(supabase, {
    roomId, modId: user.id,
    action: mode === "hide" ? "hide_reply" : mode === "unhide" ? "unhide_reply" : "remove_reply",
    reason: parsed.data.reason,
    targetReplyId: reply.id,
    targetUserId: reply.author_id,
  });

  if (mode !== "unhide") {
    const label = mode === "hide" ? "hidden" : "removed";
    await notifyTarget(supabase, user.id, reply.author_id,
      `Your reply was ${label} by a moderator.\n\nReason: ${parsed.data.reason}`);
  }

  revalidateRoom(await slugFor(supabase, roomId));
  return { ok: true };
}

// ─────────────── ban / unban ───────────────
const banSchema = z.object({
  roomId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().min(1).max(280),
});

export async function banUser(input: z.infer<typeof banSchema>): Promise<Result> {
  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (parsed.data.userId === user.id) return { ok: false, error: "You can't ban yourself" };

  const { data: isMod } = await supabase.rpc("is_room_mod", { p_room: parsed.data.roomId, p_user: user.id });
  if (!isMod) return { ok: false, error: "Not a moderator" };

  const { data: owner } = await supabase
    .from("room_members").select("role")
    .eq("room_id", parsed.data.roomId).eq("user_id", parsed.data.userId).maybeSingle();
  if (owner?.role === "owner") return { ok: false, error: "Cannot ban the room owner" };

  const { error } = await supabase.from("room_bans").insert({
    room_id: parsed.data.roomId,
    user_id: parsed.data.userId,
    banned_by: user.id,
    reason: parsed.data.reason,
  });
  if (error && error.code !== "23505") return { ok: false, error: error.message };

  await supabase.from("room_members")
    .delete()
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", parsed.data.userId);

  await logModAction(supabase, {
    roomId: parsed.data.roomId, modId: user.id,
    action: "ban_user", reason: parsed.data.reason,
    targetUserId: parsed.data.userId,
  });

  await notifyTarget(supabase, user.id, parsed.data.userId,
    `You've been banned from #${(await slugFor(supabase, parsed.data.roomId)) ?? "a room"}.\n\nReason: ${parsed.data.reason}`);

  revalidateRoom(await slugFor(supabase, parsed.data.roomId));
  return { ok: true };
}

const unbanSchema = z.object({
  roomId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().min(1).max(280),
});

export async function unbanUser(input: z.infer<typeof unbanSchema>): Promise<Result> {
  const parsed = unbanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: isMod } = await supabase.rpc("is_room_mod", { p_room: parsed.data.roomId, p_user: user.id });
  if (!isMod) return { ok: false, error: "Not a moderator" };

  const { error } = await supabase.from("room_bans")
    .delete()
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", parsed.data.userId);
  if (error) return { ok: false, error: error.message };

  await logModAction(supabase, {
    roomId: parsed.data.roomId, modId: user.id,
    action: "unban_user", reason: parsed.data.reason,
    targetUserId: parsed.data.userId,
  });

  revalidateRoom(await slugFor(supabase, parsed.data.roomId));
  return { ok: true };
}

// ─────────────── kick (remove membership only, no ban) ───────────────
const kickSchema = z.object({
  roomId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().min(1).max(280),
});

export async function kickMember(input: z.infer<typeof kickSchema>): Promise<Result> {
  const parsed = kickSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (parsed.data.userId === user.id) return { ok: false, error: "You can't kick yourself — use leave room instead" };

  const { data: isMod } = await supabase.rpc("is_room_mod", { p_room: parsed.data.roomId, p_user: user.id });
  if (!isMod) return { ok: false, error: "Not a moderator" };

  const { data: target } = await supabase
    .from("room_members").select("role")
    .eq("room_id", parsed.data.roomId).eq("user_id", parsed.data.userId).maybeSingle();
  if (!target) return { ok: false, error: "That person isn't in this room" };
  if (target.role === "owner") return { ok: false, error: "Cannot kick the room owner" };

  const { error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", parsed.data.userId);
  if (error) return { ok: false, error: error.message };

  await logModAction(supabase, {
    roomId: parsed.data.roomId, modId: user.id,
    action: "remove_member", reason: parsed.data.reason,
    targetUserId: parsed.data.userId,
  });

  const slug = await slugFor(supabase, parsed.data.roomId);

  await notifyTarget(supabase, user.id, parsed.data.userId,
    `You were removed from #${slug ?? "a room"} by a moderator.\n\nReason: ${parsed.data.reason}\n\nYou're welcome to rejoin — this isn't a ban.`);

  revalidateRoom(slug);
  if (slug) revalidatePath(`/rooms/${slug}/mod/members`);
  return { ok: true };
}

// ─────────────── handle a report ───────────────
const handleSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["hide", "remove", "ban", "dismiss"]),
  reason: z.string().min(1).max(280),
});

export async function handleReport(input: z.infer<typeof handleSchema>): Promise<Result> {
  const parsed = handleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: report } = await supabase
    .from("reports").select("*").eq("id", parsed.data.reportId).maybeSingle();
  if (!report) return { ok: false, error: "Report not found" };
  if (report.status !== "open") return { ok: false, error: "Already handled" };

  const { data: isMod } = await supabase.rpc("is_room_mod", { p_room: report.room_id, p_user: user.id });
  if (!isMod) return { ok: false, error: "Not a moderator" };

  // recusal
  if (report.target_post_id) {
    const { data: p } = await supabase.from("posts").select("author_id").eq("id", report.target_post_id).maybeSingle();
    if (p?.author_id === user.id) return { ok: false, error: "You can't handle a report about your own post" };
  }
  if (report.target_reply_id) {
    const { data: r } = await supabase.from("replies").select("author_id").eq("id", report.target_reply_id).maybeSingle();
    if (r?.author_id === user.id) return { ok: false, error: "You can't handle a report about your own reply" };
  }

  if (parsed.data.action === "hide") {
    if (report.target_post_id) {
      const res = await hidePost({ targetId: report.target_post_id, reason: parsed.data.reason });
      if (!res.ok) return res;
    } else if (report.target_reply_id) {
      const res = await hideReply({ targetId: report.target_reply_id, reason: parsed.data.reason });
      if (!res.ok) return res;
    }
  }

  if (parsed.data.action === "remove") {
    if (report.target_post_id) {
      const res = await removePost({ targetId: report.target_post_id, reason: parsed.data.reason });
      if (!res.ok) return res;
    } else if (report.target_reply_id) {
      const res = await removeReply({ targetId: report.target_reply_id, reason: parsed.data.reason });
      if (!res.ok) return res;
    }
  }

  if (parsed.data.action === "ban" && report.target_user_id) {
    const res = await banUser({ roomId: report.room_id, userId: report.target_user_id, reason: parsed.data.reason });
    if (!res.ok) return res;
  }

  const newStatus = parsed.data.action === "dismiss" ? "dismissed" : "resolved";
  await supabase.from("reports").update({
    status: newStatus, handled_by: user.id, handled_at: new Date().toISOString(),
  }).eq("id", report.id);

  await logModAction(supabase, {
    roomId: report.room_id, modId: user.id,
    action: parsed.data.action === "dismiss" ? "dismiss_report" : "resolve_report",
    reason: parsed.data.reason,
    reportId: report.id,
    targetPostId:  report.target_post_id,
    targetReplyId: report.target_reply_id,
    targetUserId:  report.target_user_id,
  });

  revalidateRoom(await slugFor(supabase, report.room_id));
  return { ok: true };
}
