// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://linkedoutz.vercel.app";

// Mirrors middleware.ts's own `isPublic` allowlist deliberately, not
// coincidentally: anything not on that list already redirects an
// unauthenticated visitor (which is all a crawler ever is) to /login,
// so telling a crawler those paths are "allowed" would just have it
// index a redirect chain. /join/ is intentionally allowed — that's
// the whole point of the share-link feature — but /rooms/[slug] and
// /u/[handle] are left off here even though rooms_public_read makes
// some of that data genuinely public, because the crawler can't reach
// the page itself without hitting the login redirect first. If that
// changes (e.g. rooms/[slug] is ever added to middleware's isPublic),
// this list should be revisited alongside it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/rooms/wall", "/join/"],
        disallow: [
          "/rooms/",
          "/u/",
          "/dms",
          "/p/",
          "/me",
          "/settings",
          "/onboard",
          "/login",
          "/logout",
          "/auth/",
          "/api/",
          "/motion",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
