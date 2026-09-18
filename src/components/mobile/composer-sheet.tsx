"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { BottomSheet } from "./sheet";
import { Composer } from "@/components/composer";
import { Avatar } from "@/components/ui/avatar";
import type { AvatarStyle } from "@/lib/avatar";

type Props = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomSlug: string;
  handle: string;
  avatarStyle?: AvatarStyle | null;
  avatarSeed?: string | null;
};

export function ComposerSheet({ open, onClose, roomId, roomSlug, handle, avatarStyle, avatarSeed }: Props) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="new post"
      meta={<span className="font-mono text-[0.7rem] text-flame">#{roomSlug}</span>}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex items-center gap-2.5 px-5 pt-4">
          <Avatar handle={handle} avatarStyle={avatarStyle} avatarSeed={avatarSeed} size="sm" />
          <div className="flex flex-col leading-tight">
            <span className="text-[0.85rem] font-semibold text-ink">@{handle}</span>
            <span className="font-mono text-[0.66rem] text-muted">writing in #{roomSlug}</span>
          </div>
        </div>
        <Composer roomId={roomId} variant="sheet" onPosted={onClose} />
      </div>
    </BottomSheet>
  );
}
