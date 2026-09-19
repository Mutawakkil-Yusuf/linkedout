"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { createBrowserClient } from "@supabase/ssr";

// Explicit, long-lived cookie options — "logged in until you log out."
// Without this, @supabase/ssr's cookie writer falls back to its own
// default maxAge, which in some client versions ends up shorter-lived
// than the refresh token itself is actually good for, so the cookie
// can expire out from under a still-valid session. 100 days here is
// deliberately far longer than any realistic refresh-token lifetime —
// the point isn't to outlive the token, it's to make sure the COOKIE
// is never the thing that expires first. Supabase's own refresh-token
// rotation is what actually ends a session early if it ever does.
const oneHundredDaysInSeconds = 60 * 60 * 24 * 100;

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: oneHundredDaysInSeconds,
        sameSite: "lax",
        // secure must be false on plain http://localhost during local
        // dev — browsers silently refuse to store a Secure cookie over
        // a non-HTTPS origin, which would otherwise make local login
        // "not persist" in a way that looks identical to this exact bug.
        secure: process.env.NODE_ENV === "production",
      },
    }
  );
