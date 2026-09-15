"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Variant = "slot" | "stamp" | "fill" | "arrow";
type Phase = "idle" | "pressing" | "loading" | "success" | "error";
type Size = "sm" | "md";

interface Props {
  variant?: Variant;
  label: string;
  successLabel?: string;
  errorLabel?: string;
  onPress?: () => Promise<unknown> | unknown;
  size?: Size;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

const PRESS_MS = 90;
const LOAD_MIN_MS = 500;
const SUCCESS_MS = 900;
const ERROR_MS = 1600;

export function ActionButton({
  variant = "slot",
  label,
  successLabel = "Done",
  errorLabel = "Try again",
  onPress,
  size = "md",
  type = "button",
  disabled = false,
  className,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reduce, setReduce] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  };

  async function handleClick() {
    if (phase !== "idle" || disabled) return;

    setPhase("pressing");
    const startedAt = Date.now();

    try {
      await onPress?.();
      const elapsed = Date.now() - startedAt;

      if (reduce) {
        setPhase("success");
        schedule(() => setPhase("idle"), SUCCESS_MS);
        return;
      }

      const wait = Math.max(PRESS_MS + LOAD_MIN_MS - elapsed, 0);
      schedule(() => setPhase("loading"), PRESS_MS);
      schedule(() => setPhase("success"), PRESS_MS + wait);
      schedule(() => setPhase("idle"), PRESS_MS + wait + SUCCESS_MS);
    } catch {
      if (reduce) {
        setPhase("error");
        schedule(() => setPhase("idle"), 600);
        return;
      }
      schedule(() => setPhase("error"), PRESS_MS + 150);
      schedule(() => setPhase("idle"), PRESS_MS + 150 + ERROR_MS);
    }
  }

  const showBase    = phase === "idle" || phase === "pressing" || phase === "loading";
  const showSuccess = phase === "success";
  const showError   = phase === "error";
  const isLoading   = phase === "pressing" || phase === "loading";

  return (
    <button
      type={type}
      disabled={disabled || isLoading || showSuccess}
      onClick={handleClick}
      aria-busy={isLoading}
      data-phase={phase}
      data-variant={variant}
      className={cn(
        "lo-btn",
        `lo-btn-${variant}`,
        size === "sm" ? "lo-btn-sm" : "lo-btn-md",
        phase === "pressing" && "is-pressing",
        phase === "loading" && "is-loading",
        showSuccess && "is-success",
        showError && "is-error",
        className
      )}
    >
      {/* decorative layers */}
      {variant === "slot" && (
        <>
          <span className="lo-btn-slot-el" aria-hidden="true" />
          <span className="lo-btn-spinner" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 3 a9 9 0 0 1 9 9" />
            </svg>
          </span>
        </>
      )}
      {variant === "stamp" && <span className="lo-btn-imprint" aria-hidden="true" />}
      {variant === "fill"  && <span className="lo-btn-fill-el" aria-hidden="true" />}
      {variant === "arrow" && <span className="lo-btn-slot-el" aria-hidden="true" />}

      {/* label stack — three labels, one grid cell */}
      <span className="lo-btn-label-stack">
        <span data-show={showBase}>
          {label}
          {variant === "arrow" && (
            <span className="lo-btn-arrow-el" aria-hidden="true">→</span>
          )}
        </span>
        <span data-show={showSuccess}>{successLabel}</span>
        <span data-show={showError}>{errorLabel}</span>
      </span>

      <span className="sr-only" aria-live="polite">
        {isLoading ? "Loading" : showSuccess ? successLabel : showError ? errorLabel : ""}
      </span>
    </button>
  );
}
