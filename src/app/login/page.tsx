"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Lockup } from "@/components/logo";
import { ActionButton } from "@/components/ui/action-button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendLink() {
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
    });
    if (error) { setErr(error.message); throw error; }
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-[40rem] px-5 py-14">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-3"><Link href="/"><Lockup size={34} /></Link><Link href="/" className="font-mono text-[0.75rem] text-muted underline decoration-line underline-offset-4 hover:text-ink">← back</Link></header>
      <h1 className="mb-3 font-display text-[2.25rem] font-bold leading-tight tracking-[-0.035em]">Enter LinkedOut</h1>
      <p className="mb-10 max-w-[30rem] text-[1rem] leading-relaxed text-muted">No password. Email is used only to sign you in and is never shown to anyone, ever.</p>
      {sent ? <div className="rounded-card border border-flame/20 bg-flame/5 p-5"><p className="mb-1 font-display text-[1.05rem] font-bold tracking-[-0.02em] text-flame-deep">Check your inbox</p><p className="break-words text-[0.95rem] text-ink-2">We sent a sign-in link to <span className="font-mono">{email}</span>. It expires in about an hour.</p></div> :
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4"><div><label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">email</label><Input type="email" required autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div><ActionButton variant="slot" type="submit" label="Send magic link" successLabel="Link sent" errorLabel="Try again" onPress={sendLink} disabled={!email} />{err && <p className="text-sm text-flame-deep">{err}</p>}</form>}
      <p className="mt-16 border-t border-line pt-6 font-mono text-[0.72rem] text-muted">by entering you agree to be a person here, not a profile.</p>
    </div>
  );
}
