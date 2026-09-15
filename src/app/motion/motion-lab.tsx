"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ActionButton } from "@/components/ui/action-button";
import { Lockup } from "@/components/logo";

const FAKE_DELAY = 900;

const samples = [
  {
    variant: "slot" as const,
    tag: "A",
    name: "Slot",
    subtitle: "soft press · slot opens",
    label: "Sign in",
    successLabel: "Signed in",
    note: "Label fades, then a paper slot opens from the right. Best for login, send, post.",
  },
  {
    variant: "stamp" as const,
    tag: "B",
    name: "Stamp",
    subtitle: "ink stamp",
    label: "Send magic link",
    successLabel: "Sent",
    note: "Darker flame circle stamps in from 0.4 scale. Check mark pops on success. Best for send, report, commit.",
  },
  {
    variant: "fill" as const,
    tag: "C",
    name: "Fill",
    subtitle: "flame fill sweep",
    label: "Get a handle →",
    successLabel: "Handle created",
    note: "Ghost button. Flame gradient sweeps left-to-right. Label wipes ink→white in sync. Best for signup, create.",
  },
  {
    variant: "arrow" as const,
    tag: "D",
    name: "Arrow",
    subtitle: "arrow exits through the slot",
    label: "Continue",
    successLabel: "Onwards",
    note: "Label shifts left, arrow slides right through a paper slot. Best for continue, next, enter.",
  },
];

export function MotionLab() {
  return (
    <div className="mx-auto max-w-[44rem] px-5 py-14">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <Lockup size={32} />
        <span className="font-mono text-[0.72rem] text-muted">motion lab</span>
      </header>

      <h1 className="mb-3 font-display text-[2rem] font-bold leading-tight tracking-[-0.03em]">
        Four press-and-load gestures
      </h1>
      <p className="mb-12 max-w-[34rem] text-[1rem] leading-relaxed text-muted">
        Click any button to play the full sequence: press → loading → success.
        Reduced motion is respected automatically.
      </p>

      <div className="space-y-4">
        {samples.map((s) => (
          <section key={s.variant} className="rounded-card border border-line bg-card p-5">
            <header className="mb-4 flex items-baseline gap-3">
              <span className="rounded-[6px] bg-flame/10 px-2 py-1 font-mono text-[0.72rem] tracking-[0.08em] text-flame">
                {s.tag}
              </span>
              <h2 className="font-display text-[1.05rem] font-bold tracking-[-0.015em]">
                {s.name}
              </h2>
              <span className="ml-auto font-mono text-[0.7rem] text-muted">{s.subtitle}</span>
            </header>

            <div className="mb-4 flex justify-start">
              <ActionButton
                variant={s.variant}
                label={s.label}
                successLabel={s.successLabel}
                errorLabel="Try again"
                onPress={() => new Promise((r) => setTimeout(r, FAKE_DELAY))}
              />
            </div>

            <p className="text-[0.88rem] leading-relaxed text-ink-2">{s.note}</p>
          </section>
        ))}
      </div>

      <p className="mt-14 border-t border-line pt-6 font-mono text-[0.72rem] text-muted">
        all under 2s · prefers-reduced-motion respected · keyboard accessible
      </p>
    </div>
  );
}
