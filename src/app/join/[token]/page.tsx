// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { roomVars } from "@/lib/room-theme";
import { Lockup } from "@/components/logo";
import { JoinLinkRedeemer } from "@/components/join-link-redeemer";

export default async function JoinLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  // room_share_links_read (0018) allows this select for anon and
  // authenticated alike — non-revoked links on public rooms only.
  const { data: link } = await supabase
    .from("room_share_links")
    .select("id, room_id, rooms:room_id (slug, name, description, accent)")
    .eq("token", token)
    .maybeSingle<{
      id: string;
      room_id: string;
      rooms: { slug: string; name: string; description: string | null; accent: string | null } | null;
    }>();

  if (!link || !link.rooms) notFound();
  const room = link.rooms;

  const { count: memberCount } = await supabase
    .from("room_members").select("user_id", { count: "exact", head: true })
    .eq("room_id", link.room_id);

  // A taste of real content, not just a count — posts_read (0004) already
  // permits any *member* to read room posts, but this page runs for
  // signed-out visitors too. So this uses the same anon-safe shape as
  // public_room_wall (0015): body text only, no author identity, capped
  // to a handful of rows. Enough to show the room is alive without
  // exposing anything posts_read wouldn't already gate for a stranger.
  const { data: recentPosts } = await supabase.rpc("public_room_recent_posts", {
    p_room: link.room_id,
    p_limit: 3,
  });
  const posts = (recentPosts as { body: string; created_at: string }[] | null) ?? [];

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div style={roomVars(room.accent)} className="mx-auto max-w-[36rem] px-5 py-14">
      <header className="mb-12 flex items-center justify-between">
        <Link href="/"><Lockup size={34} /></Link>
        <span className="font-mono text-[0.72rem] text-muted">you were invited to a room</span>
      </header>

      <div className="mb-8 rounded-card border border-line bg-card p-6">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-flex h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--room-accent, #e8571f)" }}
          />
          <span className="font-mono text-[0.75rem] text-muted">
            {memberCount ?? 0} {memberCount === 1 ? "person" : "people"} here
          </span>
        </div>
        <h1 className="mb-2 font-display text-[1.8rem] font-bold leading-tight tracking-[-0.03em]">
          {room.name}
        </h1>
        {room.description && (
          <p className="text-[0.95rem] leading-relaxed text-ink-2">{room.description}</p>
        )}
      </div>

      {recentPosts && recentPosts.length > 0 && (
        <div className="mb-10 space-y-3">
          <p className="font-mono text-[0.7rem] uppercase tracking-wider text-muted">
            what people are saying
          </p>
          {posts.map((p, i) => (
            <div key={i} className="rounded-card border border-line bg-card p-4">
              <p className="text-[0.9rem] leading-relaxed text-ink-2">{p.body}</p>
            </div>
          ))}
        </div>
      )}

      <JoinLinkRedeemer token={token} roomSlug={room.slug} signedIn={Boolean(user)} />
    </div>
  );
}
