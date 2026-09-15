// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: rooms } = await supabase.from("rooms").select("id, slug, name, description").eq("visibility", "public").order("created_at", { ascending: false });
  return (
    <div className="pt-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-[1.6rem] font-bold tracking-[-0.025em]">Rooms</h1><Link href="/rooms/new" className="rounded-full bg-flame px-4 py-2 text-[0.82rem] font-semibold text-white transition hover:bg-flame-deep">+ New room</Link></header>
      <ul className="space-y-2.5">
        {rooms?.length ? rooms.map((r) => <li key={r.id}><Link href={`/rooms/${r.slug}`} className="block min-w-0 rounded-card border border-line bg-card p-5 transition hover:border-line-2"><div className="flex min-w-0 items-center gap-2"><span className="flex-none font-mono text-flame">#</span><span className="break-words font-display text-[1.05rem] font-bold tracking-[-0.02em]">{r.slug}</span></div><p className="mt-0.5 text-[0.9rem] text-muted">{r.name}</p>{r.description && <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2">{r.description}</p>}</Link></li>) :
        <li className="rounded-card border border-line bg-card p-6 text-center text-[0.95rem] text-muted">No rooms yet. Be the first to start one.</li>}
      </ul>
    </div>
  );
}
