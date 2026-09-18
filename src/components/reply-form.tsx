"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";

import { cn } from "@/lib/utils";

type Variant = "inline" | "sheet";

export function ReplyForm({ postId, variant = "inline", onPosted }: { postId: string; variant?: Variant; onPosted?: () => void }) {
  const router = useRouter(); const toast = useToast(); const [body, setBody] = useState(""); const [pending, setPending] = useState(false);
  async function submit() {
    if (!body.trim()) return; setPending(true); const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast("You've been signed out. Refresh and try again.", "error"); setPending(false); return; }
    const { error } = await supabase.from("replies").insert({ post_id: postId, author_id: user.id, body: body.trim() });
    setPending(false);
    if (error) { toast(error.message, "error"); return; }
    setBody(""); toast("Reply posted.", "success"); onPosted?.(); router.refresh();
  }
  const isSheet = variant === "sheet";
  return <div className={cn(isSheet ? "flex flex-1 flex-col px-5 pt-4" : "mb-6 rounded-card border border-line bg-card p-4 transition-colors focus-within:border-flame")}><textarea rows={isSheet ? 6 : 2} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} placeholder="Say something back…" className={cn("w-full resize-none border-0 bg-transparent text-ink outline-none placeholder:text-muted", isSheet ? "flex-1 text-[1rem] leading-[1.65]" : "text-[1rem] leading-relaxed")} style={{ minHeight: isSheet ? "9rem" : "2.5rem" }} /><div className={cn("mt-1.5 flex items-center justify-between border-t border-line pt-2.5", isSheet && "mt-4 pb-5 pt-4")}><span className="font-mono text-[0.72rem] text-muted">{body.length} / 5000</span><Button size="sm" onClick={submit} disabled={pending || !body.trim()}>Reply</Button></div></div>;
}
