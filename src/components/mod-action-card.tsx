"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ActionButton } from "@/components/ui/action-button";
import { handleReport } from "@/lib/actions/moderation";
import { relativeTime } from "@/lib/utils";
import type { AvatarStyle } from "@/lib/avatar";

type Target = {
  kind: "post" | "reply" | "user";
  id: string;
  body: string | null;
  authorId: string;
  author: {
    handle: string;
    display_name: string | null;
    avatar_style?: AvatarStyle | null;
    avatar_seed?: string | null;
  } | null;
};

type Props = {
  reportId: string;
  roomId: string;
  reasonLabel: string;
  note: string | null;
  createdAt: string;
  reporter: { handle: string; display_name: string | null } | null;
  target: Target | null;
};

export function ModActionCard({
  reportId, roomId, reasonLabel, note, createdAt, reporter, target,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pick, setPick] = useState<"hide" | "remove" | "ban" | "dismiss">("hide");

  async function submit() {
    const res = await handleReport({
      reportId,
      action: pick,
      reason: reason.trim() || reasonLabel,
    });
    if (!res.ok) throw new Error(res.error);
    router.refresh();
  }

  if (!target) return null;

  return (
    <section className="rounded-card border border-line bg-card p-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="rounded-[6px] bg-flame/10 px-2 py-1 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-flame">
          {target.kind}
        </span>
        <span className="text-[0.88rem] font-medium">{reasonLabel}</span>
        <span className="ml-auto font-mono text-[0.72rem] text-muted">{relativeTime(createdAt)}</span>
      </header>

      <div className="mb-4 rounded-soft border border-line bg-paper p-3">
        <div className="mb-2 flex items-center gap-2">
          <Avatar
            handle={target.author?.handle ?? "??"}
            avatarStyle={target.author?.avatar_style}
            avatarSeed={target.author?.avatar_seed}
            size="sm"
          />
          <div className="text-[0.85rem] font-semibold">
            {target.author?.display_name ?? target.author?.handle ?? "unknown"}
          </div>
          <span className="font-mono text-[0.72rem] text-muted">@{target.author?.handle}</span>
        </div>
        {target.body && (
          <p className="whitespace-pre-wrap text-[0.93rem] leading-relaxed text-ink-2">
            {target.body}
          </p>
        )}
      </div>

      <div className="mb-5 space-y-1">
        <p className="font-mono text-[0.72rem] text-muted">
          reported by @{reporter?.handle ?? "unknown"}
        </p>
        {note && <p className="text-[0.88rem] text-ink-2">"{note}"</p>}
      </div>

      <label className="mb-1.5 block font-mono text-[0.72rem] uppercase tracking-wider text-muted">
        your reason (shown publicly in the log)
      </label>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={280}
        placeholder="e.g. targeted at another member"
        className="mb-4 w-full rounded-soft border border-line bg-paper px-3 py-2 text-[0.9rem] outline-none transition focus:border-flame focus:ring-4 focus:ring-flame/10"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ["hide",    "Hide (reversible)"],
          ["remove",  "Remove"],
          ["ban",     "Ban author"],
          ["dismiss", "Dismiss report"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setPick(k)}
            className={`rounded-full border px-3 py-1.5 text-[0.82rem] font-medium transition ${
              pick === k
                ? "border-flame bg-flame/10 text-flame"
                : "border-line text-muted hover:border-line-2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ActionButton
        variant="stamp"
        label="Apply"
        successLabel="Done"
        errorLabel="Try again"
        size="sm"
        onPress={submit}
      />
    </section>
  );
}
