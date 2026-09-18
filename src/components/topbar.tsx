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
 * Desktop sidebar and mobile top bar share this component so the brand
 * mark stays in one place. TABS only renders in the desktop sidebar now;
 * on mobile, navigation lives in the bottom nav (components/mobile/nav.tsx),
 * which mirrors this same list separately to avoid over-coupling a sidebar
 * layout to a bottom-tab layout.
 */
export function Topbar() {
  const pathname = usePathname();
  if (NO_CHROME_PATHS.has(pathname)) return null;

  return (
    <>
      {/* Mobile / tablet: brand-only sticky bar. Navigation lives in the
          bottom nav (components/mobile/nav.tsx) now, so this is just a
          consistent place to see the wordmark and get back to /rooms. */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-md sm:px-5 lg:hidden">
        <Link href="/rooms" className="flex items-center"><Wordmark size="sm" /></Link>
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
