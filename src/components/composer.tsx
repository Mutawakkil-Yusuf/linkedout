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

type Variant = "inline" | "sheet";

export function Composer({
  roomId,
  variant = "inline",
  onPosted,
}: {
  roomId: string | null;
  /** "sheet" drops the card chrome and grows to fill its container, for use inside BottomSheet. Default "inline" is unchanged. */
  variant?: Variant;
  /** Called after a successful post, in addition to the existing toast + router.refresh(). Used to close the sheet on mobile. */
  onPosted?: () => void;
}) {
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
    if (!user) { toast("You've been signed out. Refresh and try again.", "error"); setPending(false); return; }
    const { error } = await supabase
      .from("posts")
      .insert({ author_id: user.id, room_id: roomId, body: body.trim(), mode });
    setPending(false);
    if (error) { toast(error.message, "error"); return; }
    setBody("");
    setMode("normal");
    toast("Posted.", "success");
    onPosted?.();
    router.refresh();
  }

  const isSheet = variant === "sheet";

  return (
    <div
      className={cn(
        isSheet
          ? "flex flex-1 flex-col px-5 pt-4"
          : "mb-6 rounded-card border border-line bg-card px-4 pb-3 pt-4 transition-colors"
      )}
      style={!isSheet ? { borderColor: body ? "var(--room-accent, #e8571f)" : undefined } : undefined}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={isSheet ? 6 : 2}
        maxLength={5000}
        placeholder="Say something. It’s just people here."
        className={cn(
          "w-full resize-none border-0 bg-transparent text-ink outline-none placeholder:text-muted",
          isSheet ? "flex-1 text-[1rem] leading-[1.65]" : "text-[1rem] leading-relaxed"
        )}
        style={{ minHeight: isSheet ? "9rem" : "3rem" }}
      />

      <div className={cn("mt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5", isSheet && "mt-4 pb-5 pt-4")}>
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
