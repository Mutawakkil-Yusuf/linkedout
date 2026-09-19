// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Matches client.ts and server.ts exactly — see the comment in
// client.ts for why this is 100 days and why it's a literal in each
// file rather than a shared import.
const oneHundredDaysInSeconds = 60 * 60 * 24 * 100;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: oneHundredDaysInSeconds,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/" ||
    path === "/rooms/wall" ||
    path.startsWith("/join/") ||
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/motion") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon");

  if (!user && !isPublic) return NextResponse.redirect(new URL("/login", request.url));

  if (user && !path.startsWith("/onboard") && !path.startsWith("/auth")) {
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (!profile) {
      const onboardUrl = new URL("/onboard", request.url);
      onboardUrl.searchParams.set("next", path);
      return NextResponse.redirect(onboardUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // opengraph-image / twitter-image are excluded here for the same
    // reason favicon/manifest/icons are: they're Next's own generated
    // routes, always fetched by an unauthenticated link-preview bot
    // (Twitter, Discord, iMessage), never by a signed-in person
    // browsing the app. Without this exclusion, e.g. a request to
    // /rooms/[slug]/opengraph-image would hit the same
    // "no user + not on the public allowlist → redirect to /login"
    // rule as the page itself, and the image would silently never
    // render for the exact audience it exists for.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon.svg|icon-192|icon-512|apple-icon|opengraph-image|twitter-image).*)",
  ],
};
