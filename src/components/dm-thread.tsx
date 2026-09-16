"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { DmComposer } from "@/components/dm-composer";
import { createClient } from "@/lib/supabase/client";
import { cn, fmtDate } from "@/lib/utils";
import type { AvatarStyle } from "@/lib/avatar";

type User = {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_style?: AvatarStyle | null;
  avatar_seed?: string | null;
};
type Message = { id: string; sender_id: string; body: string; created_at: string };

type Props = {
  threadId: string;
  me: User;
  other: User;
  initialMessages: Message[];
};

export function DmThread({ threadId, me, other, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);

  const listEnd = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setAtBottom(entry.isIntersecting);
        if (entry.isIntersecting) setNewCount(0);
      },
      { threshold: 0, rootMargin: "0px 0px 60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dm:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== me.id && !atBottom) setNewCount((c) => c + 1);
          if (m.sender_id !== me.id && atBottom) {
            requestAnimationFrame(() =>
              listEnd.current?.scrollIntoView({ behavior: "smooth" })
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [threadId, me.id, atBottom]);

  function onSent(m: Message) {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    requestAnimationFrame(() =>
      listEnd.current?.scrollIntoView({ behavior: "smooth" })
    );
  }

  function jumpToBottom() {
    setNewCount(0);
    listEnd.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="pt-6">
      <header className="mb-4 flex items-center gap-3 border-b border-line pb-4">
        <Link
          href="/dms"
          aria-label="Back to inbox"
          className="flex-none rounded-full p-1.5 -ml-1.5 text-muted transition hover:bg-paper-2 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        </Link>
        <Link href={`/u/${other.handle}`} className="group flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar handle={other.handle} avatarStyle={other.avatar_style} avatarSeed={other.avatar_seed} size="sm" />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[0.9rem] font-semibold text-ink group-hover:text-flame">
              {other.display_name ?? other.handle}
            </div>
            <div className="font-mono text-[0.72rem] text-muted">@{other.handle}</div>
          </div>
        </Link>
      </header>

      <div className="space-y-3 pb-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Avatar handle={other.handle} avatarStyle={other.avatar_style} avatarSeed={other.avatar_seed} size="lg" />
            <p className="mt-2 text-[0.95rem] font-medium text-ink">
              {other.display_name ?? other.handle}
            </p>
            <p className="text-[0.85rem] text-muted">Say hi. No pressure.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const mine = m.sender_id === me.id;
            const grouped =
              !!prev &&
              prev.sender_id === m.sender_id &&
              new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() <
                5 * 60 * 1000;
            const author = mine ? me : other;

            return (
              <div
                key={m.id}
                className={cn("flex gap-2.5", mine ? "flex-row-reverse" : "flex-row")}
              >
                <div className="w-8 flex-none">
                  {!grouped && (
                    <Avatar
                      handle={author.handle}
                      avatarStyle={author.avatar_style}
                      avatarSeed={author.avatar_seed}
                      size="sm"
                    />
                  )}
                </div>
                <div className={cn("flex max-w-[78%] flex-col", mine ? "items-end" : "items-start")}>
                  {!grouped && (
                    <div className={cn("mb-1 flex items-center gap-2", mine && "flex-row-reverse")}>
                      <span className="font-mono text-[0.72rem] text-muted">
                        @{author.handle}
                      </span>
                      <time className="font-mono text-[0.68rem] text-line-2">
                        {fmtDate(m.created_at)}
                      </time>
                    </div>
                  )}
                  <div
                    className={cn(
                      "whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[0.95rem] leading-relaxed",
                      mine
                        ? "rounded-br-md bg-flame text-white"
                        : "rounded-bl-md border border-line bg-card text-ink"
                    )}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={sentinel} className="h-1 w-full" />
        <div ref={listEnd} />
      </div>

      <div className="sticky bottom-0 -mx-5 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur-md lg:-mx-10 lg:px-10">
        {!atBottom && newCount > 0 && (
          <button
            type="button"
            onClick={jumpToBottom}
            className="absolute -top-12 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[0.78rem] font-medium text-paper shadow-card transition hover:bg-ink/90"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {newCount} new
          </button>
        )}
        <DmComposer threadId={threadId} onSent={onSent} />
      </div>
    </div>
  );
}
