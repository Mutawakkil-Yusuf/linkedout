// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post-card";
import { ReplyForm } from "@/components/reply-form";
import { Avatar } from "@/components/ui/avatar";
import { relativeTime } from "@/lib/utils";
import { PostReplyMobile } from "@/components/mobile/post-reply-mobile";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: post } = await supabase.from("posts").select("id, body, created_at, author_id, room_id, author:profiles!posts_author_id_fkey(handle, display_name, avatar_style, avatar_seed), reactions(count)").eq("id", id).maybeSingle();
  if (!post) notFound();
  const { data: replies } = await supabase.from("replies").select("id, body, created_at, author:profiles!replies_author_id_fkey(handle, display_name, avatar_style, avatar_seed)").eq("post_id", id).is("deleted_at", null).order("created_at", { ascending: true });
  const { data: myProfile } = user
    ? await supabase.from("profiles").select("handle, avatar_style, avatar_seed").eq("id", user.id).maybeSingle()
    : { data: null };
  const postAuthorHandle = (post as any).author?.handle ?? "user";
  return <div className="pb-24 pt-8 lg:pb-8"><PostCard post={post as any} author={(post as any).author} currentUserId={user?.id ?? null} replyCount={replies?.length ?? 0} warmthCount={(post as any).reactions?.[0]?.count ?? 0} /><div className="hidden lg:block"><ReplyForm postId={id} /></div><ul>{replies?.map((r: any) => <li key={r.id} className="mb-3 rounded-card border border-line bg-card p-4"><header className="mb-2 flex items-center gap-2.5"><Avatar handle={r.author?.handle ?? "??"} avatarStyle={r.author?.avatar_style} avatarSeed={r.author?.avatar_seed} size="sm" /><div className="min-w-0 flex-1 truncate text-[0.9rem] font-semibold">{r.author?.display_name ?? r.author?.handle}</div><time className="ml-auto flex-none font-mono text-[0.72rem] text-muted">{relativeTime(r.created_at)}</time></header><p className="whitespace-pre-wrap break-words text-[1rem] leading-relaxed text-ink">{r.body}</p></li>)}</ul>{myProfile?.handle && <PostReplyMobile postId={id} handle={myProfile.handle} avatarStyle={myProfile.avatar_style} avatarSeed={myProfile.avatar_seed} replyingTo={postAuthorHandle} />}</div>;
}
