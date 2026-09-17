"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RoomCard, type RoomListing } from "@/components/room-card";

type Props = {
  rooms: RoomListing[];
  /** True when public rooms exist platform-wide, just none the viewer hasn't already joined. */
  hasJoinedAllPublicRooms?: boolean;
};

export function DiscoverSection({ rooms, hasJoinedAllPublicRooms = false }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.slug.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
  }, [query, rooms]);

  return (
    <>
      {rooms.length > 0 && (
        <div className="relative mb-4">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search public rooms…"
            className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-[0.9rem] text-ink outline-none transition placeholder:text-muted focus:border-flame"
          />
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="rounded-soft border border-dashed border-line bg-card px-6 py-10 text-center">
          <p className="text-[0.92rem] text-muted">
            {hasJoinedAllPublicRooms
              ? "You're already in every public room there is. Nothing new to discover right now. Check back later, or open one yourself."
              : "No public rooms yet. Rooms here are often private, so you'll see them when someone invites you."}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-soft border border-dashed border-line bg-card px-6 py-10 text-center">
          <p className="text-[0.92rem] text-muted">No rooms match &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => (
            <RoomCard key={r.id} room={r} showJoin />
          ))}
        </div>
      )}
    </>
  );
}
