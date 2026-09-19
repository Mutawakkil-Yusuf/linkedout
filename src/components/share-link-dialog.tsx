"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useEffect, useState } from "react";
import { Link2, Copy, Check, X as XIcon } from "lucide-react";
import { createShareLink, revokeShareLink } from "@/lib/actions/rooms";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast-provider";
import { ActionButton } from "@/components/ui/action-button";

type LinkStat = {
  link_id: string;
  token: string;
  created_by: string;
  created_at: string;
  revoked_at: string | null;
  use_count: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  slug: string;
};

export function ShareLinkDialog({ open, onClose, roomId, slug }: Props) {
  const toast = useToast();
  const [links, setLinks] = useState<LinkStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .rpc("room_share_link_stats", { p_room: roomId })
      .then(({ data }) => {
        const rows = (data as LinkStat[] | null) ?? [];
        setLinks(rows.filter((l) => !l.revoked_at));
        setLoading(false);
      });
  }, [open, roomId]);

  if (!open) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const urlFor = (token: string) => `${origin}/join/${token}`;

  async function onCreate() {
    const res = await createShareLink({ roomId, slug });
    if (!res.ok) { toast(res.error, "error"); throw new Error(res.error); }
    setLinks((prev) => [
      { link_id: res.token, token: res.token, created_by: "", created_at: new Date().toISOString(), revoked_at: null, use_count: 0 },
      ...prev,
    ]);
    toast("Link created.", "success");
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(urlFor(token));
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 1600);
    } catch {
      toast("Couldn't copy. Long-press the link instead.", "error");
    }
  }

  async function revoke(linkId: string) {
    const res = await revokeShareLink({ linkId, slug });
    if (!res.ok) { toast(res.error, "error"); return; }
    setLinks((prev) => prev.filter((l) => l.link_id !== linkId));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="w-full max-w-[28rem] rounded-t-[1.5rem] border border-line bg-card p-6 sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[1.15rem] font-bold tracking-[-0.02em]">Share #{slug}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-paper-2 hover:text-ink">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 text-[0.88rem] leading-relaxed text-muted">
          Anyone with this link can join #{slug} — no invite needed. Good for posting
          on X, sending to a group chat, wherever.
        </p>

        {loading ? (
          <p className="py-4 text-center font-mono text-[0.8rem] text-muted">loading…</p>
        ) : (
          <div className="mb-4 space-y-2">
            {links.map((l) => (
              <div key={l.link_id} className="flex items-center gap-2 rounded-[10px] border border-line bg-paper px-3 py-2.5">
                <Link2 className="h-3.5 w-3.5 flex-none text-muted" />
                <span className="min-w-0 flex-1 truncate font-mono text-[0.78rem] text-ink-2">
                  {urlFor(l.token).replace(/^https?:\/\//, "")}
                </span>
                <span className="flex-none font-mono text-[0.7rem] text-muted">
                  {l.use_count} joined
                </span>
                <button
                  onClick={() => copy(l.token)}
                  className="flex-none rounded-full p-1.5 text-muted transition hover:bg-paper-2 hover:text-ink"
                  aria-label="Copy link"
                >
                  {copiedToken === l.token ? <Check className="h-3.5 w-3.5 text-flame" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => revoke(l.link_id)}
                  className="flex-none rounded-full p-1.5 text-muted transition hover:bg-flame/10 hover:text-flame-deep"
                  aria-label="Revoke link"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <ActionButton variant="fill" label="Create a new link" successLabel="Created" errorLabel="Try again" onPress={onCreate} />
      </div>
    </div>
  );
}
