// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Me", robots: { index: false, follow: false } };

export default async function MePage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("handle").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboard");
  redirect(`/u/${profile.handle}`);
}
