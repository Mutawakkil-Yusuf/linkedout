"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { BottomSheet } from "./sheet";
import { ReplyForm } from "@/components/reply-form";
import { Avatar } from "@/components/ui/avatar";
import type { AvatarStyle } from "@/lib/avatar";

type Props = {
  open: boolean;
  onClose: () => void;
  postId: string;
  handle: string;
  avatarStyle?: AvatarStyle | null;
  avatarSeed?: string | null;
  replyingTo: string;
};

export function ReplySheet({ open, onClose, postId, handle, avatarStyle, avatarSeed, replyingTo }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} label={`reply to @${replyingTo}`}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex items-center gap-2.5 px-5 pt-4">
          <Avatar handle={handle} avatarStyle={avatarStyle} avatarSeed={avatarSeed} size="sm" />
          <div className="flex flex-col leading-tight">
            <span className="text-[0.85rem] font-semibold text-ink">@{handle}</span>
            <span className="font-mono text-[0.66rem] text-muted">replying to @{replyingTo}</span>
          </div>
        </div>
        <ReplyForm postId={postId} variant="sheet" onPosted={onClose} />
      </div>
    </BottomSheet>
  );
}
