// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { JoinRoomButton } from "@/components/join-room-button";
import { RoomHeader } from "@/components/room-header";

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms").select("id, slug, name, description, created_at").eq("slug", slug).maybeSingle();
  if (!room) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count: memberCount } = await supabase
    .from("room_members").select("user_id", { count: "exact", head: true })
    .eq("room_id", room.id);

  const { data: ban } = await supabase
    .from("room_bans").select("reason, created_at")
    .eq("room_id", room.id).eq("user_id", user.id).maybeSingle();

  if (ban) {
    return (
      <div className="pt-8">
        <RoomHeader room={room} memberCount={memberCount ?? 0} />
        <div className="rounded-card border border-flame/20 bg-flame/5 p-5">
          <p className="mb-1 font-display text-[1.05rem] font-bold tracking-[-0.02em] text-flame-deep">
            You're banned from this room
          </p>
          <p className="text-[0.95rem] text-ink-2">Reason: {ban.reason}</p>
        </div>
      </div>
    );
  }

  const { data: membership } = await supabase
    .from("room_members").select("role, joined_at")
    .eq("room_id", room.id).eq("user_id", user.id).maybeSingle();

  const isMod = membership?.role === "mod" || membership?.role === "owner";

  let openReports = 0;
  if (isMod) {
    const { count } = await supabase
      .from("reports").select("id", { count: "exact", head: true })
      .eq("room_id", room.id).eq("status", "open");
    openReports = count ?? 0;
  }

  if (!membership) {
    return (
      <div className="pt-8">
        <RoomHeader room={room} memberCount={memberCount ?? 0} />
        <JoinRoomButton roomId={room.id} slug={room.slug} />
      </div>
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id, body, created_at, hidden_at, author_id, room_id, author:profiles!posts_author_id_fkey(handle, display_name, avatar_style, avatar_seed), reactions(count), replies(count)")
    .eq("room_id", room.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: warmRows } = postIds.length
    ? await supabase.from("reactions").select("post_id").in("post_id", postIds).eq("user_id", user.id)
    : { data: [] };
  const warmed = new Set((warmRows ?? []).map((r) => r.post_id));

  return (
    <div className="pt-8">
      <RoomHeader
        room={room}
        memberCount={memberCount ?? 0}
        role={membership.role}
        joinedAt={membership.joined_at}
        isMod={isMod}
        openReports={openReports}
      />
      <Composer roomId={room.id} />
      <ul>
        {posts?.length ? posts.map((p: any) => (
          <li key={p.id}>
            <PostCard
              post={p}
              author={p.author}
              warmed={warmed.has(p.id)}
              currentUserId={user.id}
              replyCount={p.replies?.[0]?.count ?? 0}
              warmthCount={p.reactions?.[0]?.count ?? 0}
            />
          </li>
        )) : (
          <li className="rounded-card border border-line bg-card p-6 text-center text-[0.95rem] text-muted">
            This room is quiet.
          </li>
        )}
      </ul>
    </div>
  );
}
