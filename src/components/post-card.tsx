"use client";
import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn, relativeTime } from "@/lib/utils";
import type { Post, Profile } from "@/lib/types";

type Props = { post: Pick<Post, "id" | "body" | "created_at">; author: Pick<Profile, "handle" | "display_name" | "avatar_style" | "avatar_seed"> | null; warmed?: boolean; };

export function PostCard({ post, author, warmed: warm0 = false }: Props) {
  const [warmed, setWarmed] = useState(warm0); const [pending, setPending] = useState(false);
  async function toggle() {
    if (pending || !author) return; setPending(true); const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { setPending(false); return; }
    if (warmed) { await supabase.from("reactions").delete().eq("post_id", post.id).eq("user_id", user.id); setWarmed(false); }
    else { await supabase.from("reactions").upsert({ post_id: post.id, user_id: user.id, kind: "ack" }); setWarmed(true); }
    setPending(false);
  }
  return <article className={cn("relative mb-3 overflow-hidden rounded-card border bg-card px-4 pb-3 pt-4 transition-colors", warmed ? "border-flame/15 bg-gradient-to-b from-[#fffafb] to-card" : "border-line hover:border-line-2")}>
    {warmed && <span className="absolute inset-y-0 left-0 w-[3px] bg-flame" aria-hidden />}
    <header className="mb-2 flex items-center gap-2.5"><Avatar handle={author?.handle ?? "??"} avatarStyle={author?.avatar_style} avatarSeed={author?.avatar_seed} /><div className="min-w-0 leading-tight"><div className="truncate text-[0.93rem] font-semibold text-ink">{author?.display_name ?? author?.handle ?? "unknown"}</div><Link href={`/u/${author?.handle}`} className="font-mono text-[0.75rem] text-muted hover:text-flame">@{author?.handle ?? "unknown"}</Link></div><time className="ml-auto shrink-0 font-mono text-[0.72rem] text-muted">{relativeTime(post.created_at)}</time></header>
    <p className="mb-2.5 whitespace-pre-wrap break-words text-[1rem] leading-relaxed text-ink">{post.body}</p>
    <footer className="flex gap-0.5 border-t border-line pt-2"><button onClick={toggle} className={cn("inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[0.8rem] font-medium transition", warmed ? "bg-flame/10 text-flame" : "text-muted hover:bg-flame/10 hover:text-flame")}><Heart className={cn("h-4 w-4", warmed && "fill-current")} />{warmed ? "warmed" : "send warmth"}</button><Link href={`/p/${post.id}`} className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[0.8rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink"><MessageCircle className="h-4 w-4" />reply</Link></footer>
  </article>;
}
