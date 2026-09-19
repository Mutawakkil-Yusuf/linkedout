"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { useRouter } from "next/navigation";
import Link from "next/link";
import { redeemShareLink } from "@/lib/actions/rooms";
import { ActionButton } from "@/components/ui/action-button";

type Props = { token: string; roomSlug: string; signedIn: boolean };

export function JoinLinkRedeemer({ token, roomSlug, signedIn }: Props) {
  const router = useRouter();

  async function onJoin() {
    const res = await redeemShareLink({ token });
    if (!res.ok) throw new Error(res.error);
    router.push(`/rooms/${res.slug}`);
  }

  if (!signedIn) {
    const next = `/join/${token}`;
    return (
      <div className="rounded-card border border-flame/20 bg-flame/5 p-5">
        <p className="mb-3 text-[0.95rem] text-ink-2">
          No password, no résumé. Just pick a handle and you're in.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="inline-flex items-center justify-center rounded-[10px] bg-flame px-5 py-2.5 font-medium text-[0.92rem] text-white transition hover:bg-flame-deep"
        >
          Join {roomSlug ? "this room" : ""} →
        </Link>
      </div>
    );
  }

  return (
    <ActionButton
      variant="fill"
      label="Join this room"
      successLabel="Joined"
      errorLabel="Try again"
      onPress={onJoin}
    />
  );
}
