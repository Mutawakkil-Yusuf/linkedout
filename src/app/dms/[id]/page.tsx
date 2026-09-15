// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DmThread } from "@/components/dm-thread";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("dm_members")
    .select("user_id")
    .eq("thread_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) notFound();

  const { data: otherMember } = await supabase
    .from("dm_members")
    .select("user_id, profile:profiles!dm_members_user_id_fkey(id, handle, display_name, avatar_style, avatar_seed)")
    .eq("thread_id", id)
    .neq("user_id", user.id)
    .maybeSingle();
  if (!otherMember || !otherMember.profile) notFound();

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_style, avatar_seed")
    .eq("id", user.id)
    .maybeSingle();
  if (!meProfile) redirect("/onboard");

  const { data: messages } = await supabase
    .from("dm_messages")
    .select("id, sender_id, body, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  const other = otherMember.profile as unknown as {
    id: string;
    handle: string;
    display_name: string | null;
    avatar_style: string | null;
    avatar_seed: string | null;
  };

  return (
    <DmThread
      threadId={id}
      me={{
        id: meProfile.id,
        handle: meProfile.handle,
        display_name: meProfile.display_name,
        avatar_style: meProfile.avatar_style,
        avatar_seed: meProfile.avatar_seed,
      }}
      other={other as any}
      initialMessages={messages ?? []}
    />
  );
}
