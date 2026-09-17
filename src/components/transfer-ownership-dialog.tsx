"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ActionButton } from "@/components/ui/action-button";
import { transferOwnership } from "@/lib/actions/rooms";
import { useToast } from "@/components/toast-provider";

type Candidate = {
  user_id: string;
  role: string;
  profile: { handle: string; display_name: string | null } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  candidates: Candidate[];
};

export function TransferOwnershipDialog({
  open,
  onClose,
  roomId,
  candidates,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  if (!open) return null;

  const target = candidates.find((c) => c.user_id === selected);
  const expectedHandle = target?.profile?.handle ?? "";
  const confirmOk = confirmText.trim().toLowerCase() === expectedHandle;

  async function submit() {
    if (!selected) { toast("Pick someone first", "error"); throw new Error("Pick someone first"); }
    if (!confirmOk) { toast("Confirm the handle", "error"); throw new Error("Confirm the handle"); }
    const res = await transferOwnership({ roomId, toUserId: selected });
    if (!res.ok) { toast(res.error, "error"); throw new Error(res.error); }
    toast(`Ownership transferred to @${expectedHandle}.`, "success");
    onClose();
    setSelected(null);
    setConfirmText("");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div
        className="w-full max-w-md rounded-t-card bg-card p-5 shadow-card sm:rounded-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-title"
      >
        <h2
          id="transfer-title"
          className="mb-1 font-display text-[1.15rem] font-bold tracking-[-0.02em]"
        >
          Transfer ownership
        </h2>
        <p className="mb-5 text-[0.88rem] leading-relaxed text-muted">
          You will become a moderator. The new owner will be able to appoint
          mods, ban members, and transfer ownership again. This can't be undone
          by you.
        </p>

        <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">
          new owner
        </label>
        {candidates.length === 0 ? (
          <p className="mb-4 rounded-soft border border-line bg-paper-2 px-3 py-3 text-[0.85rem] text-muted">
            No eligible members yet. Invite someone or wait for the room to grow.
          </p>
        ) : (
          <div className="mb-4 max-h-56 overflow-y-auto rounded-soft border border-line">
            <ul className="divide-y divide-line">
              {candidates.map((c) => {
                const isPicked = selected === c.user_id;
                return (
                  <li key={c.user_id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(c.user_id);
                        setConfirmText("");
                      }}
                      className={
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition " +
                        (isPicked ? "bg-flame/10" : "hover:bg-paper-2")
                      }
                    >
                      <Avatar handle={c.profile?.handle ?? "??"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[0.9rem] font-medium">
                          {c.profile?.display_name ?? c.profile?.handle}
                        </div>
                        <div className="font-mono text-[0.72rem] text-muted">
                          @{c.profile?.handle} · {c.role}
                        </div>
                      </div>
                      {isPicked && (
                        <span className="text-flame" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {selected && (
          <>
            <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">
              type <span className="text-ink">@{expectedHandle}</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedHandle}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="mb-5 w-full rounded-soft border border-line bg-paper px-3 py-2 font-mono text-[0.9rem] outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/10"
            />
          </>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[0.85rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink"
          >
            Cancel
          </button>
          <ActionButton
            variant="stamp"
            label="Transfer"
            successLabel="Transferred"
            errorLabel="Try again"
            size="sm"
            disabled={!selected || !confirmOk}
            onPress={submit}
          />
        </div>
      </div>
    </div>
  );
}
