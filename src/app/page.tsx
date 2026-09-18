// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { Lockup } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58l-.01-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.93.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.6 10.6 20.7 3h-2.1l-5.6 6.6L8.6 3H3l7.4 10.4L3 21h2.1l6-7 5.6 7h5.6l-7.6-10.4Zm-2.2 2.6-.7-.97L5.2 4.6h2.4l4.5 6.2.7.97 5.9 8.2h-2.4l-4.9-6.8Z" />
    </svg>
  );
}

function InstagramMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.98c-3.15 0-3.5.01-4.73.07-.97.04-1.5.2-1.85.34-.46.18-.79.4-1.14.74-.34.35-.56.68-.74 1.14-.14.35-.3.88-.34 1.85-.06 1.23-.07 1.58-.07 4.73s.01 3.5.07 4.73c.04.97.2 1.5.34 1.85.18.46.4.79.74 1.14.35.34.68.56 1.14.74.35.14.88.3 1.85.34 1.23.06 1.58.07 4.73.07s3.5-.01 4.73-.07c.97-.04 1.5-.2 1.85-.34.46-.18.79-.4 1.14-.74.34-.35.56-.68.74-1.14.14-.35.3-.88.34-1.85.06-1.23.07-1.58.07-4.73s-.01-3.5-.07-4.73c-.04-.97-.2-1.5-.34-1.85a3.06 3.06 0 0 0-.74-1.14 3.06 3.06 0 0 0-1.14-.74c-.35-.14-.88-.3-1.85-.34-1.23-.06-1.58-.07-4.73-.07Zm0 3.37a4.45 4.45 0 1 1 0 8.9 4.45 4.45 0 0 1 0-8.9Zm0 1.98a2.47 2.47 0 1 0 0 4.94 2.47 2.47 0 0 0 0-4.94Zm4.62-2.2a1.04 1.04 0 1 1 0 2.08 1.04 1.04 0 0 1 0-2.08Z" />
    </svg>
  );
}

