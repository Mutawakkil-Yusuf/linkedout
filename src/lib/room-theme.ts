// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

/**
 * Room accent palettes. Each room picks one.
 * Used for the room hash, the pinned note, the composer focus ring,
 * and the warmed-post marker. Everything else stays ink/paper.
 *
 * Constrained on purpose — nothing neon, nothing off-brand.
 */

import type { CSSProperties } from "react";

export type RoomAccent = "flame" | "moss" | "amber" | "plum" | "sage" | "indigo";

export const ACCENTS: {
  value: RoomAccent;
  label: string;
  fg: string;
  bg: string;
  border: string;
}[] = [
  {
    value: "flame",
    label: "Flame",
    fg: "#e8571f",
    bg: "rgba(232, 87, 31, 0.07)",
    border: "rgba(232, 87, 31, 0.20)",
  },
  {
    value: "moss",
    label: "Moss",
    fg: "#4a7c59",
    bg: "rgba(74, 124, 89, 0.08)",
    border: "rgba(74, 124, 89, 0.22)",
  },
  {
    value: "amber",
    label: "Amber",
    fg: "#b3771f",
    bg: "rgba(179, 119, 31, 0.08)",
    border: "rgba(179, 119, 31, 0.22)",
  },
  {
    value: "plum",
    label: "Plum",
    fg: "#7c3a5a",
    bg: "rgba(124, 58, 90, 0.07)",
    border: "rgba(124, 58, 90, 0.20)",
  },
  {
    value: "sage",
    label: "Sage",
    fg: "#6b8070",
    bg: "rgba(107, 128, 112, 0.08)",
    border: "rgba(107, 128, 112, 0.22)",
  },
  {
    value: "indigo",
    label: "Indigo",
    fg: "#3d4c8f",
    bg: "rgba(61, 76, 143, 0.07)",
    border: "rgba(61, 76, 143, 0.20)",
  },
];

export function getAccent(value: string | null | undefined) {
  return ACCENTS.find((a) => a.value === value) ?? ACCENTS[0];
}

/**
 * Returns CSS custom properties for a room.
 * Use: <div style={roomVars(accent)}>
 * Then reference var(--room-accent) anywhere inside.
 */
export function roomVars(accent: string | null | undefined): CSSProperties {
  const a = getAccent(accent);
  return {
    ["--room-accent" as string]: a.fg,
    ["--room-accent-bg" as string]: a.bg,
    ["--room-accent-border" as string]: a.border,
  } as CSSProperties;
}
