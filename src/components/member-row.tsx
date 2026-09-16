"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldPlus, ShieldMinus, UserMinus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { ActionButton } from "@/components/ui/action-button";
import { useToast } from "@/components/toast-provider";
import { kickMember } from "@/lib/actions/moderation";
import { appointMod, removeMod } from "@/lib/actions/rooms";
import { fmtDate } from "@/lib/utils";
import type { AvatarStyle } from "@/lib/avatar";

type Profile = {
  handle: string;
  display_name: string | null;
  avatar_style?: AvatarStyle | null;
  avatar_seed?: string | null;
};

type Props = {
  roomId: string;
  slug: string;
  userId: string;
  role: "member" | "mod" | "owner";
  joinedAt: string;
  profile: Profile | null;
  isSelf: boolean;
  /** Whether the person viewing this list is themselves the room owner. */
  isOwnerViewer: boolean;
};

const ROLE_LABEL: Record<string, string> = { owner: "owner", mod: "mod", member: "member" };

export function MemberRow({ roomId, slug, userId, role, joinedAt, profile, isSelf, isOwnerViewer }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [roleBusy, setRoleBusy] = useState(false);

  if (!profile) return null;

  async function submitKick() {
    const res = await kickMember({ roomId, userId, reason: reason.trim() || "Removed by moderator" });
    if (!res.ok) { toast(res.error, "error"); throw new Error(res.error); }
    toast(`@${profile!.handle} removed from #${slug}.`, "success");
    setConfirming(false);
    router.refresh();
  }

  async function onAppointMod() {
    setRoleBusy(true);
    const res = await appointMod({ roomId, userId, slug });
    setRoleBusy(false);
    if (!res.ok) { toast(res.error, "error"); return; }
    toast(`@${profile!.handle} is now a mod.`, "success");
    router.refresh();
  }

  async function onRemoveMod() {
    setRoleBusy(true);
    const res = await removeMod({ roomId, userId, slug });
    setRoleBusy(false);
    if (!res.ok) { toast(res.error, "error"); return; }
    toast(`@${profile!.handle} is no longer a mod.`, "success");
    router.refresh();
  }

  const showKick = !isSelf && role !== "owner";
  const showAppoint = isOwnerViewer && !isSelf && role === "member";
  const showDemote = isOwnerViewer && !isSelf && role === "mod";

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
      <Avatar handle={profile.handle} avatarStyle={profile.avatar_style} avatarSeed={profile.avatar_seed} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${profile.handle}`}
            className="truncate text-[0.9rem] font-semibold text-ink hover:text-flame"
          >
            {profile.display_name ?? profile.handle}
          </Link>
          {isSelf && <span className="font-mono text-[0.68rem] text-muted">(you)</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="font-mono text-[0.72rem] text-muted">@{profile.handle}</span>
          <span className="text-line-2">·</span>
          <span className="font-mono text-[0.68rem] text-line-2">joined {fmtDate(joinedAt)}</span>
        </div>
      </div>

      <Chip variant={role === "owner" ? "flame" : "default"} className="flex-none">
        {ROLE_LABEL[role]}
      </Chip>

      <div className="flex flex-none items-center gap-1">
        {showAppoint && (
          <button
            type="button"
            onClick={onAppointMod}
            disabled={roleBusy}
            aria-label={`Make @${profile.handle} a mod`}
            title="Make mod"
            className="rounded-full p-2 text-muted transition hover:bg-paper-2 hover:text-ink disabled:opacity-40"
          >
            <ShieldPlus className="h-4 w-4" strokeWidth={2.25} />
          </button>
        )}
        {showDemote && (
          <button
            type="button"
            onClick={onRemoveMod}
            disabled={roleBusy}
            aria-label={`Remove @${profile.handle} as mod`}
            title="Remove mod"
            className="rounded-full p-2 text-muted transition hover:bg-paper-2 hover:text-ink disabled:opacity-40"
          >
            <ShieldMinus className="h-4 w-4" strokeWidth={2.25} />
          </button>
        )}
        {showKick && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Remove @${profile.handle} from room`}
            title="Remove from room"
            className="rounded-full p-2 text-muted transition hover:bg-flame/10 hover:text-flame"
          >
            <UserMinus className="h-4 w-4" strokeWidth={2.25} />
          </button>
        )}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
          <div
            className="w-full max-w-md rounded-t-card bg-card p-5 shadow-card sm:rounded-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kick-title"
          >
            <h2 id="kick-title" className="mb-1 font-display text-[1.15rem] font-bold tracking-[-0.02em]">
              Remove @{profile.handle}?
            </h2>
            <p className="mb-4 text-[0.88rem] text-muted">
              They'll be removed from #{slug} and notified with your reason. This isn't a ban —
              they can rejoin the room any time.
            </p>

            <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">
              reason (sent to them)
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={280}
              placeholder="e.g. inactive, or off-topic behavior"
              className="mb-5 w-full rounded-soft border border-line bg-paper px-3 py-2 text-[0.9rem] outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/10"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
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
    </div>
  );
}
