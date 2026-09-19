"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAccent } from "@/lib/room-theme";
import { InlineJoinButton } from "@/components/inline-join-button";

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

export function RoomCard({ room, showJoin = false }: { room: RoomListing; showJoin?: boolean }) {
  const accent = getAccent(room.accent);
  const isMember = !!room.my_role;
  // Discovery cards (showJoin) aren't "yours" yet, so they get a
  // lighter touch than a member card's full wash — but still enough
  // color to read as alive on first paint, not just on hover. A
  // first-time visitor on mobile never hovers at all, so gating all
  // color behind :hover (the previous behavior) meant this page's
  // entire primary surface rendered gray-on-gray for exactly the
  // audience it's trying to pull in.
  const showAccentAtRest = isMember || showJoin;

  return (
    <Link
      href={`/rooms/${room.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-soft border bg-card",
        "py-3.5 pl-5 pr-4 transition-all duration-200",
        "hover:-translate-y-[3px] hover:shadow-[0_10px_24px_-12px_var(--card-accent-shadow)]",
        showAccentAtRest ? "border-[var(--card-accent-border)]" : "border-line hover:border-[var(--card-accent-border)]"
      )}
      style={{
        background: isMember
          ? `linear-gradient(180deg, ${accent.bg} 0%, transparent 55%)`
          : showJoin
            ? `linear-gradient(180deg, ${accent.bg} 0%, transparent 75%)`
            : undefined,
        ["--card-accent-shadow" as string]: accent.border,
        ["--card-accent-border" as string]: accent.border,
      }}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 rounded-r-full transition-all duration-200",
          showAccentAtRest ? "w-[5px] opacity-100" : "w-[5px] opacity-0 group-hover:opacity-100"
        )}
        style={{ background: accent.fg }}
      />

      <div className="mb-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-mono text-[1rem] font-medium" style={{ color: accent.fg }}>
          #
        </span>
        <h3 className="min-w-0 flex-1 font-display text-[1.1rem] font-bold tracking-[-0.015em] text-ink">
          {room.slug}
        </h3>
        {room.my_role && <RolePill role={room.my_role} accent={accent} />}
        {showJoin && (
          <InlineJoinButton roomId={room.id} slug={room.slug} accent={room.accent} />
        )}
      </div>

      {room.name && (
        <p className="mb-2.5 truncate text-[0.88rem] text-ink-2">{room.name}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.7rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: accent.fg }} />
          {room.member_count === 0 ? (
            <span className="font-medium" style={{ color: accent.fg }}>
              be the first here
            </span>
          ) : (
            <>{room.member_count} {room.member_count === 1 ? "member" : "members"}</>
          )}
        </span>

        {room.posts_today > 0 && (
          <span className="font-medium" style={{ color: accent.fg }}>
            {room.posts_today} {room.posts_today === 1 ? "post" : "posts"} today
          </span>
        )}

        {room.member_count > 0 && (
          <>
            {room.posts_today === 0 && <span>quiet today</span>}
            <span>{formatActivity(room.last_post_at)}</span>
          </>
        )}
        <span className="capitalize">{room.visibility}</span>
      </div>
    </Link>
  );
}

function RolePill({ role, accent }: { role: "owner" | "mod" | "member"; accent: ReturnType<typeof getAccent> }) {
  const label = role === "owner" ? "★ owner" : role === "mod" ? "mod" : "member";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.08em]",
        role === "member" && "bg-paper-2 text-muted"
      )}
      style={
        role !== "member"
          ? { background: accent.bg, color: accent.fg, boxShadow: `inset 0 0 0 1px ${accent.border}` }
          : undefined
      }
    >
      {label}
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
