// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { cn } from "@/lib/utils";

type MarkProps = { size?: number; className?: string; variant?: "gradient" | "flat" | "paper" };

/**
 * The mark: "out" set in a rounded square. Same move as LinkedIn's "in" —
 * a lowercase word in an app-icon shape, in our flame, at our weight.
 * Centering is math, not vibes: font-size 52, baseline at y=63 (the
 * x-height band's visual center for Bricolage Grotesque), letter-spacing
 * -0.05em. One SVG that scales from 14px to 512px.
 */
export function LogoMark({ size = 40, variant = "gradient", className }: MarkProps) {
  const bg = variant === "paper" ? "#fdf8f3" : "#e8571f";
  const fg = variant === "paper" ? "#e8571f" : "#fdf8f3";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={cn("flex-none", className)} aria-hidden="true">
      <rect width="100" height="100" rx="22" fill={bg} />
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontFamily="var(--font-display), ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        fontSize="52"
        letterSpacing="-0.05em"
        fill={fg}
      >
        out
      </text>
    </svg>
  );
}

export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-[1.15rem]", md: "text-[1.35rem]", lg: "text-[2rem]" };
  return (
    <span className={cn("font-display font-bold leading-none tracking-[-0.035em]", sizes[size])}>
      Linked<span className="text-flame">Out</span>
    </span>
  );
}

export function Lockup({ size = 32, wordmarkSize = "md" }: { size?: number; wordmarkSize?: "sm" | "md" | "lg" }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <LogoMark size={size} />
      <Wordmark size={wordmarkSize} />
    </span>
  );
}

/**
 * Short form. Just the mark, no wordmark — for spots where "LinkedOut"
 * is too long: social avatars, stickers, tight corners.
 */
export function ShortMark({ size = 32, className, variant }: MarkProps) {
  return <LogoMark size={size} variant={variant} className={className} />;
}
