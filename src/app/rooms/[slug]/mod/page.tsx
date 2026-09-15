// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModActionCard } from "@/components/mod-action-card";

const REASON_LABEL: Record<string, string> = {
  harassment: "Harassment or targeting",
  doxxing: "Sharing private info",
  bad_faith: "Bad faith / trolling",
  spam: "Spam",
  off_topic: "Off topic",
  other: "Something else",
};

export default async function ModQueuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms").select("id, slug, name").eq("slug", slug).maybeSingle();
  if (!room) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isMod } = await supabase.rpc("is_room_mod", { p_room: room.id, p_user: user.id });
  if (!isMod) redirect(`/rooms/${slug}`);

  const { data: reports } = await supabase
    .from("reports")
    .select(`
      id, reason, note, created_at,
      reporter:profiles!reports_reporter_id_fkey(handle, display_name),
      target_post:posts!reports_target_post_id_fkey(
        id, body, author_id,
        author:profiles!posts_author_id_fkey(handle, display_name, avatar_style, avatar_seed)
      ),
      target_reply:replies!reports_target_reply_id_fkey(
        id, body, author_id,
        author:profiles!replies_author_id_fkey(handle, display_name, avatar_style, avatar_seed)
      ),
      target_user:profiles!reports_target_user_id_fkey(id, handle, display_name, avatar_style, avatar_seed)
    `)
    .eq("room_id", room.id)
    .eq("status", "open")
    .order("created_at", { ascending: true });

  return (
    <div className="pt-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-[1.6rem] font-bold tracking-[-0.025em]">
            <span className="font-mono text-flame">#</span>{room.slug} · mod queue
          </h1>
          <p className="mt-1 text-[0.9rem] text-muted">
            {reports?.length ?? 0} open {reports?.length === 1 ? "report" : "reports"}
          </p>
        </div>
        <Link
          href={`/rooms/${slug}/mod/log`}
          className="font-mono text-[0.75rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
        >
          public log →
        </Link>
      </header>

      {reports?.length ? (
        <ul className="space-y-3">
          {reports.map((r: any) => (
            <li key={r.id}>
              <ModActionCard
                reportId={r.id}
                roomId={room.id}
                reasonLabel={REASON_LABEL[r.reason] ?? r.reason}
                note={r.note}
                createdAt={r.created_at}
                reporter={r.reporter}
                target={
                  r.target_post
                    ? { kind: "post", id: r.target_post.id, body: r.target_post.body, authorId: r.target_post.author_id, author: r.target_post.author }
                    : r.target_reply
                    ? { kind: "reply", id: r.target_reply.id, body: r.target_reply.body, authorId: r.target_reply.author_id, author: r.target_reply.author }
                    : r.target_user
                    ? { kind: "user", id: r.target_user.id, body: null, authorId: r.target_user.id, author: r.target_user }
                    : null
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-card border border-line bg-card p-8 text-center text-[0.95rem] text-muted">
          Nothing to review. Quiet is good.
        </div>
      )}
    </div>
  );
}
