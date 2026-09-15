"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { useToast } from "@/components/toast-provider";
import { createReport } from "@/lib/actions/moderation";

const REASONS: { value: string; label: string }[] = [
  { value: "harassment", label: "Harassment or targeting" },
  { value: "doxxing",    label: "Sharing private info" },
  { value: "bad_faith",  label: "Bad faith / trolling" },
  { value: "spam",       label: "Spam" },
  { value: "off_topic",  label: "Off topic" },
  { value: "other",      label: "Something else" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  targetType: "post" | "reply" | "user";
  targetId: string;
  roomId: string;
};

export function ReportDialog({ open, onClose, targetType, targetId, roomId }: Props) {
  const toast = useToast();
  const [reason, setReason] = useState("harassment");
  const [note, setNote] = useState("");

  if (!open) return null;

  async function submit() {
    const res = await createReport({
      targetType, targetId, roomId,
      reason: reason as any,
      note: note.trim() || undefined,
    });
    if (!res.ok) { toast(res.error, "error"); throw new Error(res.error); }
    toast("Reported — mods will take it from here.", "success");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div
        className="w-full max-w-md rounded-t-card bg-card p-5 shadow-card sm:rounded-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
      >
        <h2 id="report-title" className="mb-1 font-display text-[1.15rem] font-bold tracking-[-0.02em]">
          Report to moderators
        </h2>
        <p className="mb-5 text-[0.88rem] text-muted">
          Only mods of this room see this. The person you're reporting won't know you reported.
        </p>

        <div className="mb-4 space-y-1.5">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className="flex cursor-pointer items-center gap-3 rounded-soft border border-line px-3 py-2 transition has-[:checked]:border-flame has-[:checked]:bg-flame/5"
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-flame"
              />
              <span className="text-[0.9rem]">{r.label}</span>
            </label>
          ))}
        </div>

        <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">
          note for mods (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Anything that helps the mods understand."
          className="mb-5 w-full resize-none rounded-soft border border-line bg-paper px-3 py-2 text-[0.9rem] outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/10"
        />

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
            label="Send report"
            successLabel="Reported"
            errorLabel="Try again"
            size="sm"
            onPress={submit}
          />
        </div>
      </div>
    </div>
  );
}
