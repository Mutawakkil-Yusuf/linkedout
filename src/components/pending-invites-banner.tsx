"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { acceptInvite, declineInvite } from "@/lib/actions/rooms";
import { useToast } from "@/components/toast-provider";

type Invite = {
  id: string;
  message: string | null;
  created_at: string;
  room: { slug: string; name: string } | null;
  inviter: { handle: string; display_name: string | null } | null;
};

export function PendingInvitesBanner({ invites }: { invites: Invite[] }) {
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  if (invites.length === 0) return null;

  function accept(id: string, roomSlug?: string) {
    setBusyId(id);
    startTransition(async () => {
      const res = await acceptInvite({ inviteId: id });
      setBusyId(null);
      if (!res.ok) { toast(res.error, "error"); return; }
      toast(roomSlug ? `Joined #${roomSlug}.` : "Joined.", "success");
      router.refresh();
    });
  }

  function decline(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const res = await declineInvite({ inviteId: id });
      setBusyId(null);
      if (!res.ok) { toast(res.error, "error"); return; }
      router.refresh();
    });
  }

  const summary =
    invites.length === 1
      ? `${invites[0].inviter?.display_name ?? invites[0].inviter?.handle} invited you to #${invites[0].room?.slug}`
      : `from ${invites
          .slice(0, 3)
          .map((i) => `@${i.inviter?.handle}`)
          .join(", ")}${invites.length > 3 ? "…" : ""}`;

  return (
    <div className="mt-8 overflow-hidden rounded-soft border border-[#f5d9c7] bg-[#fff4ea]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#ffeedd]"
      >
        <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-flame text-white">
          <Inbox className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 text-[0.9rem] text-ink-2">
          <strong className="font-semibold text-ink">
            {invites.length} pending {invites.length === 1 ? "invite" : "invites"}
          </strong>
          {" · "}
          <span className="truncate">{summary}</span>
        </span>
        <span className="flex-none font-mono text-[0.72rem] text-flame-deep">
          {expanded ? "hide ↑" : "view ↓"}
        </span>
      </button>

      {expanded && (
        <ul className="border-t border-[#f5d9c7]">
          {invites.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center gap-3 border-b border-[#f5d9c7] px-4 py-3 last:border-b-0"
            >
              <Avatar handle={inv.inviter?.handle ?? "??"} size="sm" />

              <div className="min-w-0 flex-1">
                <p className="text-[0.88rem] leading-tight">
                  <span className="font-semibold">
                    {inv.inviter?.display_name ?? inv.inviter?.handle}
                  </span>
                  {" invited you to "}
                  <span className="font-mono text-flame">#{inv.room?.slug}</span>
                </p>
                {inv.message && (
                  <p className="mt-1 truncate text-[0.8rem] text-muted">
                    &ldquo;{inv.message}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex flex-none gap-1.5">
                <button
                  type="button"
                  onClick={() => decline(inv.id)}
                  disabled={busyId === inv.id}
                  className="rounded-full border border-line-2 bg-card px-3 py-1.5 text-[0.78rem] font-medium text-ink transition hover:bg-paper-2 disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => accept(inv.id, inv.room?.slug)}
                  disabled={busyId === inv.id}
                  className="rounded-full bg-flame px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-flame-deep disabled:opacity-50"
                >
                  {busyId === inv.id ? "Joining…" : "Accept"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
