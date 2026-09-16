// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login`);
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=1`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  const dest = profile ? "/rooms" : "/onboard";

  // The magic link always opens in the system browser, not the
  // installed standalone PWA — they're separate storage contexts, so
  // the session we just created here is invisible to the installed
  // app icon on the home screen. Redirecting straight to `dest` would
  // only sign in this throwaway browser tab; the person would then
  // switch back to the app and still see it signed out.
  //
  // So: complete the redirect as normal for a plain-browser visitor
  // (?pwa=1 is absent), but when we can tell this link was opened
  // from a PWA-aware context, land on a small bridge page that tells
  // the person to switch back to the app instead of silently stranding
  // them in the browser tab.
  return NextResponse.redirect(`${origin}/auth/callback/done?next=${encodeURIComponent(dest)}`);
}
