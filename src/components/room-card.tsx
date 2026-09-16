// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAccent } from "@/lib/room-theme";

export type RoomListing = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accent: string;
  visibility: string;
  created_at: string;
  my_role: "owner" | "mod" | "member" | null;
  member_count: number;
  posts_today: number;
  last_post_at: string | null;
};

export function RoomCard({ room }: { room: RoomListing }) {
  const accent = getAccent(room.accent);
  const isMember = !!room.my_role;

  return (
    <Link
      href={`/rooms/${room.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-soft border border-line bg-card",
        "py-3.5 pl-5 pr-4 transition",
        "hover:-translate-y-px hover:border-line-2"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-[3px] transition-opacity",
          isMember ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        style={{ background: accent.fg }}
      />

      <div className="mb-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-mono text-[1rem] font-medium" style={{ color: accent.fg }}>
          #
        </span>
        <h3 className="font-display text-[1.1rem] font-bold tracking-[-0.015em] text-ink">
          {room.slug}
        </h3>
        {room.my_role && <RolePill role={room.my_role} />}
      </div>

      {room.name && (
        <p className="mb-2.5 truncate text-[0.88rem] text-ink-2">{room.name}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.7rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: accent.fg }} />
          {room.member_count} {room.member_count === 1 ? "member" : "members"}
        </span>

        {room.posts_today > 0 ? (
          <span className="font-medium" style={{ color: accent.fg }}>
            {room.posts_today} {room.posts_today === 1 ? "post" : "posts"} today
          </span>
        ) : (
          <span>quiet today</span>
        )}

        <span>{formatActivity(room.last_post_at)}</span>
      </div>
    </Link>
  );
}

function RolePill({ role }: { role: "owner" | "mod" | "member" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.1em]",
        role === "owner" && "bg-ink text-paper",
        role === "mod" && "bg-flame/10 text-flame",
        role === "member" && "bg-paper-2 text-muted"
      )}
    >
      {role}
    </span>
  );
}

function formatActivity(iso: string | null): string {
  if (!iso) return "no posts yet";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "last post just now";
  if (m < 60) return `last post ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `last post ${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "last post yesterday";
  if (d < 30) return `last post ${d}d ago`;
  return `last post ${new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}
