import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AvatarSettingsForm } from "./avatar-settings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("avatar_style, avatar_seed").eq("id", user.id).maybeSingle();
  const initial = profile?.avatar_style && profile?.avatar_seed
    ? { style: profile.avatar_style, seed: profile.avatar_seed } : null;

  return <div className="pt-8"><h1 className="mb-6 font-display text-[1.6rem] font-bold tracking-[-0.025em]">Settings</h1>
    <section className="mb-4 rounded-card border border-line bg-card p-5"><h2 className="mb-1 font-display text-[1.1rem] font-bold tracking-[-0.02em]">Avatar</h2><p className="mb-4 text-[0.9rem] text-muted">Pick a generated look. No photos, ever.</p><AvatarSettingsForm initial={initial} /></section>
    <section className="mb-4 rounded-card border border-line bg-card p-5"><h2 className="mb-1 font-display text-[1.1rem] font-bold tracking-[-0.02em]">Export</h2><p className="mb-4 text-[0.9rem] text-muted">Download everything you’ve written here as JSON + Markdown.</p><a href="/api/export" download><Button variant="ghost">Take everything with you</Button></a></section>
    <section className="mb-4 rounded-card border border-line bg-card p-5"><h2 className="mb-1 font-display text-[1.1rem] font-bold tracking-[-0.02em]">Sign out</h2><p className="mb-4 text-[0.9rem] text-muted">Keeps your handle, posts, and rooms exactly as they are.</p><Link href="/logout"><Button variant="ghost">Sign out</Button></Link></section>
    <section className="mb-4 rounded-card border border-line bg-card p-5"><h2 className="mb-1 font-display text-[1.1rem] font-bold tracking-[-0.02em]">Delete account</h2><p className="mb-4 text-[0.9rem] text-muted">Hard delete. Cascades. No soft-delete ghost.</p><form action="/api/delete" method="post"><Button variant="danger" type="submit">Delete my account</Button></form></section>
  </div>;
}
