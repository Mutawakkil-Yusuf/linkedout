// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

// Colors follow --room-accent-* when set (inside a room context via
// roomVars()); falls back to the original flame palette everywhere
// else (profile pages aren't scoped to one room). Same var-with-fallback
// pattern PinnedNote already uses, just extended here for consistency —
// so a person's "right now" line picks up the color of wherever it's
// being viewed instead of always being orange regardless of context.
export function NowLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div
      className="relative my-6 overflow-hidden rounded-soft border p-5 pl-6 text-[1.2rem] font-medium leading-snug tracking-[-0.015em] text-ink"
      style={{
        borderColor: "var(--room-accent-border, #f5d9c7)",
        background:
          "linear-gradient(135deg, var(--room-accent-bg, #fff4ea) 0%, var(--room-accent-bg, #ffeae0) 100%)",
      }}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: "var(--room-accent, #e8571f)" }}
        aria-hidden
      />
      <small
        className="mb-2 block font-mono text-[0.68rem] font-medium uppercase tracking-[0.1em]"
        style={{ color: "var(--room-accent, #c94410)" }}
      >
        right now
      </small>
      <span className="break-words">{text}</span>
    </div>
  );
}
