"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

export type Visibility = "public" | "unlisted" | "private";

const OPTIONS: {
  value: Visibility;
  label: string;
  hint: string;
}[] = [
  {
    value: "public",
    label: "Public",
    hint: "Anyone can find and join this room.",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    hint: "Only people with the link can join. Not listed in Discover.",
  },
  {
    value: "private",
    label: "Private",
    hint: "Invite only. Not listed anywhere, and can't be joined without one.",
  },
];

type Props = {
  value: Visibility;
  onChange: (v: Visibility) => void;
};

export function RoomVisibilityPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      {OPTIONS.map((o) => {
        const selected = value === o.value;
        return (
          <label
            key={o.value}
            className={
              "flex cursor-pointer items-start gap-3 rounded-soft border px-3.5 py-3 transition " +
              (selected
                ? "border-flame bg-flame/5"
                : "border-line hover:border-line-2")
            }
          >
            <input
              type="radio"
              name="visibility"
              value={o.value}
              checked={selected}
              onChange={() => onChange(o.value)}
              className="mt-0.5 accent-flame"
            />
            <span className="flex-1">
              <span className="block text-[0.9rem] font-medium text-ink">
                {o.label}
              </span>
              <span className="mt-0.5 block text-[0.82rem] leading-snug text-muted">
                {o.hint}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
