// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { fmtDate } from "@/lib/utils";

type Moderator = {
  user_id: string;
  role: "owner" | "mod";
  profile: { handle: string; display_name: string | null } | null;
};

type Props = {
  roomSlug: string;
  memberCount: number;
  postCountToday: number;
  createdAt: string;
  visibility: string;
  moderators: Moderator[];
  isMod: boolean;
};

export function RoomSidebar({
  roomSlug,
  memberCount,
  postCountToday,
  createdAt,
  visibility,
  moderators,
  isMod,
}: Props) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-20">
      <div className="rounded-soft border border-line bg-card p-4">
        <h3 className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">
          About this room
        </h3>
        <dl className="space-y-2 text-[0.88rem]">
          <Stat k="Members" v={String(memberCount)} />
          <Stat k="Posts today" v={String(postCountToday)} />
          <Stat k="Created" v={fmtDate(createdAt)} />
          <Stat k="Visibility" v={visibility} />
        </dl>
      </div>

      {moderators.length > 0 && (
        <div className="rounded-soft border border-line bg-card p-4">
          <h3 className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">
            Moderators
          </h3>
          <ul className="space-y-3">
            {moderators.map((m) => (
              m.profile && (
                <li key={m.user_id} className="flex items-center gap-2.5">
                  <Avatar handle={m.profile.handle} size="sm" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <Link
                      href={`/u/${m.profile.handle}`}
                      className="block truncate text-[0.85rem] font-medium hover:underline"
                    >
                      {m.profile.display_name ?? m.profile.handle}
                    </Link>
                    <div className="font-mono text-[0.68rem] text-muted">
                      @{m.profile.handle}
                    </div>
                  </div>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.1em] " +
                      (m.role === "owner"
                        ? "bg-ink text-paper"
                        : "bg-paper-2 text-muted")
                    }
                  >
                    {m.role}
                  </span>
                </li>
              )
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-soft border border-line bg-card p-4">
        <h3 className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">
          Elsewhere
        </h3>
        <div className="flex flex-col gap-2 font-mono text-[0.72rem]">
          <Link
            href={`/rooms/${roomSlug}/mod/members`}
            className="text-muted underline decoration-line-2 underline-offset-[3px] transition hover:text-ink hover:decoration-ink"
          >
            members →
          </Link>
          <Link
            href={`/rooms/${roomSlug}/mod/log`}
            className="text-muted underline decoration-line-2 underline-offset-[3px] transition hover:text-ink hover:decoration-ink"
          >
            public mod log →
          </Link>
          {isMod && (
            <Link
              href={`/rooms/${roomSlug}/mod`}
              className="text-muted underline decoration-line-2 underline-offset-[3px] transition hover:text-ink hover:decoration-ink"
            >
              mod queue →
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted">{k}</dt>
      <dd className="font-mono text-[0.82rem] text-ink">{v}</dd>
    </div>
  );
}
