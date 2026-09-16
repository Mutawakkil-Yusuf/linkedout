// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdf8f3",
        }}
      >
        <svg width="192" height="192" viewBox="0 0 100 100">
          <rect x="4" y="4" width="92" height="92" rx="22" fill="#e8571f" />
          <text
            x="50"
            y="63"
            textAnchor="middle"
            fontWeight="700"
            fontSize="52"
            letterSpacing="-0.05em"
            fill="#fdf8f3"
          >
            out
          </text>
        </svg>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
