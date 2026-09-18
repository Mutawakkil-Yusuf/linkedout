"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { ReplyBar } from "./reply-bar";
import { ReplySheet } from "./reply-sheet";
import type { AvatarStyle } from "@/lib/avatar";

type Props = {
  postId: string;
  handle: string;
  avatarStyle?: AvatarStyle | null;
  avatarSeed?: string | null;
  replyingTo: string;
};

export function PostReplyMobile({ postId, handle, avatarStyle, avatarSeed, replyingTo }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ReplyBar handle={handle} avatarStyle={avatarStyle} avatarSeed={avatarSeed} onClick={() => setOpen(true)} />
      <ReplySheet
        open={open}
        onClose={() => setOpen(false)}
        postId={postId}
        handle={handle}
        avatarStyle={avatarStyle}
        avatarSeed={avatarSeed}
        replyingTo={replyingTo}
      />
    </>
  );
}
