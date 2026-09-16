// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <svg width="180" height="180" viewBox="0 0 100 100">
          <rect x="6" y="6" width="88" height="88" rx="26" fill="#e8571f" />
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
    size
  );
}
