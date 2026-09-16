"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { ACCENTS, type RoomAccent } from "@/lib/room-theme";

type Props = {
  value: RoomAccent;
  onChange: (v: RoomAccent) => void;
};

export function RoomAccentPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACCENTS.map((a) => {
        const selected = value === a.value;
        return (
          <button
            key={a.value}
            type="button"
            onClick={() => onChange(a.value)}
            aria-label={a.label}
            aria-pressed={selected}
            className={
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.78rem] font-medium transition " +
              (selected
                ? "border-transparent"
                : "border-line text-muted hover:border-line-2 hover:text-ink")
            }
            style={
              selected
                ? { background: a.bg, color: a.fg, borderColor: a.border }
                : undefined
            }
          >
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: a.fg }}
              aria-hidden
            />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
