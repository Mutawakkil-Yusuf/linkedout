// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ImageResponse } from "next/og";
import { renderAvatarSvg } from "@/lib/avatar-render";
import { avatarGradient, initials, type AvatarStyle } from "@/lib/avatar";

export const runtime = "nodejs";

// Renders a post as a shareable image entirely from query params — it does
// NOT look a post up by id. posts_read (0004_moderation.sql) requires the
// viewer to already be a room member or share context with the author;
// there is no public/anon select on individual posts (unlike the public
// room wall in 0015, which only ever exposes aggregate counts). A route
// that re-fetched a post server-side by id would need a new RLS carve-out
// that punches a hole in that guarantee for anyone with the link.
//
// Instead: the client already has the post open (it passed posts_read to
// render it on screen in the first place), and hands this route exactly
// the fields already visible in that view. The resulting PNG is a static
// snapshot the author downloads/shares — not a live, re-fetchable page.
// Nothing here is looked up; everything here is already in the requester's
// legitimate view.

const MAX_BODY = 600;
const CARD_W = 1200;
const CARD_H = 630;

function clip(s: string, max: number) {
  const t = s.slice(0, max);
  return s.length > max ? t.replace(/\s+\S*$/, "") + "…" : t;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams;

  const handle = (p.get("handle") ?? "").trim();
  const body = clip((p.get("body") ?? "").trim(), MAX_BODY);
  if (!handle || !body) {
    return new Response("Missing handle or body", { status: 400 });
  }

  const displayName = p.get("name")?.trim() || null;
  const avatarStyle = (p.get("style") as AvatarStyle | null) ?? null;
  const avatarSeed = p.get("seed")?.trim() || null;
  const roomName = p.get("room")?.trim() || null;
  const roomAccent = p.get("accent")?.trim() || "#e8571f";
  const dateLabel = p.get("date")?.trim() || null;

  const avatarDataUri = buildAvatarDataUri(avatarStyle, avatarSeed, handle);
  const big = body.length < 180;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: "#fdf8f3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e8571f",
              borderRadius: 7,
              color: "#fdf8f3",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            out
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#1c1613" }}>
            Linked<span style={{ color: "#e8571f" }}>Out</span>
          </span>
          {roomName && (
            <span
              style={{
                display: "flex",
                marginLeft: 8,
                fontFamily: "monospace",
                fontSize: 14,
                color: roomAccent,
                background: `${roomAccent}18`,
                padding: "5px 12px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              #{roomName}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <p
            style={{
              margin: 0,
              fontSize: big ? 44 : 32,
              lineHeight: 1.35,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "#1c1613",
              display: "flex",
            }}
          >
            {body}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src={avatarDataUri} width={56} height={56} style={{ borderRadius: 14 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#1c1613" }}>
                {displayName ?? `@${handle}`}
              </span>
              <span style={{ fontSize: 14, fontFamily: "monospace", color: "#8a7a6d" }}>
                @{handle}
                {dateLabel ? ` · ${dateLabel}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: CARD_W, height: CARD_H }
  );
}

function buildAvatarDataUri(style: AvatarStyle | null, seed: string | null, handle: string): string {
  if (style && seed) {
    const svg = renderAvatarSvg(style, seed, 112);
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  const gradient = avatarGradient(seed ?? handle);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      ${gradient.match(/#[0-9a-f]{6}/gi)?.map((c, i) => `<stop offset="${i}" stop-color="${c}"/>`).join("") ?? ""}
    </linearGradient></defs>
    <rect width="112" height="112" rx="24" fill="url(#g)"/>
    <text x="56" y="68" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="700" fill="#fdf8f3">${initials(handle)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
