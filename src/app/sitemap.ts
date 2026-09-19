// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://linkedoutz.vercel.app";

// Deliberately just two URLs. Individual room pages (/rooms/[slug])
// and profiles (/u/[handle]) are left out for the same reason robots.ts
// disallows them: middleware.ts redirects an unauthenticated visitor
// away from both before the page ever renders, so listing them in a
// sitemap would have Google crawl a URL, get a 30x to /login, and
// treat that as a sitemap-quality problem rather than a page to index.
// If those routes are ever made genuinely crawlable (added to
// middleware's isPublic list), they belong here too — until then, a
// short, fully-accurate sitemap is worth more than a long, mostly-wrong
// one.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/rooms/wall`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
