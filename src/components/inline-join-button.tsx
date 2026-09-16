"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinRoom } from "@/lib/actions/rooms";
import { useToast } from "@/components/toast-provider";

type Props = { roomId: string; slug: string };

/**
 * A Join button meant to sit inside a RoomCard, which is itself a <Link>.
 * Needs preventDefault + stopPropagation so tapping "Join" doesn't also
 * navigate to the room page underneath it.
 */
export function InlineJoinButton({ roomId, slug }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const res = await joinRoom({ roomId, slug });
    setPending(false);
    if (!res.ok) { toast(res.error, "error"); return; }
    toast(`Joined #${slug}.`, "success");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="ml-auto flex-none rounded-full border border-line-2 bg-card px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink transition hover:bg-paper-2 disabled:opacity-50"
    >
      {pending ? "Joining…" : "Join"}
    </button>
  );
}
