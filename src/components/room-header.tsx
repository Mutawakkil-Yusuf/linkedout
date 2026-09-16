"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Trash2, Users } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { avatarGradient } from "@/lib/avatar";
import { fmtDate } from "@/lib/utils";
import { leaveRoom, deleteRoom } from "@/lib/actions/rooms";
import { useToast } from "@/components/toast-provider";

type Room = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
};

type Props = {
  room: Room;
  memberCount: number;
  role?: "member" | "mod" | "owner";
  joinedAt?: string;
  isMod?: boolean;
  openReports?: number;
};

export function RoomHeader({ room, memberCount, role, joinedAt, isMod, openReports }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [typedSlug, setTypedSlug] = useState("");
  const isOwner = role === "owner";
  const isMember = !!role;
  const otherMembers = memberCount - 1;

  async function submitLeave() {
    const res = await leaveRoom({ roomId: room.id, slug: room.slug });
    if (!res.ok) { toast(res.error, "error"); throw new Error(res.error); }
    toast(`Left #${room.slug}.`, "success");
    setConfirmingLeave(false);
    router.push("/rooms");
    router.refresh();
  }

  async function submitDelete() {
    const res = await deleteRoom({ roomId: room.id });
    if (!res.ok) { toast(res.error, "error"); throw new Error(res.error); }
    toast(`#${room.slug} deleted.`, "success");
    setConfirmingDelete(false);
    router.push("/rooms");
    router.refresh();
  }

  return (
    <header className="mb-6 overflow-hidden rounded-card border border-line bg-card">
      <div
        className="h-16 w-full"
        style={{ background: avatarGradient(room.slug) }}
        aria-hidden="true"
      />
      <div className="px-5 pb-5">
        <div className="-mt-8 mb-3 flex items-end justify-between gap-3">
          <div
            className="flex h-16 w-16 flex-none items-center justify-center rounded-[16px] border-4 border-card font-display text-[1.3rem] font-bold text-white shadow-card"
            style={{ background: avatarGradient(room.slug) }}
            aria-hidden="true"
          >
            #
          </div>

          {isMod && (
            <div className="flex flex-none flex-wrap items-center justify-end gap-3 pb-1">
              <Link
                href={`/rooms/${room.slug}/mod/members`}
                className="font-mono text-[0.72rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
              >
                members
              </Link>
              <Link
                href={`/rooms/${room.slug}/mod/log`}
                className="font-mono text-[0.72rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
              >
                log
              </Link>
              <Link
                href={`/rooms/${room.slug}/mod`}
                className="inline-flex items-center gap-1.5 rounded-full bg-flame/10 px-3 py-1.5 font-mono text-[0.72rem] font-medium text-flame transition hover:bg-flame/15"
              >
                mod
                {openReports ? (
                  <span className="rounded-full bg-flame px-1.5 text-[0.65rem] font-bold text-white">
                    {openReports}
                  </span>
                ) : null}
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="break-words font-display text-[1.6rem] font-bold tracking-[-0.025em]">
              <span className="font-mono text-flame">#</span>{room.slug}
            </h1>
            <p className="mt-0.5 text-[0.9rem] text-muted">{room.name}</p>
          </div>

          {isMember && (
            <div className="flex flex-none items-center gap-2">
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-[0.72rem] text-muted transition hover:border-flame/30 hover:text-flame"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  delete
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmingLeave(true)}
                className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-[0.72rem] text-muted transition hover:border-flame/30 hover:text-flame"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} />
                leave
              </button>
            </div>
          )}
        </div>

        {room.description && (
          <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-2">{room.description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3.5 font-mono text-[0.72rem] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
          <span aria-hidden="true">·</span>
          <span>opened {fmtDate(room.created_at)}</span>
          {isMember && joinedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>you joined {fmtDate(joinedAt)}</span>
            </>
          )}
          {isOwner && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-flame">you own this room</span>
            </>
          )}
        </div>
      </div>

      {confirmingLeave && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
          <div
            className="w-full max-w-md rounded-t-card bg-card p-5 shadow-card sm:rounded-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-title"
          >
            <h2 id="leave-title" className="mb-1 font-display text-[1.15rem] font-bold tracking-[-0.02em]">
              Leave #{room.slug}?
            </h2>
            <p className="mb-5 text-[0.88rem] leading-relaxed text-muted">
              {isOwner
                ? otherMembers > 0
                  ? "You own this room. Ownership will automatically pass to whoever's been here longest — a mod first, or the earliest-joined member if there's no mod. Your past posts and replies stay as they are. You can rejoin any time, just not as owner."
                  : "You're the only person here. Leaving will empty the room — it'll stay open with no owner until someone joins."
                : "You'll stop seeing posts from this room. Your past posts and replies here stay as they are. You can rejoin any time."}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingLeave(false)}
                className="rounded-full px-4 py-2 text-[0.85rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink"
              >
                Cancel
              </button>
              <ActionButton
                variant="stamp"
                label="Leave room"
                successLabel="Left"
                errorLabel="Try again"
                size="sm"
                onPress={submitLeave}
              />
            </div>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
          <div
            className="w-full max-w-md rounded-t-card bg-card p-5 shadow-card sm:rounded-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-room-title"
          >
            <h2 id="delete-room-title" className="mb-1 font-display text-[1.15rem] font-bold tracking-[-0.02em] text-flame-deep">
              Delete #{room.slug}?
            </h2>
            <p className="mb-4 text-[0.88rem] leading-relaxed text-muted">
              This is permanent. Every post, reply, and membership in this room — for all{" "}
              {memberCount} {memberCount === 1 ? "member" : "members"} — is deleted with it.
              There's no undo.
            </p>

            <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">
              type <span className="text-ink">{room.slug}</span> to confirm
            </label>
            <input
              value={typedSlug}
              onChange={(e) => setTypedSlug(e.target.value)}
              placeholder={room.slug}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="mb-5 w-full rounded-soft border border-line bg-paper px-3 py-2 font-mono text-[0.9rem] outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/10"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setConfirmingDelete(false); setTypedSlug(""); }}
                className="rounded-full px-4 py-2 text-[0.85rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink"
              >
                Cancel
              </button>
              <ActionButton
                variant="stamp"
                label="Delete room"
                successLabel="Deleted"
                errorLabel="Try again"
                size="sm"
                disabled={typedSlug.trim() !== room.slug}
                onPress={submitDelete}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
