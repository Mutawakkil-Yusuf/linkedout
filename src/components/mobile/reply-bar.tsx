"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { Avatar } from "@/components/ui/avatar";
import type { AvatarStyle } from "@/lib/avatar";

type Props = {
  handle: string;
  avatarStyle?: AvatarStyle | null;
  avatarSeed?: string | null;
  onClick: () => void;
};

export function ReplyBar({ handle, avatarStyle, avatarSeed, onClick }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-[40rem] items-center gap-2.5 px-4 py-3">
        <Avatar handle={handle} avatarStyle={avatarStyle} avatarSeed={avatarSeed} size="sm" />
        <button
          type="button"
          onClick={onClick}
          className="flex-1 rounded-full border border-line bg-card px-4 py-2.5 text-left text-[0.88rem] text-muted transition-colors active:border-line-2"
        >
          Reply as @{handle}…
        </button>
      </div>
    </div>
  );
}
