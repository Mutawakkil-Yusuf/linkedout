"use client";
import { useId } from "react";

type Phase = "drawing" | "breathing" | "static";

export function MarkLoader({
  size = 96,
  phase = "breathing",
  caption,
}: {
  size?: number;
  phase?: Phase;
  caption?: string;
}) {
  const raw = useId();
  const gid = `lo-g-${raw.replace(/:/g, "")}`;

  const wrapClass =
    phase === "drawing" ? "animate-lo-pop" :
    phase === "breathing" ? "animate-lo-breathe" :
    "";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative ${wrapClass}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff7a3d" />
              <stop offset="100%" stopColor="#c94410" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="30" fill={`url(#${gid})`} />
        </svg>

        <span
          className={phase === "drawing" ? "animate-lo-slot-draw" : ""}
          style={{
            position: "absolute",
            top: "42%",
            height: "16%",
            right: "-11%",
            width: phase === "drawing" ? "0%" : "40%",
            maxWidth: 60,
            background: "#fdf8f3",
            borderRadius: "999px",
          }}
        />
      </div>

      {caption && (
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
          {caption}
        </span>
      )}
    </div>
  );
}
