"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { startDm } from "@/lib/actions/dms";
import { ActionButton } from "@/components/ui/action-button";

type Props = { otherUserId: string; otherHandle: string };

export function MessageButton({ otherUserId, otherHandle }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onPress() {
    setError(null);
    const res = await startDm({ otherUserId });
    if (!res.ok) {
      setError(res.error);
      throw new Error(res.error);
    }
    router.push(`/dms/${res.threadId}`);
  }

  return (
    <>
      <ActionButton
        variant="fill"
        size="sm"
        icon={<MessageCircle className="h-4 w-4" />}
        label="Message"
        successLabel="Opening…"
        errorLabel="Try again"
        onPress={onPress}
      />
      {error && (
        <p className="mt-2 text-[0.82rem] text-flame-deep">
          Can't message @{otherHandle}. {error}
        </p>
      )}
    </>
  );
}
