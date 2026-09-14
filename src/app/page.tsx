import Link from "next/link";
import { Lockup } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

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
        <div className="grid gap-8 sm:grid-cols-2">
          <div><p className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.15em] text-flame-deep">What LinkedIn is</p>
            <p className="text-[1.02rem] leading-relaxed text-ink-2">A labor market database with a feed on top. You are the inventory, searchable and contactable by whoever pays.</p></div>
          <div><p className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.15em] text-flame-deep">What LinkedOut is</p>
            <p className="text-[1.02rem] leading-relaxed text-ink-2">The opposite. Rooms instead of connections. Chronological instead of ranked. Pseudonymous by default. Not searchable by employers. Ever.</p></div>
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
        <span>AGPL-3.0</span><span className="text-line-2">·</span><span>self-hostable</span><span className="text-line-2">·</span><span>no ads</span><span className="text-line-2">·</span><span>no recruiter search</span><span className="ml-auto">est. 2026</span>
      </footer>
    </div>
  );
}
