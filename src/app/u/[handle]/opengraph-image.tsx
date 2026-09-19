// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "A profile on LinkedOut";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Deliberately generic. profiles_self_read / profiles_shared_read
// (0001_init.sql) mean a profile row is only readable by its own
// owner or someone who already shares a room/DM with them — there is
// no public select on profiles. An OG image renders for whoever's
// fetching the link preview (Twitter/Discord/iMessage's bot, an
// anonymous visitor), never as the signed-in profile owner, so a
// version of this that queried the profiles table would just get
// nothing back from RLS for almost every real request anyway. Rather
// than have the card silently look broken/empty for the common case,
// this only ever renders the one piece of data that's already public
// by virtue of being in the URL: the handle itself.
export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

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
        <div
          style={{
            width: 120,
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 30,
            background: "linear-gradient(135deg, #e8571f, #ff8a4c)",
            color: "#fdf8f3",
            fontSize: 52,
            fontWeight: 800,
            marginBottom: 32,
          }}
        >
          {initials(handle)}
        </div>
        <span
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#1c1613",
            fontFamily: "monospace",
            marginBottom: 12,
          }}
        >
          @{handle}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
          <div
            style={{
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e8571f",
              borderRadius: 5,
              color: "#fdf8f3",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            out
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#5a4f47" }}>on LinkedOut</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

function initials(handle: string): string {
  return (handle.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2) || "?").toUpperCase();
}
