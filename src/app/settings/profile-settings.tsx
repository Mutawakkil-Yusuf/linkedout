"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "./profile-actions";

type Initial = { display_name: string | null; bio: string | null; now: string | null };

export function ProfileSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [now, setNow] = useState(initial.now ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dirty =
    displayName !== (initial.display_name ?? "") ||
    now !== (initial.now ?? "") ||
    bio !== (initial.bio ?? "");

  async function onSubmit(formData: FormData) {
    setPending(true); setErr(null); setSaved(false);
    const res = await updateProfile(formData);
    setPending(false);
    if (!res.ok) { setErr(res.error); return; }
    setSaved(true);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <Field label="right now" hint="optional · 140 chars">
        <Input name="now" maxLength={140} value={now} onChange={(e) => { setNow(e.target.value); setSaved(false); }} placeholder="Learning to sit still" />
      </Field>
      <Field label="display name" hint="optional">
        <Input name="display_name" maxLength={60} value={displayName} onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }} placeholder="M." />
      </Field>
      <Field label="bio" hint="optional · not your job">
        <Textarea name="bio" rows={3} maxLength={500} value={bio} onChange={(e) => { setBio(e.target.value); setSaved(false); }} placeholder="Into long walks, bad sci-fi, cooking for people I like." />
      </Field>
      <div className="flex items-center gap-3">
        <Button size="sm" type="submit" disabled={!dirty || pending}>{pending ? "Keeping…" : "Keep it"}</Button>
        {saved && <span className="font-mono text-[0.75rem] text-flame-deep">saved</span>}
        {err && <span className="text-sm text-flame-deep">{err}</span>}
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="font-mono text-[0.72rem] uppercase tracking-wider text-muted">{label}</label>
        {hint && <span className="font-mono text-[0.68rem] text-line-2">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
