"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { usePathname } from "next/navigation";
import { NO_CHROME_PATHS } from "@/components/topbar";

/**
 * Owns the layout decision that Topbar's own visibility depends on, so the
 * two can never disagree about which pages have a sidebar. On chrome-less
 * pages (landing, login, onboard, motion lab) there's no sidebar to offset
 * for, so `<main>` just centers normally at every width.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noChrome = NO_CHROME_PATHS.has(pathname);

  if (noChrome) {
    return (
      <main className="mx-auto max-w-[40rem] px-5 pb-24">{children}</main>
    );
  }

  return (
    <div className="lg:flex">
      <div className="hidden lg:block lg:w-[15.5rem] lg:flex-none" aria-hidden="true" />
      <main className="mx-auto max-w-[40rem] px-5 pb-32 lg:max-w-[44rem] lg:flex-1 lg:px-10 lg:pb-24 lg:pt-4">
        {children}
      </main>
    </div>
  );
}
