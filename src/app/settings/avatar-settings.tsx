"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AvatarPicker } from "@/components/avatar-picker";
import type { AvatarChoice } from "@/lib/avatar";

export function AvatarSettingsForm({ initial }: { initial: AvatarChoice | null }) {
  const router = useRouter();
  const [choice, setChoice] = useState<AvatarChoice | null>(initial);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!choice) return;
    setPending(true); setErr(null); setSaved(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("You've been signed out — refresh and try again."); setPending(false); return; }
    const { error } = await supabase.from("profiles")
      .update({ avatar_style: choice.style, avatar_seed: choice.seed }).eq("id", user.id);
    setPending(false);
    if (error) { setErr(error.message); return; }
    setSaved(true);
    router.refresh();
  }

  const dirty = choice && (choice.style !== initial?.style || choice.seed !== initial?.seed);

  return (
    <div>
      <AvatarPicker initial={initial} onChange={(c) => { setChoice(c); setSaved(false); }} />
      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={!dirty || pending}>{pending ? "Saving…" : "Save avatar"}</Button>
        {saved && <span className="font-mono text-[0.75rem] text-flame-deep">saved</span>}
        {err && <span className="text-sm text-flame-deep">{err}</span>}
      </div>
    </div>
  );
}
