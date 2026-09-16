"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { sendInvite } from "@/lib/actions/rooms";
import { useToast } from "@/components/toast-provider";

type Candidate = { id: string; handle: string; display_name: string | null };

type Props = {
  open: boolean;
  onClose: () => void;
  roomId: string;
};

export function InviteDialog({ open, onClose, roomId }: Props) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); setSentTo(new Set()); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }

    const handle = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      // RLS (profiles_shared_read) already restricts this to people who
      // share a room, DM thread, or post context with the current user —
      // this is not an open directory search, matching the app's
      // no-stranger-contact design (see room_invites migration notes).
      const { data } = await supabase
        .from("profiles")
        .select("id, handle, display_name")
        .ilike("handle", `%${q}%`)
        .limit(8);
      setResults((data ?? []) as Candidate[]);
      setSearching(false);
    }, 250);

    return () => clearTimeout(handle);
  }, [query, open]);

  if (!open) return null;

  async function invite(c: Candidate) {
    const res = await sendInvite({ roomId, inviteeId: c.id });
    if (!res.ok) { toast(res.error, "error"); return; }
    setSentTo((prev) => new Set(prev).add(c.id));
    toast(`Invited @${c.handle}.`, "success");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <div
        className="w-full max-w-md rounded-t-card bg-card p-5 shadow-card sm:rounded-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
      >
        <h2 id="invite-title" className="mb-1 font-display text-[1.15rem] font-bold tracking-[-0.02em]">
          Invite to this room
        </h2>
        <p className="mb-4 text-[0.88rem] leading-relaxed text-muted">
          You can invite people you already share a room, DM, or thread with.
          There's no open directory — this isn't a way to reach strangers.
        </p>

        <div className="relative mb-3">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by handle…"
            autoFocus
            className="w-full rounded-full border border-line bg-paper py-2 pl-9 pr-3 text-[0.9rem] outline-none transition placeholder:text-muted focus:border-flame focus:ring-4 focus:ring-flame/10"
          />
        </div>

        <div className="mb-5 max-h-64 overflow-y-auto">
          {searching && (
            <p className="px-1 py-3 text-center font-mono text-[0.78rem] text-muted">searching…</p>
          )}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-1 py-3 text-center text-[0.85rem] text-muted">
              No one found. You can only invite people you already share context with.
            </p>
          )}
          {!searching && results.length > 0 && (
            <ul className="divide-y divide-line rounded-soft border border-line">
              {results.map((c) => {
                const sent = sentTo.has(c.id);
                return (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar handle={c.handle} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.9rem] font-medium">{c.display_name ?? c.handle}</div>
                      <div className="font-mono text-[0.72rem] text-muted">@{c.handle}</div>
                    </div>
                    <button
                      type="button"
                      disabled={sent}
                      onClick={() => invite(c)}
                      className="flex-none rounded-full border border-line-2 bg-card px-3 py-1.5 text-[0.78rem] font-medium text-ink transition hover:bg-paper-2 disabled:cursor-default disabled:opacity-50"
                    >
                      {sent ? "Invited" : "Invite"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[0.85rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
