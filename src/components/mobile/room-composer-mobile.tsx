"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { ComposerFAB } from "./composer-fab";
import { ComposerSheet } from "./composer-sheet";
import type { AvatarStyle } from "@/lib/avatar";

type Props = {
  roomId: string;
  roomSlug: string;
  handle: string;
  avatarStyle?: AvatarStyle | null;
  avatarSeed?: string | null;
};

// Only place on the room page that needs client state for the mobile
// composer, so it's isolated here rather than making the whole room
// page (a server component doing several real queries) a client
// component just to hold one boolean.
export function RoomComposerMobile({ roomId, roomSlug, handle, avatarStyle, avatarSeed }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ComposerFAB onClick={() => setOpen(true)} />
      <ComposerSheet
        open={open}
        onClose={() => setOpen(false)}
        roomId={roomId}
        roomSlug={roomSlug}
        handle={handle}
        avatarStyle={avatarStyle}
        avatarSeed={avatarSeed}
      />
    </>
  );
}
