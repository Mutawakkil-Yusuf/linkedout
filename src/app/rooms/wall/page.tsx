// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RoomCard, type RoomListing } from "@/components/room-card";
import { Lockup } from "@/components/logo";
import { getAccent } from "@/lib/room-theme";

// The one genuinely public, crawlable, indexable page besides the
// homepage — it's in both robots.ts's allow list and sitemap.ts, so
// this is the one page in the app where `index: true` is the honest
// answer rather than the safe default of leaving it off.
export const metadata: Metadata = {
  title: "Rooms",
  description: "Every public room on LinkedOut, live. No login needed to look.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Rooms · LinkedOut",
    description: "Every public room on LinkedOut, live. No login needed to look.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rooms · LinkedOut",
    description: "Every public room on LinkedOut, live. No login needed to look.",
  },
};

// Public, no auth required (see the middleware allowlist). Reads only
// through public_room_wall() (0015 migration), which is scoped to
// visibility = 'public' rooms and aggregate counts only, granted to
// the anon role on purpose: nothing here should ever require a
// session to view, since the whole point is a link anyone can open.
export default async function RoomWallPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_room_wall");
  const rooms: RoomListing[] = ((data as any[]) ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    accent: r.accent ?? "flame",
    visibility: "public",
    created_at: r.created_at,
    my_role: null,
    member_count: Number(r.member_count ?? 0),
    posts_today: Number(r.posts_today ?? 0),
    last_post_at: r.last_post_at ?? null,
  }));

  // Deterministic "room of the week": same room for everyone, all
  // week, no one has to remember to update it. Picks by ISO week
  // number modulo the room count, so it rotates on its own and stays
  // stable across every request during the same week.
  const spotlight = pickWeeklySpotlight(rooms);
  const rest = spotlight ? rooms.filter((r) => r.id !== spotlight.id) : rooms;

  // Real post text for the spotlight room only — public_room_recent_posts
  // (0019), body-only/no-identity, same anon-safe shape as the rest of
  // this page. Just the one room, not all of them: a stranger scanning
  // this page needs one concrete reason to click, not a wall of quotes.
  const { data: spotlightPosts } = spotlight
    ? await supabase.rpc("public_room_recent_posts", { p_room: spotlight.id, p_limit: 2 })
    : { data: null };
  const spotlightPostList = (spotlightPosts as { body: string; created_at: string }[] | null) ?? [];

  return (
    <div className="mx-auto max-w-[46rem] px-5 py-14">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <Link href="/"><Lockup size={30} /></Link>
        <Link href="/login" className="font-mono text-[0.78rem] text-muted underline decoration-line underline-offset-4 hover:text-ink">
          sign in →
        </Link>
      </header>

      <h1 className="mb-3 font-display text-[2rem] font-bold leading-tight tracking-[-0.03em]">Every public room, live.</h1>
      <p className="mb-10 max-w-[32rem] text-[1.02rem] leading-relaxed text-ink-2">
        No login needed to look. These are real rooms with real posts today, not a demo.
      </p>

      {spotlight && (
        <section className="mb-10">
          <p className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.15em] text-flame-deep">Room of the week</p>
          <SpotlightCard room={spotlight} posts={spotlightPostList} />
        </section>
      )}

      {rest.length > 0 ? (
        <section>
          {spotlight && <p className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.15em] text-muted">Everything else</p>}
          <div className="flex flex-col gap-2.5">
            {rest.map((room) => <RoomCard key={room.id} room={room} />)}
          </div>
        </section>
      ) : !spotlight ? (
        <p className="rounded-soft border border-dashed border-line bg-card px-6 py-10 text-center text-[0.92rem] text-muted">
          No public rooms yet. Check back soon.
        </p>
      ) : null}

      <p className="mt-14 border-t border-line pt-6 text-center font-mono text-[0.75rem] text-muted">
        Want in? <Link href="/login" className="text-ink underline decoration-line underline-offset-4 hover:text-flame-deep">Get a handle</Link>, no résumé required.
      </p>
    </div>
  );
}

function pickWeeklySpotlight(rooms: RoomListing[]): RoomListing | null {
  if (rooms.length === 0) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return rooms[week % rooms.length];
}

function SpotlightCard({ room, posts }: { room: RoomListing; posts: { body: string; created_at: string }[] }) {
  const accent = getAccent(room.accent);
  return (
    <Link
      href={`/rooms/${room.slug}`}
      className="group block overflow-hidden rounded-card border p-6 transition hover:-translate-y-px"
      style={{ borderColor: accent.border, background: accent.bg }}
    >
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[1.3rem] font-medium" style={{ color: accent.fg }}>#</span>
        <h2 className="font-display text-[1.5rem] font-bold tracking-[-0.02em] text-ink">{room.slug}</h2>
      </div>
      {room.name && <p className="mb-4 text-[1rem] text-ink-2">{room.name}</p>}

      {posts.length > 0 && (
        <div className="mb-4 space-y-2">
          {posts.map((p, i) => (
            <p
              key={i}
              className="rounded-[10px] bg-card/70 px-3 py-2 text-[0.88rem] leading-relaxed text-ink-2"
            >
              {p.body.length > 140 ? `${p.body.slice(0, 140).trimEnd()}…` : p.body}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.75rem] text-muted">
        <span>{room.member_count} {room.member_count === 1 ? "member" : "members"}</span>
        <span>{room.posts_today > 0 ? `${room.posts_today} ${room.posts_today === 1 ? "post" : "posts"} today` : "quiet today"}</span>
      </div>
    </Link>
  );
}
