"use client";

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hash, MessageCircle, User, Settings } from "lucide-react";
import { Wordmark, Lockup, LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

export const NO_CHROME_PATHS = new Set(["/", "/login", "/onboard", "/motion"]);

const TABS = [
  { href: "/rooms", label: "Rooms", icon: Hash },
  { href: "/dms", label: "Messages", icon: MessageCircle },
  { href: "/me", label: "Me", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Renders both the mobile top bar and the desktop sidebar from one nav
 * list, so they can never drift out of sync. Only one is visible at a
 * given viewport width — the other is `hidden` via Tailwind, not unmounted,
 * so there's no layout flash while resizing.
 */
export function Topbar() {
  const pathname = usePathname();
  if (NO_CHROME_PATHS.has(pathname)) return null;

  return (
    <>
      {/* Mobile / tablet: sticky horizontal bar, one row — wordmark only
          (no icon mark), nav tabs right-aligned. flex-nowrap keeps brand
          and tabs on a single line at all times; if space ever runs out
          the tabs scroll horizontally instead of wrapping to a second row. */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[40rem] flex-nowrap items-center gap-2 px-4 py-3 sm:gap-4 sm:px-5">
          <Link href="/rooms" className="flex flex-none items-center"><Wordmark size="sm" /></Link>
          <nav className="ml-auto flex flex-nowrap items-center gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href}
                className={cn("flex-none whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-[0.85rem] font-medium transition-colors sm:px-3.5 sm:text-[0.875rem]",
                  isActive(pathname, t.href) ? "bg-flame/10 text-flame" : "text-muted hover:bg-paper-2 hover:text-ink")}>
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Desktop: fixed left rail */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[15.5rem] flex-col border-r border-line bg-paper px-4 py-6 lg:flex">
        <Link href="/rooms" className="mb-8 flex items-center px-2">
          <Lockup size={30} wordmarkSize="md" />
        </Link>
        <nav className="flex flex-col gap-1">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
                  active ? "bg-flame/10 text-flame" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                )}>
                <Icon className="h-[1.15rem] w-[1.15rem] flex-none" strokeWidth={active ? 2.4 : 2} />
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-2 px-2 pt-4 text-[0.72rem] text-muted">
          <LogoMark size={16} variant="flat" />
          <span className="font-mono">linkedout</span>
        </div>
      </aside>
    </>
  );
}
