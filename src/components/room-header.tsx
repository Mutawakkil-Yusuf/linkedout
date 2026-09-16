"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { InviteDialog } from "@/components/invite-dialog";
import { leaveRoom, deleteRoom } from "@/lib/actions/rooms";
import { useToast } from "@/components/toast-provider";
import { fmtDate } from "@/lib/utils";

type Room = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: string;
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

const VISIBILITY_LABEL: Record<string, string> = {
  public: "public",
  unlisted: "unlisted",
  private: "private",
};

export function RoomHeader({ room, memberCount, role, joinedAt, isMod, openReports }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
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
    <>
      <header className="mb-6 border-b border-line pb-5">
        <div
          className="mb-4 h-1 rounded-full"
          style={{ background: "var(--room-accent)" }}
          aria-hidden
        />

        <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
          <h1 className="break-words font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.03em]">
            <span
              className="mr-0.5 font-mono text-[1.35rem] font-medium"
              style={{ color: "var(--room-accent)" }}
            >
              #
            </span>
            {room.slug}
          </h1>
          <span className="inline-flex items-center gap-1.5 font-mono text-[0.78rem] text-muted">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        {room.name && (
          <p className="mb-2.5 max-w-[38rem] text-[0.95rem] text-ink-2">{room.name}</p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.68rem] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--room-accent)" }}
              aria-hidden
            />
            {VISIBILITY_LABEL[room.visibility] ?? room.visibility}
          </span>
          <span aria-hidden className="text-line-2">·</span>
          <span>opened {fmtDate(room.created_at)}</span>
          {isMember && joinedAt && (
            <>
              <span aria-hidden className="text-line-2">·</span>
              <span>joined {fmtDate(joinedAt)}</span>
            </>
          )}
          {isOwner && (
            <>
              <span aria-hidden className="text-line-2">·</span>
              <span className="font-medium" style={{ color: "var(--room-accent)" }}>
                you own this room
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isMember && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInviteOpen(true)}
                className="gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" strokeWidth={2.25} />
                Invite
              </Button>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setConfirmingLeave(true)}
                className="gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} />
                Leave
              </Button>
              {isOwner && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmingDelete(true)}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Delete
                </Button>
              )}
            </>
          )}

          {isMod && (
            <div className="flex w-full flex-wrap items-center gap-3 pt-1 font-mono text-[0.72rem] sm:ml-auto sm:w-auto sm:pt-0">
              <Link
                href={`/rooms/${room.slug}/mod/members`}
                className="text-muted underline decoration-line-2 underline-offset-[3px] transition hover:text-ink hover:decoration-ink"
              >
                members
              </Link>
              <Link
                href={`/rooms/${room.slug}/mod/log`}
                className="text-muted underline decoration-line-2 underline-offset-[3px] transition hover:text-ink hover:decoration-ink"
              >
                log
              </Link>
              <Link
                href={`/rooms/${room.slug}/mod`}
                className="inline-flex items-center gap-1.5 rounded-full bg-flame/10 px-3 py-1.5 font-medium text-flame transition hover:bg-flame/15"
              >
                mod
                {(openReports ?? 0) > 0 && (
                  <span className="rounded-full bg-flame px-1.5 text-[0.62rem] font-bold text-white">
                    {(openReports ?? 0) > 99 ? "99+" : openReports}
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>
      </header>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} roomId={room.id} />

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
                : "You'll stop seeing posts from this room. Your past posts and replies here stay as they are. You can rejoin any time this room allows it."}
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
    </>
  );
}
