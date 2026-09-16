"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

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
          <rect width="100" height="100" rx="22" fill="#e8571f" />
          <text
            className={phase === "drawing" ? "animate-lo-mark-text" : ""}
            x="50"
            y="63"
            textAnchor="middle"
            fontFamily="var(--font-display), ui-sans-serif, system-ui, sans-serif"
            fontWeight="700"
            fontSize="52"
            letterSpacing="-0.05em"
            fill="#fdf8f3"
          >
            out
          </text>
        </svg>
      </div>

      {caption && (
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
          {caption}
        </span>
      )}
    </div>
  );
}
