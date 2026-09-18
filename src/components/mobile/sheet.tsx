"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  label?: string;
  meta?: ReactNode;
  children: ReactNode;
};

// Mobile-only (sm:hidden at the call site, not here, so this component
// stays presentational and the caller decides when it's relevant).
// Mirrors the app's existing dialog pattern (RoomHeader's leave/delete
// confirms: fixed overlay, no animation library) but slides from the
// bottom and stays mounted through its own exit animation instead of
// unmounting immediately, so closing doesn't look like it just vanishes.
export function BottomSheet({ open, onClose, label, meta, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMounted(true);
    setLeaving(false);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") requestClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function requestClose() {
    setLeaving(true);
    window.setTimeout(() => {
      setLeaving(false);
      setMounted(false);
      onClose();
    }, 240);
  }

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label ?? "sheet"}>
      <button
        type="button"
        aria-label="Close"
        onClick={requestClose}
        className={cn(
          "lo-backdrop-pop absolute inset-0 bg-ink/40 backdrop-blur-[2px]",
          leaving ? "animate-[lo-backdrop-out_240ms_ease-in_forwards]" : "animate-[lo-backdrop-in_180ms_ease-out]"
        )}
      />
      <div
        className={cn(
          "lo-sheet-pop absolute inset-x-0 bottom-0 top-16 flex flex-col overflow-hidden",
          "rounded-t-card bg-paper shadow-[0_-8px_40px_-8px_rgba(28,22,19,0.28)]",
          leaving
            ? "animate-[lo-sheet-down_240ms_cubic-bezier(0.65,0,0.35,1)_forwards]"
            : "animate-[lo-sheet-up_300ms_cubic-bezier(0.22,1,0.36,1)]"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex flex-none justify-center pb-1 pt-2">
          <span aria-hidden className="h-[5px] w-[38px] rounded-full bg-line-2" />
        </div>

        <div className="flex flex-none items-center gap-3 border-b border-line px-4 pb-3.5 pt-2">
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="-ml-1.5 grid h-8 w-8 flex-none place-items-center rounded-full text-ink-2 transition-colors active:bg-paper-2"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
          {label && (
            <span className="mx-auto truncate font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">
              {label}
            </span>
          )}
          {meta && <div className="mr-1 flex-none">{meta}</div>}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
