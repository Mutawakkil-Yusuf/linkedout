"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { joinRoom } from "@/lib/actions/rooms";
import { useToast } from "@/components/toast-provider";
import { getAccent } from "@/lib/room-theme";

type Props = { roomId: string; slug: string; accent?: string | null };

type Phase = "idle" | "pending" | "done";

/**
 * A Join button meant to sit inside a RoomCard, which is itself a <Link>.
 * Needs preventDefault + stopPropagation so tapping "Join" doesn't also
 * navigate to the room page underneath it.
 *
 * Deliberately its own small component rather than reusing ActionButton:
 * ActionButton's variants (fill/stamp/slot/arrow) hard-code the flame
 * palette directly in globals.css, shared by every invite/share/pin
 * button in the app — overriding that per-instance for a room's own
 * accent color would mean either threading CSS variables through a
 * component used everywhere else, or fighting cascade specificity, both
 * riskier than a small purpose-built button that borrows only the same
 * spring-bounce timing values as a literal, not the class itself.
 */
export function InlineJoinButton({ roomId, slug, accent: accentValue }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>("idle");
  const accent = getAccent(accentValue);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (phase !== "idle") return;
    setPhase("pending");
    const res = await joinRoom({ roomId, slug });
    if (!res.ok) {
      setPhase("idle");
      toast(res.error, "error");
      return;
    }
    setPhase("done");
    toast(`Joined #${slug}.`, "success");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={phase !== "idle"}
      data-phase={phase}
      className="lo-join-btn ml-auto flex-none"
      style={{
        ["--join-accent" as string]: accent.fg,
        ["--join-accent-bg" as string]: accent.bg,
        ["--join-accent-border" as string]: accent.border,
      }}
    >
      <span className="lo-join-btn-label">
        {phase === "pending" ? "joining…" : phase === "done" ? (
          <span className="inline-flex items-center gap-1">
            <Check className="h-3 w-3" strokeWidth={3} /> joined
          </span>
        ) : (
          "join"
        )}
      </span>
    </button>
  );
}
