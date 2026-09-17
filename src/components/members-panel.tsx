"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ActionButton } from "@/components/ui/action-button";
import { appointMod, removeMod } from "@/lib/actions/rooms";
import { kickMember } from "@/lib/actions/moderation";
import { TransferOwnershipDialog } from "@/components/transfer-ownership-dialog";
import { useToast } from "@/components/toast-provider";

type Member = {
  user_id: string;
  role: "member" | "mod" | "owner";
  joined_at?: string;
  profile: { handle: string; display_name: string | null } | null;
};

type Props = {
  roomId: string;
  roomSlug: string;
  members: Member[];
  viewerRole: "member" | "mod" | "owner";
  viewerId: string;
};

export function MembersPanel({
  roomId,
  roomSlug,
  members,
  viewerRole,
  viewerId,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState<Member | null>(null);
  const [kickReason, setKickReason] = useState("");
  const isOwner = viewerRole === "owner";
  const isMod = viewerRole === "mod" || viewerRole === "owner";

  async function promote(userId: string) {
    setBusyId(userId);
    const res = await appointMod({ roomId, userId, slug: roomSlug });
    setBusyId(null);
    if (!res.ok) { toast(res.error, "error"); return; }
    toast("Promoted to mod.", "success");
    router.refresh();
  }

  async function demote(userId: string) {
    setBusyId(userId);
    const res = await removeMod({ roomId, userId, slug: roomSlug });
    setBusyId(null);
    if (!res.ok) { toast(res.error, "error"); return; }
    toast("No longer a mod.", "success");
    router.refresh();
  }

  async function submitKick() {
    if (!kickTarget) return;
    const res = await kickMember({
      roomId,
      userId: kickTarget.user_id,
      reason: kickReason.trim() || "Removed by moderator",
    });
    if (!res.ok) { toast(res.error, "error"); throw new Error(res.error); }
    toast(`@${kickTarget.profile?.handle} removed from #${roomSlug}.`, "success");
    setKickTarget(null);
    setKickReason("");
    router.refresh();
  }

  const owner = members.find((m) => m.role === "owner");
  const eligibleForTransfer = members.filter(
    (m) => m.user_id !== viewerId && m.role !== "owner"
  );

  return (
    <>
      {isOwner && (
        <div className="mb-5 rounded-card border border-line bg-card p-5">
          <h2 className="mb-1 font-display text-[1.05rem] font-bold tracking-[-0.02em]">
            Ownership
          </h2>
          <p className="mb-4 text-[0.88rem] leading-relaxed text-muted">
            You own this room. If you transfer ownership, you'll become a
            moderator and the new owner will have full control, including
            appointing mods and transferring ownership again.
          </p>
          <button
            type="button"
            onClick={() => setTransferOpen(true)}
            disabled={eligibleForTransfer.length === 0}
            className="rounded-full border border-line-2 bg-card px-4 py-2 text-[0.82rem] font-semibold text-ink transition hover:bg-paper-2 disabled:opacity-40"
          >
            Transfer ownership…
          </button>
          {eligibleForTransfer.length === 0 && (
            <p className="mt-2 font-mono text-[0.72rem] text-muted">
              no eligible members yet
            </p>
          )}
        </div>
      )}

      <ul className="divide-y divide-line rounded-card border border-line bg-card">
        {members.map((m) => {
          const isSelf = m.user_id === viewerId;
          const p = m.profile;
          const isCurrentOwner = m.role === "owner";
          if (!p) return null;

          return (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar handle={p.handle} size="sm" />

              <div className="min-w-0 flex-1">
                <Link
                  href={`/u/${p.handle}`}
                  className="block truncate text-[0.92rem] font-medium hover:underline"
                >
                  {p.display_name ?? p.handle}
                  {isSelf && <span className="ml-1.5 font-mono text-[0.68rem] font-normal text-muted">(you)</span>}
                </Link>
                <div className="font-mono text-[0.72rem] text-muted">
                  @{p.handle}
                </div>
              </div>

              <span
                className={
                  "rounded-full px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-wider " +
                  (m.role === "owner"
                    ? "bg-ink text-paper"
                    : m.role === "mod"
                    ? "bg-flame/10 text-flame"
                    : "bg-paper-2 text-muted")
                }
              >
                {m.role}
              </span>

              {isOwner && !isSelf && !isCurrentOwner && (
                <div className="flex gap-1">
                  {m.role === "member" ? (
                    <button
                      type="button"
                      onClick={() => promote(m.user_id)}
                      disabled={busyId === m.user_id}
                      className="rounded-full border border-line px-3 py-1 text-[0.78rem] font-medium text-ink transition hover:border-flame hover:text-flame disabled:opacity-50"
                    >
                      Make mod
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => demote(m.user_id)}
                      disabled={busyId === m.user_id}
                      className="rounded-full border border-line px-3 py-1 text-[0.78rem] font-medium text-muted transition hover:border-line-2 hover:text-ink disabled:opacity-50"
                    >
                      Remove mod
                    </button>
                  )}
                </div>
              )}

              {isMod && !isSelf && !isCurrentOwner && (
                <button
                  type="button"
                  onClick={() => setKickTarget(m)}
                  aria-label={`Remove @${p.handle} from room`}
                  title="Remove from room"
                  className="flex-none rounded-full p-2 text-muted transition hover:bg-flame/10 hover:text-flame"
                >
                  <UserMinus className="h-4 w-4" strokeWidth={2.25} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {owner && (
        <TransferOwnershipDialog
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          roomId={roomId}
          candidates={eligibleForTransfer}
        />
      )}

      {kickTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
          <div
            className="w-full max-w-md rounded-t-card bg-card p-5 shadow-card sm:rounded-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kick-title"
          >
            <h2 id="kick-title" className="mb-1 font-display text-[1.15rem] font-bold tracking-[-0.02em]">
              Remove @{kickTarget.profile?.handle}?
            </h2>
            <p className="mb-4 text-[0.88rem] text-muted">
              They'll be removed from #{roomSlug} and notified with your reason.
              This isn't a ban. They can rejoin any time, if the room allows it.
            </p>

            <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">
              reason (sent to them)
            </label>
            <input
              value={kickReason}
              onChange={(e) => setKickReason(e.target.value)}
              maxLength={280}
              placeholder="e.g. inactive, or off-topic behavior"
              className="mb-5 w-full rounded-soft border border-line bg-paper px-3 py-2 text-[0.9rem] outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/10"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setKickTarget(null); setKickReason(""); }}
                className="rounded-full px-4 py-2 text-[0.85rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink"
              >
                Cancel
              </button>
              <ActionButton
                variant="stamp"
                label="Remove member"
                successLabel="Removed"
                errorLabel="Try again"
                size="sm"
                onPress={submitKick}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
