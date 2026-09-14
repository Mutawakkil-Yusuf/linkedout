import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { PostCard } from "@/components/post-card";
import { NowLine } from "@/components/now-line";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params; const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, handle, display_name, bio, now, created_at").eq("handle", handle).maybeSingle();
  if (!profile) notFound();
  const { data: posts } = await supabase.from("posts").select("id, body, created_at, author:profiles!posts_author_id_fkey(handle, display_name)").eq("author_id", profile.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(50);
  const joined = new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  return <div className="pt-8"><header className="flex items-center gap-4 border-b border-line pb-5"><Avatar handle={profile.handle} size="lg" /><div className="min-w-0"><h1 className="font-display text-[1.4rem] font-bold tracking-[-0.025em]">{profile.display_name ?? `@${profile.handle}`}</h1><div className="mt-0.5 font-mono text-[0.8rem] text-muted">@{profile.handle} · here since {joined}</div></div></header><NowLine text={profile.now} />{profile.bio && <p className="mb-3 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink-2">{profile.bio}</p>}<ul className="mt-6">{posts?.length ? posts.map((p: any) => <li key={p.id}><PostCard post={p} author={p.author} /></li>) : <li className="rounded-card border border-line bg-card p-6 text-center text-[0.95rem] text-muted">No posts yet.</li>}</ul></div>;
}
