"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hash, MessageCircle, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NO_CHROME_PATHS } from "@/components/topbar";

// Same four destinations as the desktop sidebar's TABS in topbar.tsx.
// Kept as a separate literal (not imported) because Topbar's TABS pairs
// each entry with a component instance already sized for the sidebar;
// duplicating the plain data here is cheaper than threading icon size
// through a shared export for four lines that rarely change.
const TABS = [
  { href: "/rooms", label: "Rooms", icon: Hash },
  { href: "/dms", label: "Messages", icon: MessageCircle },
  { href: "/me", label: "Me", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileNav() {
  const pathname = usePathname();
  if (NO_CHROME_PATHS.has(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-[40rem] items-center justify-around px-2">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                active ? "text-flame" : "text-muted active:text-ink"
              )}
            >
              {active && <span aria-hidden className="absolute top-0 h-1 w-1 rounded-full bg-flame" />}
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.3 : 1.9} />
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.08em]">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
