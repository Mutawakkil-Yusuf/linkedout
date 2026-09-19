// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "LinkedOut — the network where you can't be found by employers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Static and generic on purpose — this only renders for routes that
// don't define their own opengraph-image.tsx (Next.js walks up the
// route tree and uses the nearest one it finds), so it never needs
// per-request data and stays cheap to render at build/request time.
export default function Image() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
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
        <p
          style={{
            margin: 0,
            maxWidth: 780,
            textAlign: "center",
            fontSize: 30,
            lineHeight: 1.4,
            fontWeight: 500,
            color: "#5a4f47",
            display: "flex",
          }}
        >
          Rooms to be a person, not a position.
        </p>
      </div>
    ),
    { ...size }
  );
}
