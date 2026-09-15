// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lockup } from "@/components/logo";

export default function LogoutPage() {
  return (
    <div className="mx-auto max-w-[40rem] px-5 py-14">
      <header className="mb-12 flex items-center"><Lockup size={34} /></header>
      <h1 className="mb-3 font-display text-[2.25rem] font-bold leading-tight tracking-[-0.035em]">Leaving?</h1>
      <p className="mb-10 max-w-[30rem] text-[1rem] leading-relaxed text-muted">Signing out keeps your handle, your posts, and your rooms exactly as they are. Come back whenever you want.</p>
      <div className="flex flex-wrap items-center gap-3"><form action="/auth/signout" method="post"><Button type="submit">Sign out</Button></form><Link href="/rooms" className="inline-flex items-center justify-center rounded-full border border-line-2 bg-card px-5 py-2.5 text-[0.9rem] font-semibold text-ink transition hover:bg-paper-2">Stay here</Link></div>
    </div>
  );
}
