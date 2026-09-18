"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComposerFAB({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Write a post"
      className={cn(
        "fixed z-30 grid h-14 w-14 place-items-center rounded-full bg-flame text-white",
        "shadow-[0_1px_2px_rgba(28,22,19,0.1),0_10px_28px_-8px_rgba(232,87,31,0.5)]",
        "transition-transform active:scale-[0.94] lg:hidden",
        className
      )}
      style={{ right: "1.25rem", bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
    >
      <Plus className="h-[22px] w-[22px]" strokeWidth={2.4} />
    </button>
  );
}
