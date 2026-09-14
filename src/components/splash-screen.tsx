"use client";
import { useEffect, useRef, useState } from "react";
import { MarkLoader } from "./mark-loader";

const MIN_VISIBLE = 1200;
const MAX_VISIBLE = 2000;
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
    >
      <MarkLoader size={96} phase={phase === "drawing" ? "drawing" : "breathing"} />
      <span className="absolute bottom-8 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
        loading
      </span>
    </div>
  );
}
