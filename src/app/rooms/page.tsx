// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RoomCard, type RoomListing } from "@/components/room-card";
import { PendingInvitesBanner } from "@/components/pending-invites-banner";
import { DiscoverSection } from "@/components/discover-section";

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberRows } = await supabase
    .from("room_members")
    .select(`
      role,
      room:rooms(id, slug, name, description, accent, visibility, created_at)
    `)
    .eq("user_id", user.id);

  const myRooms: { role: "owner" | "mod" | "member"; room: any }[] =
    (memberRows ?? [])
      .filter((m: any) => m.room)
      .map((m: any) => ({ role: m.role, room: m.room }));

  const myRoomIds = new Set(myRooms.map((r) => r.room.id));

  const { data: publicRows } = await supabase
    .from("rooms")
    .select("id, slug, name, description, accent, visibility, created_at")
    .eq("visibility", "public");

  const totalPublicRoomCount = publicRows?.length ?? 0;
  const discoverRooms = (publicRows ?? []).filter((r: any) => !myRoomIds.has(r.id));
  const hasJoinedAllPublicRooms = totalPublicRoomCount > 0 && discoverRooms.length === 0;

  const allIds = [
    ...myRooms.map((r) => r.room.id),
    ...discoverRooms.map((r: any) => r.id),
  ];

  const stats = new Map<
    string,
    { member_count: number; posts_today: number; last_post_at: string | null }
  >();
  if (allIds.length > 0) {
    const { data } = await supabase.rpc("room_listing_stats", { p_room_ids: allIds });
    for (const row of (data as any[]) ?? []) {
      stats.set(row.room_id, {
        member_count: Number(row.member_count ?? 0),
        posts_today: Number(row.posts_today ?? 0),
        last_post_at: row.last_post_at ?? null,
      });
    }
  }

  const { data: invites } = await supabase
    .from("room_invites")
    .select(`
      id, message, created_at,
      room:rooms!room_invites_room_id_fkey(slug, name),
      inviter:profiles!room_invites_inviter_id_fkey(handle, display_name)
    `)
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const toListing = (room: any, role: RoomListing["my_role"]): RoomListing => {
    const s = stats.get(room.id);
    return {
      id: room.id,
      slug: room.slug,
      name: room.name,
      description: room.description,
      accent: room.accent,
      visibility: room.visibility,
      created_at: room.created_at,
      my_role: role,
      member_count: s?.member_count ?? 0,
      posts_today: s?.posts_today ?? 0,
      last_post_at: s?.last_post_at ?? null,
    };
  };

  const sortByActivity = (a: RoomListing, b: RoomListing) => {
    const aT = a.last_post_at ?? a.created_at;
    const bT = b.last_post_at ?? b.created_at;
    return new Date(bT).getTime() - new Date(aT).getTime();
  };

  const mine = myRooms.map((r) => toListing(r.room, r.role)).sort(sortByActivity);
  const discover = discoverRooms.map((r: any) => toListing(r, null)).sort(sortByActivity);

  return (
    <div className="pt-8">
      <header className="flex items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em]">
            Rooms
          </h1>
          <p className="mt-1.5 text-[0.95rem] text-muted">
            Places to be a person, not a position.
          </p>
        </div>
        <Link
          href="/rooms/new"
          className="inline-flex flex-none items-center gap-2 rounded-full bg-flame px-4 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-flame-deep"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          New room
        </Link>
      </header>

      <PendingInvitesBanner invites={(invites as any) ?? []} />

      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-3.5">
          <h2 className="font-display text-[1.15rem] font-bold tracking-[-0.02em]">
            Your rooms
          </h2>
          {mine.length > 0 && (
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted">
              {mine.length} {mine.length === 1 ? "room" : "rooms"}
            </span>
          )}
        </div>

        {mine.length > 0 ? (
          <div className="flex flex-col gap-2">
            {mine.map((r) => (
              <RoomCard key={r.id} room={r} />
            ))}
          </div>
        ) : (
          <div className="rounded-soft border border-dashed border-line bg-card px-6 py-10 text-center">
            <p className="text-[0.92rem] text-muted">
              No rooms yet. Create one, or wait for an invite.
            </p>
            <Link
              href="/rooms/new"
              className="mt-4 inline-block rounded-full bg-flame px-4 py-2 text-[0.82rem] font-semibold text-white transition hover:bg-flame-deep"
            >
              Create a room
            </Link>
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-3.5">
          <h2 className="font-display text-[1.15rem] font-bold tracking-[-0.02em]">
            Discover
          </h2>
          {discover.length > 0 && (
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted">
              public rooms · {discover.length}
            </span>
          )}
        </div>

        <DiscoverSection rooms={discover} hasJoinedAllPublicRooms={hasJoinedAllPublicRooms} />
      </section>

      <p className="mt-16 border-t border-line pt-6 text-center font-mono text-[0.7rem] tracking-[0.06em] text-muted">
        no algorithm · no trending · no &ldquo;suggested for you&rdquo;
      </p>
    </div>
  );
}
