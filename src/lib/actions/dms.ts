"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type StartResult = { ok: true; threadId: string } | { ok: false; error: string };

const startSchema = z.object({ otherUserId: z.string().uuid() });

export async function startDm(input: z.infer<typeof startSchema>): Promise<StartResult> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase.rpc("get_or_create_dm_thread", {
    p_other: parsed.data.otherUserId,
  });
  if (error) {
    if (error.message.includes("no shared room")) {
      return { ok: false, error: "You need to share a room with them first." };
    }
    if (error.message.includes("cannot dm yourself")) {
      return { ok: false, error: "You can't message yourself." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, threadId: data as string };
}

const sendSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});

export async function sendDm(input: z.infer<typeof sendSchema>) {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid message" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("dm_messages")
    .insert({
      thread_id: parsed.data.threadId,
      sender_id: user.id,
      body: parsed.data.body,
    })
    .select("id, sender_id, body, created_at")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, message: data };
}

export async function startDmAndRedirect(otherUserId: string) {
  const res = await startDm({ otherUserId });
  if (!res.ok) return res;
  redirect(`/dms/${res.threadId}`);
}
