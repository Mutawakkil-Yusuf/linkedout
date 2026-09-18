// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { renderAvatarSvg } from "@/lib/avatar-render";
import { avatarGradient, initials, type AvatarStyle } from "@/lib/avatar";

export const runtime = "nodejs";

// Only ever generates the logged-in user's own card. Profiles have no
// public read policy (see profiles_self_read / profiles_shared_read in
// 0001_init.sql), on purpose: not searchable, not linkable by handle.
// A public /u/[handle]/card route would need a new RLS carve-out just
// for this feature, which cuts against that guarantee. This route
// reads the session's own user id and nothing else, so it needs no
// new policy at all.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_style, avatar_seed, created_at, early_badge")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return new Response("No profile yet", { status: 404 });

  const { count: roomCount } = await supabase
    .from("room_members")
    .select("room_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const avatarDataUri = buildAvatarDataUri(
    profile.avatar_style as AvatarStyle | null,
    profile.avatar_seed,
    profile.handle
  );

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
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <img src={avatarDataUri} width={120} height={120} style={{ borderRadius: 26 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em", color: "#1c1613" }}>
                @{profile.handle}
              </span>
              {profile.early_badge && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(232, 87, 31, 0.1)",
                    color: "#c94410",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontFamily: "monospace",
                  }}
                >
                  out #early
                </span>
              )}
            </div>
            {profile.display_name && (
              <span style={{ fontSize: 20, color: "#4a3f38", marginTop: 4 }}>{profile.display_name}</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, fontFamily: "monospace", fontSize: 15, color: "#8a7a6d" }}>
          <span>member since {memberSince}</span>
          <span style={{ color: "#e8571f", fontWeight: 700 }}>
            in {roomCount ?? 0} {roomCount === 1 ? "room" : "rooms"}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function buildAvatarDataUri(style: AvatarStyle | null, seed: string | null, handle: string): string {
  if (style && seed) {
    const svg = renderAvatarSvg(style, seed, 240);
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  // Fallback: same gradient-initials scheme used everywhere else a
  // profile has no DiceBear selection (see components using avatarGradient).
  const gradient = avatarGradient(seed ?? handle);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      ${gradient.match(/#[0-9a-f]{6}/gi)?.map((c, i) => `<stop offset="${i}" stop-color="${c}"/>`).join("") ?? ""}
    </linearGradient></defs>
    <rect width="240" height="240" rx="52" fill="url(#g)"/>
    <text x="120" y="145" text-anchor="middle" font-family="sans-serif" font-size="88" font-weight="700" fill="#fdf8f3">${initials(handle)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
