// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { cn } from "@/lib/utils";

type MarkProps = { size?: number; className?: string; variant?: "gradient" | "flat" | "paper" };

export function LogoMark({ size = 40, variant = "gradient", className }: MarkProps) {
  const id = `lo-${Math.random().toString(36).slice(2, 8)}`;
  const fill = variant === "gradient" ? `url(#${id}-g)` : variant === "paper" ? "#fdf8f3" : "#e8571f";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={cn("flex-none", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff7a3d" />
          <stop offset="100%" stopColor="#c94410" />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <rect x="71" y="42" width="40" height="16" rx="8" fill="#000" />
        </mask>
      </defs>
      <rect width="100" height="100" rx="30" fill={fill} mask={`url(#${id}-m)`} />
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
