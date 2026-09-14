"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function Composer({ roomId }: { roomId: string | null }) {
  const router = useRouter(); const [body, setBody] = useState(""); const [pending, setPending] = useState(false); const [err, setErr] = useState<string | null>(null);
  async function submit() {
    if (!body.trim()) return; setPending(true); setErr(null);
    const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("You've been signed out — refresh and try again."); setPending(false); return; }
    const { error } = await supabase.from("posts").insert({ author_id: user.id, room_id: roomId, body: body.trim() });
    setPending(false); if (error) { setErr(error.message); return; } setBody(""); router.refresh();
  }
  return <div className="mb-6 rounded-card border border-line bg-card p-4 transition-colors focus-within:border-flame">
    <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={5000} placeholder="Say something. It’s just people here." className="w-full resize-none border-0 bg-transparent text-[1rem] leading-relaxed text-ink outline-none placeholder:text-muted" style={{ minHeight: "3rem" }} />
    <div className="mt-1.5 flex items-center justify-between border-t border-line pt-2.5"><span className="font-mono text-[0.72rem] text-muted">{body.length} / 5000</span><Button size="sm" onClick={submit} disabled={pending || !body.trim()}>{pending ? "Posting…" : "Post"}</Button></div>
    {err && <p className="mt-2 text-sm text-flame-deep">{err}</p>}
  </div>;
}
