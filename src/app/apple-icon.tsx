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
        <div
          style={{
            width: "88%",
            height: "88%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#e8571f",
            borderRadius: "26%",
          }}
        >
          <span
            style={{
              fontSize: 94,
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
    size
  );
}
