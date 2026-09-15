"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";

type Props = {
  threadId: string;
  onSent: (m: { id: string; sender_id: string; body: string; created_at: string }) => void;
};

export function DmComposer({ threadId, onSent }: Props) {
  const toast = useToast();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [body]);

  async function submit() {
    const text = body.trim();
    if (!text || pending) return;
    setPending(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast("You've been signed out — refresh and try again.", "error"); setPending(false); return; }

    const { data, error } = await supabase
      .from("dm_messages")
      .insert({ thread_id: threadId, sender_id: user.id, body: text })
      .select("id, sender_id, body, created_at")
      .single();

    setPending(false);
    if (error || !data) { toast(error?.message ?? "Couldn't send that — try again.", "error"); return; }

    setBody("");
    onSent(data);
    requestAnimationFrame(() => ta.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const canSend = body.trim().length > 0 && !pending;

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={ta}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        maxLength={5000}
        placeholder="Write a message…"
        className="flex-1 resize-none rounded-2xl border border-line bg-card px-4 py-2.5 text-[0.95rem] leading-relaxed text-ink outline-none transition placeholder:text-muted focus:border-flame focus:ring-4 focus:ring-flame/10"
        style={{ minHeight: "2.5rem" }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        aria-label="Send"
        className={cn(
          "grid h-10 w-10 flex-none place-items-center rounded-full transition",
          canSend ? "bg-flame text-white hover:bg-flame-deep" : "bg-line text-muted"
        )}
      >
        <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
