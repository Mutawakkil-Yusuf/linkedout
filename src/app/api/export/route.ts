import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Sign in first.", { status: 401 });
  const [profile, posts, replies, dms, memberships] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("posts").select("*").eq("author_id", user.id),
    supabase.from("replies").select("*").eq("author_id", user.id),
    supabase.from("dm_messages").select("*").eq("sender_id", user.id),
    supabase.from("room_members").select("*").eq("user_id", user.id),
  ]);
  const bundle = { exported_at: new Date().toISOString(), version: 1, profile: profile.data, room_memberships: memberships.data ?? [], posts: posts.data ?? [], replies: replies.data ?? [], dm_messages: dms.data ?? [] };
  const md = [`# LinkedOut export for @${profile.data?.handle ?? user.id}`, "", "## Posts", ...(posts.data ?? []).map((p: any) => `### ${p.created_at}\n\n${p.body}\n`), "## Replies", ...(replies.data ?? []).map((r: any) => `### ${r.created_at}\n\n${r.body}\n`)].join("\n");
  return new NextResponse(JSON.stringify({ ...bundle, markdown: md }, null, 2), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="linkedout-export-${user.id}.json"` } });
}
