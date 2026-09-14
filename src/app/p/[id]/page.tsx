import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/post-card";
import { ReplyForm } from "@/components/reply-form";
import { Avatar } from "@/components/ui/avatar";
import { relativeTime } from "@/lib/utils";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("id, body, created_at, author:profiles!posts_author_id_fkey(handle, display_name)").eq("id", id).maybeSingle();
  if (!post) notFound();
  const { data: replies } = await supabase.from("replies").select("id, body, created_at, author:profiles!replies_author_id_fkey(handle, display_name)").eq("post_id", id).is("deleted_at", null).order("created_at", { ascending: true });
  return <div className="pt-8"><PostCard post={post as any} author={(post as any).author} /><ReplyForm postId={id} /><ul>{replies?.map((r: any) => <li key={r.id} className="mb-3 rounded-card border border-line bg-card p-4"><header className="mb-2 flex items-center gap-2.5"><Avatar handle={r.author?.handle ?? "??"} size="sm" /><div className="min-w-0 flex-1 truncate text-[0.9rem] font-semibold">{r.author?.display_name ?? r.author?.handle}</div><time className="ml-auto flex-none font-mono text-[0.72rem] text-muted">{relativeTime(r.created_at)}</time></header><p className="whitespace-pre-wrap break-words text-[1rem] leading-relaxed text-ink">{r.body}</p></li>)}</ul></div>;
}
