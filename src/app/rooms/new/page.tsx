"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast-provider";
import { RoomVisibilityPicker, type Visibility } from "@/components/room-visibility-picker";
import { RoomAccentPicker } from "@/components/room-accent-picker";
import type { RoomAccent } from "@/lib/room-theme";

export default function NewRoomPage() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [accent, setAccent] = useState<RoomAccent>("flame");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const slug = String(fd.get("slug")).toLowerCase().trim();
    const name = String(fd.get("name")).trim();
    const description = String(fd.get("description") || "").trim() || null;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast("You've been signed out. Refresh and try again.", "error"); setPending(false); return; }

    const { data: room, error: rErr } = await supabase
      .from("rooms")
      .insert({ slug, name, description, visibility, accent, created_by: user.id })
      .select("id, slug")
      .single();
    if (rErr) { toast(rErr.message, "error"); setPending(false); return; }

    const { error: mErr } = await supabase
      .from("room_members")
      .insert({ room_id: room.id, user_id: user.id, role: "owner" });
    if (mErr) { toast(mErr.message, "error"); setPending(false); return; }

    toast(`#${room.slug} is open.`, "success");
    router.push(`/rooms/${room.slug}`);
  }

  return (
    <div className="pt-8">
      <h1 className="mb-6 font-display text-[1.6rem] font-bold tracking-[-0.025em]">Open a room</h1>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">slug</label>
          <Input name="slug" required placeholder="burnout" pattern="[a-z0-9-]+" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">name</label>
          <Input name="name" required placeholder="For people who are done performing employability." />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">description</label>
          <Textarea name="description" rows={3} placeholder="What is this room for?" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">accent</label>
          <RoomAccentPicker value={accent} onChange={setAccent} />
        </div>
        <div>
          <label className="mb-2 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">visibility</label>
          <RoomVisibilityPicker value={visibility} onChange={setVisibility} />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Opening…" : "Open the room"}</Button>
      </form>
    </div>
  );
}
