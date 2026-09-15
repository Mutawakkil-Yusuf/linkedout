"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useRouter } from "next/navigation";
import { joinRoom } from "@/lib/actions/rooms";
import { ActionButton } from "@/components/ui/action-button";

type Props = { roomId: string; slug: string };

export function JoinRoomButton({ roomId, slug }: Props) {
  const router = useRouter();

  async function onPress() {
    const res = await joinRoom({ roomId, slug });
    if (!res.ok) throw new Error(res.error);
    router.refresh();
  }

  return (
    <ActionButton
      variant="fill"
      label="Join room"
      successLabel="Joined"
      errorLabel="Try again"
      onPress={onPress}
    />
  );
}
