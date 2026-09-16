// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MembersPanel } from "@/components/members-panel";

export default async function ModMembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms").select("id, slug, name").eq("slug", slug).maybeSingle();
  if (!room) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewerMembership } = await supabase
    .from("room_members").select("role")
    .eq("room_id", room.id).eq("user_id", user.id).maybeSingle();
  const isMod = viewerMembership?.role === "mod" || viewerMembership?.role === "owner";
  if (!isMod) redirect(`/rooms/${slug}`);
  const viewerRole = (viewerMembership?.role ?? "member") as "member" | "mod" | "owner";

  const { data: members } = await supabase
    .from("room_members")
    .select("user_id, role, joined_at, profile:profiles!room_members_user_id_fkey(handle, display_name, avatar_style, avatar_seed)")
    .eq("room_id", room.id)
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });

  const roleOrder: Record<string, number> = { owner: 0, mod: 1, member: 2 };
  const sorted = (members ?? []).slice().sort((a: any, b: any) =>
    (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3)
  );

  return (
    <div className="pt-8">
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <Link
            href={`/rooms/${slug}`}
            className="font-mono text-[0.75rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
          >
            ← back to #{room.slug}
          </Link>
          <h1 className="mt-3 font-display text-[1.6rem] font-bold tracking-[-0.025em]">
            Members
          </h1>
          <p className="mt-1 text-[0.9rem] text-muted">
            {sorted.length} {sorted.length === 1 ? "person" : "people"} in #{room.slug}
          </p>
        </div>
        <Link
          href={`/rooms/${slug}/mod`}
          className="flex-none font-mono text-[0.75rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
        >
          mod queue →
        </Link>
      </header>

      {sorted.length ? (
        <MembersPanel
          roomId={room.id}
          roomSlug={room.slug}
          members={sorted.map((m: any) => ({
            user_id: m.user_id,
            role: m.role,
            joined_at: m.joined_at,
            profile: m.profile,
          }))}
          viewerRole={viewerRole}
          viewerId={user.id}
        />
      ) : (
        <div className="rounded-card border border-line bg-card p-8 text-center text-[0.95rem] text-muted">
          No members found.
        </div>
      )}
    </div>
  );
}
