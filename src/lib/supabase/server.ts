// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Matches client.ts's cookie lifetime exactly — see the comment there.
// Kept as its own literal (not imported/shared) on purpose: this file
// and client.ts run in different runtimes, and the point of this pass
// is that each cookie-writing call site is explicit and inspectable on
// its own, not routed through a shared constant that hides which
// clients are actually configured this way.
const oneHundredDaysInSeconds = 60 * 60 * 24 * 100;

export async function createClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: oneHundredDaysInSeconds,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch (err) {
            // Next.js forbids writing cookies from a Server Component —
            // only Route Handlers and Server Actions may do it. That
            // case is expected and is why this stays a no-op instead of
            // throwing. What used to be silent here (bare `catch {}`)
            // is the actual reason a genuine refresh-token failure was
            // undiagnosable before: this log line is the only change in
            // behavior — Server Components still can't write cookies,
            // but now a real failure leaves a trace instead of none.
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                "[supabase/server] cookie write skipped (expected from a Server Component; " +
                  "unexpected from a Route Handler or Server Action):",
                err instanceof Error ? err.message : err
              );
            }
          }
        },
      },
    }
  );
}
