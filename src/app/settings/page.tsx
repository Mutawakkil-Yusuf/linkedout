import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return <div className="pt-8"><h1 className="mb-6 font-display text-[1.6rem] font-bold tracking-[-0.025em]">Settings</h1>
    <section className="mb-4 rounded-card border border-line bg-card p-5"><h2 className="mb-1 font-display text-[1.1rem] font-bold tracking-[-0.02em]">Export</h2><p className="mb-4 text-[0.9rem] text-muted">Download everything you’ve written here as JSON + Markdown.</p><a href="/api/export" download><Button variant="ghost">Take everything with you</Button></a></section>
    <section className="mb-4 rounded-card border border-line bg-card p-5"><h2 className="mb-1 font-display text-[1.1rem] font-bold tracking-[-0.02em]">Sign out</h2><p className="mb-4 text-[0.9rem] text-muted">Keeps your handle, posts, and rooms exactly as they are.</p><Link href="/logout"><Button variant="ghost">Sign out</Button></Link></section>
    <section className="mb-4 rounded-card border border-line bg-card p-5"><h2 className="mb-1 font-display text-[1.1rem] font-bold tracking-[-0.02em]">Delete account</h2><p className="mb-4 text-[0.9rem] text-muted">Hard delete. Cascades. No soft-delete ghost.</p><form action="/api/delete" method="post"><Button variant="danger" type="submit">Delete my account</Button></form></section>
  </div>;
}
