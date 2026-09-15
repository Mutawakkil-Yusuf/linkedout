"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; message: string; kind: ToastKind };

const DISMISS_MS = 3800;

const ToastContext = createContext<((message: string, kind?: ToastKind) => void) | null>(null);

/**
 * useToast()("Posted", "success")
 * useToast()("Couldn't send that — try again", "error")
 *
 * Only two visual variants exist on purpose: error (paper/flame, matches the
 * existing inline `text-flame-deep` error convention used across every form
 * in the app) and everything else (a dark ink pill). There's no invented
 * "success green" — this app's palette is flame + neutrals, full stop, and
 * a toast system is not the place to add a third color family.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), DISMISS_MS);
  }, []);

  function dismiss(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={cn(
              "lo-toast-pop pointer-events-auto flex max-w-sm items-start gap-2 rounded-soft border px-4 py-2.5 text-left text-[0.88rem] leading-snug shadow-card transition",
              t.kind === "error"
                ? "border-flame/25 bg-card text-flame-deep"
                : "border-ink bg-ink text-paper"
            )}
          >
            <span className="flex-none font-mono" aria-hidden="true">
              {t.kind === "error" ? "!" : t.kind === "success" ? "✓" : "·"}
            </span>
            <span>{t.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
