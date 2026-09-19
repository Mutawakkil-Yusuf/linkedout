// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { Topbar } from "@/components/topbar";
import { AppShell } from "@/components/app-shell";
import { MobileNav } from "@/components/mobile/nav";
import { SplashScreen } from "@/components/splash-screen";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { ToastProvider } from "@/components/toast-provider";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://linkedoutz.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LinkedOut — the network where you can't be found by employers",
    template: "%s · LinkedOut",
  },
  description:
    "Rooms to be a person, not a position. No résumé, no job title, no professional performance — just people.",
  applicationName: "LinkedOut",
  manifest: "/manifest.webmanifest",
  // No `icons` field here on purpose: app/icon.svg and app/apple-icon.tsx
  // are file-convention routes, so Next.js already injects the correct
  // <link rel="icon"> / <link rel="apple-touch-icon"> tags for them.
  // Repeating those URLs here just renders duplicate <link> tags.
  appleWebApp: {
    capable: true,
    title: "LinkedOut",
    statusBarStyle: "default",
  },
  // Left unset here on purpose (not "index, follow"): the safe global
  // default is to let Next.js apply no blanket rule, and instead have
  // each page state its own indexability explicitly (see robots.ts for
  // the crawl-level allow/disallow list, and individual page metadata
  // for `robots: { index: false }` on anything gated). A page that
  // forgets to opt in stays un-indexed by default, which is the safer
  // failure mode for an app whose whole premise is not being findable.
  openGraph: {
    title: "LinkedOut",
    description: "The network where you cannot be found by employers.",
    siteName: "LinkedOut",
    type: "website",
    url: siteUrl,
    // No `images` field here: this file has no opengraph-image.tsx
    // sibling, so Next.js falls through to the nearest one it finds
    // walking up the route tree — which, for any route that doesn't
    // define its own, is this layout's own opengraph-image.tsx.
    // Listing a URL here too would just produce a second, redundant
    // <meta property="og:image"> tag alongside the one Next already
    // generates from that file.
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedOut",
    description: "The network where you cannot be found by employers.",
  },
};

export const viewport: Viewport = { themeColor: "#fdf8f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {/*
          Runs before hydration. On a repeat visit this session, it adds
          .lo-skip-splash to <html>. The matching rule in globals.css hides
          #lo-splash immediately, so there's no one-frame flash of the splash
          before SplashScreen's own effect has a chance to run.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(sessionStorage.getItem('lo_splash_seen')==='1'){document.documentElement.classList.add('lo-skip-splash')}}catch(e){}})();",
          }}
        />
        <RegisterServiceWorker />
        <SplashScreen />
        <ToastProvider>
          <Topbar />
          <AppShell>{children}</AppShell>
          <MobileNav />
        </ToastProvider>
      </body>
    </html>
  );
}
