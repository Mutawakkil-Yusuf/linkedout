"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

type Mode = "normal" | "spoiler" | "quiet";

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "normal", label: "normal", hint: "A regular post." },
  { value: "spoiler", label: "spoiler", hint: "Hidden until clicked. For sensitive posts." },
  { value: "quiet", label: "quiet", hint: "Doesn't bump the room. Doesn't notify anyone." },
];

export function Composer({ roomId }: { roomId: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<Mode>("normal");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setPending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast("You've been signed out — refresh and try again.", "error"); setPending(false); return; }
    const { error } = await supabase
      .from("posts")
      .insert({ author_id: user.id, room_id: roomId, body: body.trim(), mode });
    setPending(false);
    if (error) { toast(error.message, "error"); return; }
    setBody("");
    setMode("normal");
    toast("Posted.", "success");
    router.refresh();
  }

  return (
    <div
      className="mb-6 rounded-card border border-line bg-card px-4 pb-3 pt-4 transition-colors"
      style={{ borderColor: body ? "var(--room-accent, #e8571f)" : undefined }}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        maxLength={5000}
        placeholder="Say something. It’s just people here."
        className="w-full resize-none border-0 bg-transparent text-[1rem] leading-relaxed text-ink outline-none placeholder:text-muted"
        style={{ minHeight: "3rem" }}
      />

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <span className="font-mono text-[0.72rem] text-muted">{body.length} / 5000</span>

        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                title={m.hint}
                className={cn(
                  "rounded-[6px] px-2 py-1 font-mono text-[0.66rem] uppercase tracking-[0.08em] transition",
                  mode === m.value
                    ? "text-ink"
                    : "text-muted hover:bg-paper-2 hover:text-ink"
                )}
                style={mode === m.value ? { background: "var(--room-accent-bg, rgba(232, 87, 31, 0.07))" } : undefined}
              >
                {m.label}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={submit} disabled={pending || !body.trim()}>
            {pending ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}
