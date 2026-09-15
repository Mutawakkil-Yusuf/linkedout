"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { startDm } from "@/lib/actions/dms";

type Props = { otherUserId: string; otherHandle: string };

export function MessageButton({ otherUserId, otherHandle }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await startDm({ otherUserId });
      if (res.ok) {
        router.push(`/dms/${res.threadId}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-card px-4 py-2 text-[0.82rem] font-semibold text-ink transition hover:bg-paper-2 disabled:opacity-50"
      >
        <MessageCircle className="h-4 w-4" />
        {pending ? "Opening…" : "Message"}
      </button>
      {error && (
        <p className="mt-2 text-[0.82rem] text-flame-deep">
          Can't message @{otherHandle}. {error}
        </p>
      )}
    </>
  );
}
