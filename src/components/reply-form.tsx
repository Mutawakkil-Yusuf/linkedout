"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ReplyForm({ postId }: { postId: string }) {
  const router = useRouter(); const [body, setBody] = useState(""); const [pending, setPending] = useState(false);
  async function submit() {
    if (!body.trim()) return; setPending(true); const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { setPending(false); return; }
    const { error } = await supabase.from("replies").insert({ post_id: postId, author_id: user.id, body: body.trim() });
    if (error) { setPending(false); return; } setBody(""); setPending(false); router.refresh();
  }
  return <div className="mb-6 rounded-card border border-line bg-card p-4 transition-colors focus-within:border-flame"><textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} placeholder="Say something back…" className="w-full resize-none border-0 bg-transparent text-[1rem] leading-relaxed text-ink outline-none placeholder:text-muted" style={{ minHeight: "2.5rem" }} /><div className="mt-1.5 flex items-center justify-between border-t border-line pt-2.5"><span className="font-mono text-[0.72rem] text-muted">{body.length} / 5000</span><Button size="sm" onClick={submit} disabled={pending || !body.trim()}>Reply</Button></div></div>;
}
