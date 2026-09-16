"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle, MoreHorizontal, Flag, Eye, EyeOff, Pin, PinOff } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ReportDialog } from "@/components/report-dialog";
import { createClient } from "@/lib/supabase/client";
import { pinPost, unpinPost } from "@/lib/actions/rooms";
import { cn, relativeTime } from "@/lib/utils";
import type { Post, Profile } from "@/lib/types";

type Mode = "normal" | "spoiler" | "quiet";

type Props = {
  post: Pick<Post, "id" | "body" | "created_at"> & {
    hidden_at?: string | null;
    room_id?: string | null;
    author_id?: string;
    mode?: Mode;
  };
  author: Pick<Profile, "handle" | "display_name" | "avatar_style" | "avatar_seed"> | null;
  warmed?: boolean;
  currentUserId?: string | null;
  /** total replies — shown to everyone, it's wayfinding not a vanity metric */
  replyCount?: number;
  /** total reactions — only ever rendered when the viewer is the post's author (see below) */
  warmthCount?: number;
  /** whether the viewer can moderate this room — gates the pin/unpin menu item */
  isMod?: boolean;
  /** whether this post is the room's currently pinned post */
  isPinned?: boolean;
};

export function PostCard({
  post,
  author,
  warmed: warm0 = false,
  currentUserId,
  replyCount = 0,
  warmthCount = 0,
  isMod = false,
  isPinned = false,
}: Props) {
  const [warmed, setWarmed] = useState(warm0);
  const [pending, setPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const isHidden = !!post.hidden_at;
  const isAuthor = currentUserId && post.author_id === currentUserId;
  const mode: Mode = post.mode ?? "normal";
  const isSpoiler = mode === "spoiler" && !revealed && !isAuthor;
  const isQuiet = mode === "quiet";
  const showMenu = (!isAuthor && !!post.room_id) || (isMod && !!post.room_id);

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

  async function togglePin() {
    if (pinBusy || !post.room_id) return;
    setPinBusy(true);
    setPinError(null);
    setMenuOpen(false);

    const fn = isPinned ? unpinPost : pinPost;
    const res = await fn({ roomId: post.room_id, postId: post.id });
    setPinBusy(false);
    if (!res.ok) setPinError(res.error);
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
        <span
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: "var(--room-accent, #e8571f)" }}
          aria-hidden
        />
      )}

      {isHidden && (
        <div className="mb-3 rounded-[10px] border border-flame/20 bg-flame/5 px-3 py-2 text-[0.82rem] text-flame-deep">
          This post is hidden. Only you and moderators can see it.
        </div>
      )}

      {pinError && (
        <p className="mb-2 text-[0.8rem] text-flame-deep">{pinError}</p>
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

        {isQuiet && !isAuthor && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-paper-2 px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-muted">
            quiet
          </span>
        )}
        {isPinned && (
          <span
            className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider"
            style={{ background: "var(--room-accent-bg, rgba(232, 87, 31, 0.07))", color: "var(--room-accent, #e8571f)" }}
          >
            <Pin className="h-2.5 w-2.5" strokeWidth={2.5} />
            pinned
          </span>
        )}

        <div className="relative ml-auto flex flex-none items-center gap-1">
          <time className="font-mono text-[0.72rem] text-muted">
            {relativeTime(post.created_at)}
          </time>

          {showMenu && (
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
                <div className="absolute right-0 top-9 z-10 w-44 overflow-hidden rounded-soft border border-line bg-card shadow-card">
                  {isMod && post.room_id && (
                    <button
                      type="button"
                      onClick={togglePin}
                      disabled={pinBusy}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.85rem] text-ink transition hover:bg-paper-2 disabled:opacity-50"
                    >
                      {isPinned ? (
                        <><PinOff className="h-3.5 w-3.5" /> Unpin from room</>
                      ) : (
                        <><Pin className="h-3.5 w-3.5" /> Pin to room</>
                      )}
                    </button>
                  )}
                  {!isAuthor && post.room_id && (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setReportOpen(true); }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-[0.85rem] text-ink transition hover:bg-paper-2",
                        isMod && "border-t border-line"
                      )}
                    >
                      <Flag className="h-3.5 w-3.5" /> Report
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {isSpoiler ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="group mb-2.5 flex w-full items-center gap-3 rounded-soft border border-line bg-paper-2 px-3 py-3 text-left transition hover:bg-paper"
        >
          <EyeOff className="h-4 w-4 flex-none text-muted" />
          <span className="text-[0.9rem] text-muted">
            Spoiler.{" "}
            <span className="underline decoration-line-2 underline-offset-2 group-hover:decoration-ink">
              Click to reveal.
            </span>
          </span>
        </button>
      ) : (
        <>
          {mode === "spoiler" && !isAuthor && (
            <button
              type="button"
              onClick={() => setRevealed(false)}
              className="mb-1.5 inline-flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-wider text-muted transition hover:text-ink"
            >
              <Eye className="h-3 w-3" /> hide again
            </button>
          )}
          <p className={cn(
            "mb-2.5 whitespace-pre-wrap break-words text-[1rem] leading-relaxed",
            isHidden ? "text-muted" : "text-ink"
          )}>
            {post.body}
          </p>
        </>
      )}

      {!isHidden && (
        <footer className="flex flex-wrap gap-0.5 border-t border-line pt-2">
          <button
            onClick={toggle}
            disabled={pending}
            aria-busy={pending}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[0.8rem] font-medium transition disabled:cursor-default",
              warmed
                ? "bg-flame/10 text-flame"
                : "text-muted hover:bg-flame/10 hover:text-flame"
            )}
          >
            <Heart className={cn("h-4 w-4", warmed && "fill-current", pending && "animate-lo-breathe")} />
            {warmed ? "warmed" : "send warmth"}
            {/* Only the author sees the total — everyone else only sees their
                own warmed/not-warmed state. Matches the DB's own visibility
                rule for reactions, and keeps this a private signal to the
                author rather than a public like-count. */}
            {isAuthor && warmthCount > 0 && (
              <span className="font-mono text-[0.75rem] text-muted">{warmthCount}</span>
            )}
          </button>
          <Link
            href={`/p/${post.id}`}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[0.8rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink"
          >
            <MessageCircle className="h-4 w-4" />
            reply
            {replyCount > 0 && (
              <span className="font-mono text-[0.75rem] text-muted">{replyCount}</span>
            )}
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
