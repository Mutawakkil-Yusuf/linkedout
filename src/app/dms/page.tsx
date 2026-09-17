"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { MarkLoader } from "@/components/mark-loader";
import { relativeTime } from "@/lib/utils";
import type { AvatarStyle } from "@/lib/avatar";

type Row = {
  thread_id: string;
  other_user_id: string;
  other_handle: string;
  other_display_name: string | null;
  other_avatar_style: AvatarStyle | null;
  other_avatar_seed: string | null;
  last_body: string | null;
  last_sender_id: string | null;
  last_at: string;
};

export default function DmsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setMeId(user?.id ?? null);

      const { data } = await supabase.rpc("list_my_dm_threads");
      if (cancelled) return;
      setRows((data as Row[]) ?? []);
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="pt-8">
      <header className="mb-6">
        <h1 className="font-display text-[1.6rem] font-bold tracking-[-0.025em]">Messages</h1>
        <p className="mt-1 text-[0.9rem] text-muted">
          Only with people you share a room with.
        </p>
      </header>

      {rows === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <MarkLoader size={48} phase="breathing" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-8 text-center">
          <p className="text-[0.95rem] text-muted">Quiet in here. Say something to someone.</p>
          <p className="mt-1 text-[0.85rem] text-line-2">
            You can message anyone you share a room with.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-card">
          {rows.map((r) => {
            const preview = r.last_body
              ? r.last_body.length > 80
                ? r.last_body.slice(0, 80) + "…"
                : r.last_body
              : "No messages yet";
            const fromMe = r.last_sender_id && r.last_sender_id === meId;

            return (
              <li key={r.thread_id}>
                <Link
                  href={`/dms/${r.thread_id}`}
                  className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-paper-2"
                >
                  <Avatar
                    handle={r.other_handle}
                    avatarStyle={r.other_avatar_style}
                    avatarSeed={r.other_avatar_seed}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-[0.95rem] font-semibold text-ink">
                        {r.other_display_name ?? r.other_handle}
                      </span>
                      <span className="font-mono text-[0.72rem] text-muted">
                        @{r.other_handle}
                      </span>
                      <time className="ml-auto flex-none font-mono text-[0.72rem] text-muted">
                        {relativeTime(r.last_at)}
                      </time>
                    </div>
                    <p className="mt-0.5 truncate text-[0.88rem] text-muted">
                      {fromMe && <span className="text-line-2">you: </span>}
                      {preview}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
