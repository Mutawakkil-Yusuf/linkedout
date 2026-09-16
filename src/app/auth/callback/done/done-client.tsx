"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/logo";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag for "launched from home screen"
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getPlatform(): "android" | "ios" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "other";
}

export function CallbackDoneClient({ dest }: { dest: string }) {
  const router = useRouter();
  const [standalone, setStandalone] = useState<boolean | null>(null);
  const [platform, setPlatform] = useState<"android" | "ios" | "other">("other");

  useEffect(() => {
    setStandalone(isStandalone());
    setPlatform(getPlatform());
  }, []);

  useEffect(() => {
    // This tab IS the installed app (or a plain desktop/mobile browser
    // visit with no separate app to hand off to) — just continue.
    if (standalone === true) router.replace(dest);
  }, [standalone, dest, router]);

  useEffect(() => {
    // Android only: try to hand this URL to any installed app registered
    // for this host via an intent:// URL. If LinkedOut is installed as a
    // TWA/standalone PWA that Chrome recognizes for this origin, this can
    // switch straight to it. If nothing catches it, the browser just stays
    // put — free to try, no downside — and the manual instructions below
    // remain the fallback. No iOS equivalent exists (Apple doesn't expose
    // this to installed home-screen PWAs).
    if (standalone !== false || platform !== "android") return;
    const url = new URL(dest, window.location.origin);
    const intentUrl =
      `intent://${url.host}${url.pathname}${url.search}` +
      `#Intent;scheme=${url.protocol.replace(":", "")};package=com.android.chrome;end`;
    try {
      window.location.href = intentUrl;
    } catch {
      // ignore — manual fallback UI covers this
    }
  }, [standalone, platform, dest]);

  // Still checking display-mode on first paint: render nothing rather
  // than flash the wrong state.
  if (standalone === null || standalone === true) return null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[28rem] flex-col items-center justify-center px-5 py-14 text-center">
      <Wordmark size="lg" />
      <p className="mt-6 font-display text-[1.4rem] font-bold tracking-[-0.02em]">You're signed in</p>
      <p className="mt-2 max-w-[22rem] text-[0.95rem] leading-relaxed text-muted">
        {platform === "ios"
          ? "Find LinkedOut on your home screen and tap it to continue — this browser tab was only needed to confirm the link."
          : "Switch back to the LinkedOut app on your home screen to continue — this browser tab was only needed to confirm the link."}
      </p>
      <a
        href={dest}
        className="mt-8 w-full rounded-full bg-flame px-6 py-3 font-mono text-[0.85rem] font-medium text-paper transition-colors hover:bg-flame-deep"
      >
        Continue in this browser instead
      </a>
      <p className="mt-3 font-mono text-[0.7rem] text-muted">no home screen icon yet? this works fine too.</p>
    </div>
  );
}
