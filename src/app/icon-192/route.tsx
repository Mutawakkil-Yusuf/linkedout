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
        <div
          style={{
            width: "92%",
            height: "92%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#e8571f",
            borderRadius: "22%",
          }}
        >
          <span
            style={{
              fontSize: 100,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              color: "#fdf8f3",
              lineHeight: 1,
            }}
          >
            out
          </span>
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
