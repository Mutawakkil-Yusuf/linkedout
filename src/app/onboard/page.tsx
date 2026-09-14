"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Lockup } from "@/components/logo";
import { createProfile } from "./actions";

export default function OnboardPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(formData: FormData) {
    setPending(true); setError(null);
    const res = await createProfile(formData);
    if (res?.error) { setError(res.error); setPending(false); }
  }
  return (
    <div className="mx-auto max-w-[40rem] px-4 py-10 sm:px-5 sm:py-14">
      <header className="mb-10 flex items-center sm:mb-12"><Lockup size={34} /></header>
      <h1 className="mb-3 font-display text-[1.9rem] font-bold leading-tight tracking-[-0.03em] sm:text-[2.25rem] sm:tracking-[-0.035em]">Pick a handle</h1>
      <p className="mb-10 max-w-[32rem] text-[1rem] leading-relaxed text-muted">This is how people find you here. Real name is optional. Don’t use your work identity.</p>
      <form action={onSubmit} className="space-y-5">
        <Field label="handle" hint="3–24 chars, a–z, 0–9, underscore"><Input name="handle" required placeholder="quiet_forest" autoFocus /></Field>
        <Field label="right now" hint="optional · 140 chars"><Input name="now" maxLength={140} placeholder="Learning to sit still" /></Field>
        <Field label="display name" hint="optional"><Input name="display_name" placeholder="M." /></Field>
        <Field label="bio" hint="optional · not your job"><Textarea name="bio" rows={3} placeholder="Into long walks, bad sci-fi, cooking for people I like." /></Field>
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create profile"}</Button>
        {error && <p className="text-sm text-flame-deep">{error}</p>}
      </form>
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div><div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"><label className="font-mono text-[0.72rem] uppercase tracking-wider text-muted">{label}</label>{hint && <span className="font-mono text-[0.68rem] text-line-2">{hint}</span>}</div>{children}</div>;
}
