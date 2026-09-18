// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { PostCard } from "@/components/post-card";
import { NowLine } from "@/components/now-line";
import { MessageButton } from "@/components/message-button";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params; const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, handle, display_name, bio, now, avatar_style, avatar_seed, created_at, early_badge").eq("handle", handle).maybeSingle();
  if (!profile) notFound();
  const { data: posts } = await supabase.from("posts").select("id, body, created_at, hidden_at, author_id, room_id, author:profiles!posts_author_id_fkey(handle, display_name, avatar_style, avatar_seed), reactions(count), replies(count)").eq("author_id", profile.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(50);
  const joined = new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" });

  const { data: { user } } = await supabase.auth.getUser();
  const isSelf = user?.id === profile.id;

  let canDm = false;
  if (!isSelf && user) {
    const { data } = await supabase.rpc("can_dm_user", { p_other: profile.id });
    canDm = data === true;
  }

  return <div className="pt-8"><header className="flex items-center gap-4 border-b border-line pb-5"><Avatar handle={profile.handle} avatarStyle={profile.avatar_style} avatarSeed={profile.avatar_seed} size="lg" /><div className="min-w-0 flex-1"><h1 className="flex flex-wrap items-center gap-2 break-words font-display text-[1.4rem] font-bold tracking-[-0.025em]">{profile.display_name ?? `@${profile.handle}`}{profile.early_badge && <EarlyBadge />}</h1><div className="mt-0.5 break-words font-mono text-[0.8rem] text-muted">@{profile.handle} · here since {joined}</div></div>{canDm && <MessageButton otherUserId={profile.id} otherHandle={profile.handle} />}{isSelf && <a href="/api/card" download={`${profile.handle}-linkedout.png`} className="inline-flex items-center justify-center rounded-full border border-line-2 bg-card px-4 py-2 font-mono text-[0.75rem] font-medium text-ink transition hover:bg-paper-2">Share card ↓</a>}</header><NowLine text={profile.now} />{profile.bio && <p className="mb-3 whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-ink-2">{profile.bio}</p>}<ul className="mt-6">{posts?.length ? posts.map((p: any) => <li key={p.id}><PostCard post={p} author={p.author} currentUserId={user?.id ?? null} replyCount={p.replies?.[0]?.count ?? 0} warmthCount={p.reactions?.[0]?.count ?? 0} /></li>) : <li className="rounded-card border border-line bg-card p-6 text-center text-[0.95rem] text-muted">Nothing posted yet.</li>}</ul></div>;
}

function EarlyBadge() {
  return (
    <span
      title="One of the first 50 people here"
      className="inline-flex items-center gap-1 rounded-full bg-flame/10 px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] text-flame-deep"
    >
      out #early
    </span>
  );
}