export default async function Landing() {
  const supabase = await createClient();
  const { data: rooms } = await supabase.from("rooms")
    .select("slug, name, description").eq("visibility", "public")
    .order("created_at", { ascending: false }).limit(4);

  return (
    <div className="mx-auto max-w-[44rem] px-5 py-14">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Lockup size={34} />
        <Link href="/login" className="font-mono text-[0.78rem] text-muted underline decoration-line underline-offset-4 hover:text-ink">
          already have a handle? sign in
        </Link>
      </header>
      <section className="pt-20 pb-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-[10px] bg-flame/10 px-3 py-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.1em] text-flame-deep">
          an open source project
        </div>
        <h1 className="mb-6 font-display text-[2.15rem] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.04] lg:text-[3.15rem] lg:leading-[1.02] lg:tracking-[-0.04em]">
          LinkedIn, but built <span className="relative inline-block text-flame">backwards
            <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-[0.35em] w-full" aria-hidden="true">
              <path d="M4 9 Q 40 3, 80 7 T 150 5 T 196 8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>{" "}on purpose.
        </h1>
        <p className="mb-10 max-w-[34rem] text-[1.125rem] leading-relaxed text-ink-2">
          No résumé, no recruiter search, no follower count deciding who gets heard. Just rooms, a plain newest-first feed, and a fake name if you want one. Nobody checks.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-flame px-6 py-3 text-[0.95rem] font-semibold text-white transition hover:bg-flame-deep">Get a handle →</Link>
          <Link href="#rooms" className="inline-flex items-center justify-center rounded-full border border-line-2 bg-card px-6 py-3 text-[0.95rem] font-semibold text-ink transition hover:bg-paper-2">See the rooms</Link>
        </div>
      </section>
      <section className="border-y border-line py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div><p className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.15em] text-flame-deep">What LinkedIn is</p>
            <p className="text-[1.02rem] leading-relaxed text-ink-2">A labor market database with a feed on top. You are the inventory, searchable and contactable by whoever pays.</p></div>
          <div><p className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.15em] text-flame-deep">What LinkedOut is</p>
            <p className="text-[1.02rem] leading-relaxed text-ink-2">The opposite. Rooms instead of connections. Newest first, no algorithm deciding what you see. Fake names welcome. Not searchable by employers. Ever.</p></div>
          <div><p className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.15em] text-flame-deep">What "trust us" is</p>
            <p className="text-[1.02rem] leading-relaxed text-ink-2">Every social network tells you it has your back. You have no way to check. Here you don't have to take my word for it. Read the code, fork it, run your own copy.</p></div>
        </div>
      </section>
      <section id="rooms" className="py-16">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-[1.5rem] font-bold tracking-[-0.025em]">Rooms you can walk into</h2>
          <span className="font-mono text-[0.72rem] text-muted">public · no signup to peek</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {rooms?.length ? rooms.map((r) => (
            <div key={r.slug} className="min-w-0 rounded-card border border-line bg-card p-5">
              <div className="mb-1 flex min-w-0 items-center gap-2"><span className="flex-none font-mono text-flame">#</span><span className="break-words font-display text-[1.05rem] font-bold tracking-[-0.02em]">{r.slug}</span></div>
              <p className="text-[0.88rem] text-muted">{r.name}</p>
              {r.description && <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2">{r.description}</p>}
            </div>
          )) : [
            { slug: "burnout", name: "For people done performing employability", desc: "Rest, recovery, stepping back." },
            { slug: "caregiving", name: "For people who take care of others", desc: "The unpaid work nobody sees." },
            { slug: "slow-web", name: "For people who make quiet things", desc: "Small sites, zines, letters, gardens." },
            { slug: "between-jobs", name: "Not between anything", desc: "For anyone who has stopped explaining themselves." },
          ].map((r) => (
            <div key={r.slug} className="min-w-0 rounded-card border border-line bg-card p-5">
              <div className="mb-1 flex min-w-0 items-center gap-2"><span className="flex-none font-mono text-flame">#</span><span className="break-words font-display text-[1.05rem] font-bold tracking-[-0.02em]">{r.slug}</span></div>
              <p className="text-[0.88rem] text-muted">{r.name}</p><p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t border-line pt-14">
        <h2 className="mb-6 max-w-[28rem] font-display text-[1.6rem] font-bold leading-[1.15] tracking-[-0.025em] sm:text-[2rem] sm:leading-[1.1] sm:tracking-[-0.03em]">You are not inventory. Come be a person for a while.</h2>
        <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-flame px-6 py-3 text-[0.95rem] font-semibold text-white transition hover:bg-flame-deep">Pick a handle →</Link>
      </section>
      <footer className="mt-20 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-6 font-mono text-[0.72rem] text-muted">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>AGPL-3.0</span><span className="text-line-2">·</span><span>self-hostable</span><span className="text-line-2">·</span><span>no ads</span><span className="text-line-2">·</span><span>no recruiter search</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/rooms/wall" className="inline-flex items-center gap-1.5 text-muted transition hover:text-ink">
            browse rooms
          </Link>
          <a
            href="https://github.com/Mutawakkil-Yusuf/linkedout"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted transition hover:text-ink"
          >
            <GithubMark className="h-[0.95rem] w-[0.95rem]" /> source
          </a>
          <a
            href="https://www.linkedin.com/in/mutawakkil-yusuf-31351b1b5"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-muted transition hover:text-ink"
          >
            <LinkedInMark className="h-[0.95rem] w-[0.95rem]" />
          </a>
          <a
            href="https://x.com/itsmutawakkil"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className="text-muted transition hover:text-ink"
          >
            <XMark className="h-[0.95rem] w-[0.95rem]" />
          </a>
          <a
            href="https://www.instagram.com/itsmutawakkil"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-muted transition hover:text-ink"
          >
            <InstagramMark className="h-[0.95rem] w-[0.95rem]" />
          </a>
        </div>
      </footer>
    </div>
  );
}
