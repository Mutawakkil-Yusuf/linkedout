"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { handle: string };

export function DeleteAccountSection({ handle }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const matches = typed.trim() === handle;

  return (
    <>
      <Button variant="danger" type="button" onClick={() => setConfirming(true)}>
        Delete my account
      </Button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
          <div
            className="w-full max-w-md rounded-t-card bg-card p-5 shadow-card sm:rounded-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title" className="mb-1 font-display text-[1.15rem] font-bold tracking-[-0.02em] text-flame-deep">
              Delete your account?
            </h2>
            <p className="mb-4 text-[0.88rem] leading-relaxed text-muted">
              This is permanent. Your profile, posts, replies, room memberships, and messages
              are hard-deleted and cannot be recovered. There's no grace period and no undo.
            </p>

            <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">
              type <span className="text-ink">{handle}</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={handle}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="mb-5 w-full rounded-soft border border-line bg-paper px-3 py-2 font-mono text-[0.9rem] outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/10"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setConfirming(false); setTyped(""); }}
                className="rounded-full px-4 py-2 text-[0.85rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink"
              >
                Cancel
              </button>
              <form
                action="/api/delete"
                method="post"
                onSubmit={() => setSubmitting(true)}
              >
                <Button
                  variant="danger"
                  type="submit"
                  disabled={!matches || submitting}
                >
                  {submitting ? "Deleting…" : "Permanently delete"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
