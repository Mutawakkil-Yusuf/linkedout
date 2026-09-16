// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roomVars } from "@/lib/room-theme";
import { RoomHeader } from "@/components/room-header";
import { PinnedNote } from "@/components/pinned-note";
import { RoomSidebar } from "@/components/room-sidebar";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { JoinRoomButton } from "@/components/join-room-button";

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, slug, name, description, visibility, accent, created_at, pinned_post_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!room) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count: memberCount } = await supabase
    .from("room_members").select("user_id", { count: "exact", head: true })
    .eq("room_id", room.id);

  const { data: ban } = await supabase
    .from("room_bans").select("reason")
    .eq("room_id", room.id).eq("user_id", user.id).maybeSingle();

  if (ban) {
    return (
      <div style={roomVars(room.accent)} className="pt-8">
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
    // Private rooms are invite-only from this point on (room_members_self_join
    // in 0014_ownership_transfer.sql only permits public/unlisted) — a
    // non-member landing here on a private room can't self-join at all.
    if (room.visibility === "private") {
      return (
        <div style={roomVars(room.accent)} className="pt-8">
          <RoomHeader room={room} memberCount={memberCount ?? 0} />
          <div className="rounded-card border border-line bg-card p-6 text-center text-[0.95rem] text-muted">
            This room is private. You'll need an invite from someone already inside.
          </div>
        </div>
      );
    }
    return (
      <div style={roomVars(room.accent)} className="pt-8">
        <RoomHeader room={room} memberCount={memberCount ?? 0} />
        <JoinRoomButton roomId={room.id} slug={room.slug} />
      </div>
    );
  }

  const [{ count: postCountToday }, { data: modRows }] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("room_id", room.id)
      .is("deleted_at", null)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    supabase
      .from("room_members")
      .select("user_id, role, profile:profiles!room_members_user_id_fkey(handle, display_name)")
      .eq("room_id", room.id)
      .in("role", ["owner", "mod"]),
  ]);

  const [{ data: pinned }, { data: posts }] = await Promise.all([
    room.pinned_post_id
      ? supabase
          .from("posts")
          .select("id, body, author:profiles!posts_author_id_fkey(handle, display_name)")
          .eq("id", room.pinned_post_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("posts")
      .select("id, body, created_at, hidden_at, author_id, room_id, mode, author:profiles!posts_author_id_fkey(handle, display_name, avatar_style, avatar_seed), reactions(count), replies(count)")
      .eq("room_id", room.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: warmRows } = postIds.length
    ? await supabase.from("reactions").select("post_id").in("post_id", postIds).eq("user_id", user.id)
    : { data: [] };
  const warmed = new Set((warmRows ?? []).map((r) => r.post_id));

  return (
    <div style={roomVars(room.accent)}>
      <RoomHeader
        room={room}
        memberCount={memberCount ?? 0}
        role={membership.role}
        joinedAt={membership.joined_at}
        isMod={isMod}
        openReports={openReports}
      />

      {pinned && (
        <PinnedNote postId={pinned.id} body={pinned.body} author={(pinned as any).author} />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_15rem] lg:gap-10">
        <div>
          <Composer roomId={room.id} />

          <div className="mb-4 flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
              Recent posts
            </h2>
            <span className="font-mono text-[0.7rem] text-muted">
              chronological{postCountToday ? ` · ${postCountToday} today` : ""}
            </span>
          </div>

          {posts?.length ? (
            <ul>
              {posts.map((p: any) => (
                <li key={p.id}>
                  <PostCard
                    post={p}
                    author={p.author}
                    warmed={warmed.has(p.id)}
                    currentUserId={user.id}
                    replyCount={p.replies?.[0]?.count ?? 0}
                    warmthCount={p.reactions?.[0]?.count ?? 0}
                    isMod={isMod}
                    isPinned={room.pinned_post_id === p.id}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-[0.95rem] text-muted">
              This room is quiet.
            </p>
          )}
        </div>

        <RoomSidebar
          roomSlug={room.slug}
          memberCount={memberCount ?? 0}
          postCountToday={postCountToday ?? 0}
          createdAt={room.created_at}
          visibility={room.visibility}
          moderators={(modRows ?? []).map((m: any) => ({
            user_id: m.user_id,
            role: m.role,
            profile: m.profile,
          }))}
          isMod={isMod}
        />
      </div>
    </div>
  );
}
