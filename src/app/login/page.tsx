"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Lockup } from "@/components/logo";
import { ActionButton } from "@/components/ui/action-button";

// OTP code instead of a magic link on purpose: a clickable email link
// goes through the sender's click-tracking redirect (e.g. Brevo rewrites
// it to a sendibt2.com URL), which can drop the auth `code` param or
// fail to forward correctly. Even when it works, the link always
// opens in the system browser, not an installed home-screen PWA, which
// never sees the resulting session. A typed code has neither problem:
// nothing to rewrite, nothing to hand off, session lands directly in
// whichever context the person is already using.
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?next=/join/abc123 — where to send someone after they sign in or
  // finish onboarding. Only ever an internal path (checked below), so
  // this can't be turned into an open redirect.
  const rawNext = searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendCode() {
    setErr(null);
    const supabase = createClient();
    // No emailRedirectTo: this makes Supabase send the 6-digit token in
    // the email body instead of a clickable magic-link URL.
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) { setErr(error.message); throw error; }
    setSent(true);
  }

  async function verifyCode() {
    setErr(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) { setErr(error.message); throw error; }
    const user = data.user;
    if (!user) { setErr("Something went wrong. Try again."); throw new Error("no user"); }
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (!profile) {
      router.replace(next ? `/onboard?next=${encodeURIComponent(next)}` : "/onboard");
      return;
    }
    router.replace(next ?? "/rooms");
  }

  return (
    <div className="mx-auto max-w-[40rem] px-5 py-14">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-3"><Link href="/"><Lockup size={34} /></Link><Link href="/" className="font-mono text-[0.75rem] text-muted underline decoration-line underline-offset-4 hover:text-ink">← back</Link></header>
      <h1 className="mb-3 font-display text-[2.25rem] font-bold leading-tight tracking-[-0.035em]">Enter LinkedOut</h1>
      <p className="mb-10 max-w-[30rem] text-[1rem] leading-relaxed text-muted">No password. Email is used only to sign you in and is never shown to anyone, ever.</p>
      {sent ? (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="rounded-card border border-flame/20 bg-flame/5 p-5">
            <p className="mb-1 font-display text-[1.05rem] font-bold tracking-[-0.02em] text-flame-deep">Check your inbox</p>
            <p className="break-words text-[0.95rem] text-ink-2">We sent a 6-digit code to <span className="font-mono">{email}</span>. It expires in about an hour.</p>
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">code</label>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="font-mono tracking-[0.3em]"
            />
          </div>
          <ActionButton variant="slot" type="submit" label="That's the one →" successLabel="Signed in" errorLabel="Try again" onPress={verifyCode} disabled={code.length !== 6} />
          <button type="button" onClick={() => { setSent(false); setCode(""); setErr(null); }} className="block font-mono text-[0.75rem] text-muted underline decoration-line underline-offset-4 hover:text-ink">
            use a different email
          </button>
          {err && <p className="text-sm text-flame-deep">{err}</p>}
        </form>
      ) : (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4"><div><label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">email</label><Input type="email" required autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div><ActionButton variant="slot" type="submit" label="Get me in" successLabel="Code sent" errorLabel="Try again" onPress={sendCode} disabled={!email} />{err && <p className="text-sm text-flame-deep">{err}</p>}</form>
      )}
      <p className="mt-16 border-t border-line pt-6 font-mono text-[0.72rem] text-muted">by entering you agree to be a person here, not a profile.</p>
    </div>
  );
}
