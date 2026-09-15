// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { Lockup } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[36rem] flex-col justify-center px-5 py-14">
      <div className="mb-10"><Lockup size={30} /></div>
      <p className="mb-4 font-mono text-[0.75rem] uppercase tracking-[0.15em] text-flame-deep">404</p>
      <h1 className="mb-4 font-display text-[2rem] font-bold leading-tight tracking-[-0.03em] sm:text-[2.4rem]">
        Nothing's here.
      </h1>
      <p className="mb-10 max-w-[28rem] text-[1.05rem] leading-relaxed text-ink-2">
        No room, post, or person at this address. It may have moved, been deleted, or never existed — the URL doesn't say which.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/rooms" className="inline-flex items-center justify-center rounded-full bg-flame px-6 py-3 text-[0.95rem] font-semibold text-white transition hover:bg-flame-deep">
          Back to your rooms
        </Link>
        <Link href="/" className="inline-flex items-center justify-center rounded-full border border-line-2 bg-card px-6 py-3 text-[0.95rem] font-semibold text-ink transition hover:bg-paper-2">
          Start over
        </Link>
      </div>
    </div>
  );
}
