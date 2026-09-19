// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getAccent } from "@/lib/room-theme";

export const runtime = "nodejs";
export const alt = "You're invited to a room on LinkedOut";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// room_share_links_read (0018_room_share_links.sql) allows this select
// for anyone, signed in or not, as long as the link is unrevoked and
// its room is public — the exact same policy the /join/[token] page
// itself reads through. A revoked or bad token resolves to nothing
// here, same as it does there, and falls through to the generic card.
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("room_share_links")
    .select("room_id, rooms:room_id (slug, name, accent)")
    .eq("token", token)
    .maybeSingle<{
      room_id: string;
      rooms: { slug: string; name: string; accent: string | null } | null;
    }>();

  if (!link || !link.rooms) return genericCard();
  const room = link.rooms;
  const accent = getAccent(room.accent);

  const { count: memberCount } = await supabase
    .from("room_members")
    .select("user_id", { count: "exact", head: true })
    .eq("room_id", link.room_id);

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 36,
            fontFamily: "monospace",
            fontSize: 18,
            color: "#8a7a6d",
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          you're invited to
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

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
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
            <span style={{ width: 10, height: 10, borderRadius: 999, background: accent.fg, display: "flex" }} />
            {memberCount ?? 0} {memberCount === 1 ? "person" : "people"} here
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 19,
              fontWeight: 700,
              color: "#1c1613",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#e8571f",
                borderRadius: 5,
                color: "#fdf8f3",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              out
            </div>
            LinkedOut
          </div>
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
