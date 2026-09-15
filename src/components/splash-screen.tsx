"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useEffect, useRef, useState } from "react";
import { MarkLoader } from "./mark-loader";
import { LetterWord } from "./letter-word";

const MIN_VISIBLE = 1600;
const MAX_VISIBLE = 2400;
const FADE_MS = 500;

type Phase = "drawing" | "breathing" | "leaving" | "off";

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("drawing");
  const leaving = useRef(false);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("lo_splash_seen") === "1"; } catch {}
    if (seen) { setPhase("off"); return; }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      try { sessionStorage.setItem("lo_splash_seen", "1"); } catch {}
      setPhase("off");
      return;
    }

    const startedAt = Date.now();
    let leaveTimer: number | undefined;

    const beginLeave = () => {
      if (leaving.current) return;
      leaving.current = true;
      const wait = Math.max(0, MIN_VISIBLE - (Date.now() - startedAt));
      leaveTimer = window.setTimeout(() => {
        setPhase("leaving");
        window.setTimeout(() => {
          setPhase("off");
          try { sessionStorage.setItem("lo_splash_seen", "1"); } catch {}
        }, FADE_MS);
      }, wait);
    };

    const breatheTimer = window.setTimeout(() => {
      if (!leaving.current) setPhase("breathing");
    }, MIN_VISIBLE);

    const hardCap = window.setTimeout(beginLeave, MAX_VISIBLE);

    if (document.readyState === "complete") beginLeave();
    else window.addEventListener("load", beginLeave, { once: true });

    return () => {
      clearTimeout(breatheTimer);
      clearTimeout(hardCap);
      if (leaveTimer) clearTimeout(leaveTimer);
      window.removeEventListener("load", beginLeave);
    };
  }, []);

  if (phase === "off") return null;

  return (
    <div
      id="lo-splash"
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-paper transition-opacity duration-500 ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex flex-col items-center gap-7">
        <MarkLoader
          size={96}
          phase={phase === "drawing" ? "drawing" : "breathing"}
        />
        <LetterWord
          text="LinkedOut"
          flameFrom={6}
          startDelay={700}
          idle
          className="text-[1.85rem]"
        />
      </div>
    </div>
  );
}
