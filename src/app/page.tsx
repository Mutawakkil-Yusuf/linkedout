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

export default async function Landing() {
  const supabase = await createClient();
  const { data: rooms } = await supabase.from("rooms")
    .select("slug, name, description").eq("visibility", "public")
    .order("created_at", { ascending: false }).limit(4);

  return (
    <div className="mx-auto max-w-[44rem] px-5 py-14">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Lockup size={34} />
        <div className="flex items-center gap-4">
          <Link href="/login" className="font-mono text-[0.78rem] text-muted underline decoration-line underline-offset-4 hover:text-ink">
            already have a handle? sign in
          </Link>
          <a
            href="https://github.com/Mutawakkil-Yusuf/linkedout"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="grid h-8 w-8 flex-none place-items-center rounded-full text-muted transition hover:bg-paper-2 hover:text-ink"
          >
            <GithubMark className="h-[1.05rem] w-[1.05rem]" />
          </a>
        </div>
      </header>
      <section className="pt-20 pb-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-[10px] bg-flame/10 px-3 py-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.1em] text-flame-deep">
          You’re not for sale
        </div>
        <h1 className="mb-6 font-display text-[2.15rem] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.04] lg:text-[3.15rem] lg:leading-[1.02] lg:tracking-[-0.04em]">
          A social place where you <span className="relative inline-block text-flame">can’t
            <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-[0.35em] w-full" aria-hidden="true">
              <path d="M4 9 Q 40 3, 80 7 T 150 5 T 196 8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>{" "}be found by employers.
        </h1>
        <p className="mb-10 max-w-[34rem] text-[1.125rem] leading-relaxed text-ink-2">
          No résumé. No recruiter search. No follower counts. Just people, rooms, and things worth saying. Pseudonymous by default.
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
            <p className="text-[1.02rem] leading-relaxed text-ink-2">The opposite. Rooms instead of connections. Chronological instead of ranked. Pseudonymous by default. Not searchable by employers. Ever.</p></div>
          <div><p className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.15em] text-flame-deep">What "trust us" is</p>
            <p className="text-[1.02rem] leading-relaxed text-ink-2">Every social network says it protects you. You can't check. Here, you don't have to take our word for it — read it, fork it, run your own.</p></div>
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
      <footer className="mt-20 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-6 font-mono text-[0.72rem] text-muted">
        <span>AGPL-3.0</span><span className="text-line-2">·</span><span>self-hostable</span><span className="text-line-2">·</span><span>no ads</span><span className="text-line-2">·</span><span>no recruiter search</span>
      </footer>
    </div>
  );
}
