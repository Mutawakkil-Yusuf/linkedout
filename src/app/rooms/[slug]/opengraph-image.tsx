// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getAccent } from "@/lib/room-theme";

export const runtime = "nodejs";
export const alt = "A room on LinkedOut";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// rooms_public_read (0001_init.sql) allows this select for anyone —
// signed in or not — when visibility = 'public', and blocks it
// otherwise. That's the entire access check this needs: no separate
// "is this room public" branch, because RLS already returns null for
// anything this route (running with the anon-capable server client,
// no service role) isn't allowed to see. A private/unlisted room's
// share link falls through to the generic branded card below, the
// same way a bad post-card request would — nothing here can leak a
// gated room's name or description to a link-preview bot.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, slug, name, description, accent, visibility")
    .eq("slug", slug)
    .maybeSingle();

  if (!room) return genericCard();

  const accent = getAccent(room.accent);

  const { count: memberCount } = await supabase
    .from("room_members")
    .select("user_id", { count: "exact", head: true })
    .eq("room_id", room.id);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: `linear-gradient(160deg, ${accent.bg} 0%, #fdf8f3 55%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
          <div
            style={{
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e8571f",
              borderRadius: 6,
              color: "#fdf8f3",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            out
          </div>
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#1c1613" }}>
            Linked<span style={{ color: "#e8571f" }}>Out</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 52, fontWeight: 700, color: accent.fg, display: "flex" }}>#</span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#1c1613",
              display: "flex",
            }}
          >
            {room.slug}
          </span>
        </div>

        {room.name && (
          <p
            style={{
              margin: 0,
              marginBottom: 28,
              maxWidth: 900,
              fontSize: 30,
              lineHeight: 1.4,
              fontWeight: 500,
              color: "#5a4f47",
              display: "flex",
            }}
          >
            {room.name}
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 22,
            fontFamily: "monospace",
            color: accent.fg,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: accent.fg,
              display: "flex",
            }}
          />
          {memberCount ?? 0} {memberCount === 1 ? "person" : "people"} here
        </div>
      </div>
    ),
    { ...size }
  );
}

function genericCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdf8f3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e8571f",
              borderRadius: 16,
              color: "#fdf8f3",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            out
          </div>
          <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.03em", color: "#1c1613" }}>
            Linked<span style={{ color: "#e8571f" }}>Out</span>
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
