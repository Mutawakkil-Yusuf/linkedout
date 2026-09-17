"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import Link from "next/link";
import { Pin, X } from "lucide-react";

type Props = {
  postId: string;
  body: string;
  author: { handle: string; display_name: string | null } | null;
};

const DISMISS_KEY = (postId: string) => `lo_pin_dismissed_${postId}`;

export function PinnedNote({ postId, body, author }: Props) {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(DISMISS_KEY(postId)) === "1";
    } catch {
      return false;
    }
  });

  function dismiss() {
    setHidden(true);
    try {
      sessionStorage.setItem(DISMISS_KEY(postId), "1");
    } catch {
      // sessionStorage unavailable (private mode, etc), dismissal just
      // won't persist across reloads. Not worth surfacing to the user.
    }
  }

  if (hidden) return null;

  return (
    <div
      className="relative mb-6 flex gap-3 rounded-soft border p-4 pl-5"
      style={{
        background: "var(--room-accent-bg)",
        borderColor: "var(--room-accent-border)",
      }}
    >
      <span
        className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r"
        style={{ background: "var(--room-accent)" }}
        aria-hidden
      />

      <Pin
        className="mt-0.5 h-4 w-4 flex-none"
        strokeWidth={2}
        style={{ color: "var(--room-accent)" }}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <div
          className="mb-1 font-mono text-[0.66rem] uppercase tracking-[0.14em]"
          style={{ color: "var(--room-accent)" }}
        >
          pinned by{" "}
          <Link href={`/u/${author?.handle}`} className="underline underline-offset-2">
            @{author?.handle ?? "unknown"}
          </Link>
        </div>
        <p className="whitespace-pre-wrap text-[0.92rem] leading-relaxed text-ink-2">
          {body}
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss pinned note"
        className="self-start rounded p-1 text-muted transition hover:text-ink"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </div>
  );
}
