"use client";
import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle, MoreHorizontal, Flag } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ReportDialog } from "@/components/report-dialog";
import { createClient } from "@/lib/supabase/client";
import { cn, relativeTime } from "@/lib/utils";
import type { Post, Profile } from "@/lib/types";

type Props = {
  post: Pick<Post, "id" | "body" | "created_at"> & {
    hidden_at?: string | null;
    room_id?: string | null;
    author_id?: string;
  };
  author: Pick<Profile, "handle" | "display_name" | "avatar_style" | "avatar_seed"> | null;
  warmed?: boolean;
  currentUserId?: string | null;
};

export function PostCard({ post, author, warmed: warm0 = false, currentUserId }: Props) {
  const [warmed, setWarmed] = useState(warm0);
  const [pending, setPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isHidden = !!post.hidden_at;
  const isAuthor = currentUserId && post.author_id === currentUserId;

  async function toggle() {
    if (pending || !author) return;
    setPending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPending(false); return; }

    if (warmed) {
      await supabase.from("reactions").delete().eq("post_id", post.id).eq("user_id", user.id);
      setWarmed(false);
    } else {
      await supabase.from("reactions").upsert({ post_id: post.id, user_id: user.id, kind: "ack" });
      setWarmed(true);
    }
    setPending(false);
  }

  return (
    <article
      className={cn(
        "relative mb-3 overflow-hidden rounded-card border bg-card px-4 pb-3 pt-4 transition-colors",
        warmed
          ? "border-flame/15 bg-gradient-to-b from-[#fffafb] to-card"
          : "border-line hover:border-line-2"
      )}
    >
      {warmed && !isHidden && (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-flame" aria-hidden />
      )}

      {isHidden && (
        <div className="mb-3 rounded-[10px] border border-flame/20 bg-flame/5 px-3 py-2 text-[0.82rem] text-flame-deep">
          This post is hidden. Only you and moderators can see it.
        </div>
      )}

      <header className="mb-2 flex items-center gap-2.5">
        <Avatar
          handle={author?.handle ?? "??"}
          avatarStyle={author?.avatar_style}
          avatarSeed={author?.avatar_seed}
        />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[0.93rem] font-semibold text-ink">
            {author?.display_name ?? author?.handle ?? "unknown"}
          </div>
          <Link
            href={`/u/${author?.handle}`}
            className="block truncate font-mono text-[0.75rem] text-muted hover:text-flame"
          >
            @{author?.handle ?? "unknown"}
          </Link>
        </div>

        <div className="relative ml-auto flex flex-none items-center gap-1">
          <time className="font-mono text-[0.72rem] text-muted">
            {relativeTime(post.created_at)}
          </time>

          {!isAuthor && post.room_id && (
            <>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-paper-2 hover:text-ink"
                aria-label="More"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-soft border border-line bg-card shadow-card">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.85rem] text-ink transition hover:bg-paper-2"
                  >
                    <Flag className="h-3.5 w-3.5" /> Report
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      <p className={cn(
        "mb-2.5 whitespace-pre-wrap break-words text-[1rem] leading-relaxed",
        isHidden ? "text-muted" : "text-ink"
      )}>
        {post.body}
      </p>

      {!isHidden && (
        <footer className="flex flex-wrap gap-0.5 border-t border-line pt-2">
          <button
            onClick={toggle}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[0.8rem] font-medium transition",
              warmed
                ? "bg-flame/10 text-flame"
                : "text-muted hover:bg-flame/10 hover:text-flame"
            )}
          >
            <Heart className={cn("h-4 w-4", warmed && "fill-current")} />
            {warmed ? "warmed" : "send warmth"}
          </button>
          <Link
            href={`/p/${post.id}`}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[0.8rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink"
          >
            <MessageCircle className="h-4 w-4" /> reply
          </Link>
        </footer>
      )}

      {post.room_id && (
        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="post"
          targetId={post.id}
          roomId={post.room_id}
        />
      )}
    </article>
  );
}
