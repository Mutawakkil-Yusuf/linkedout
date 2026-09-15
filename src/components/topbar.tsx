"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lockup } from "@/components/logo";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/rooms", label: "Rooms" },
  { href: "/dms", label: "Messages" },
  { href: "/me", label: "Me" },
  { href: "/settings", label: "Settings" },
];

export function Topbar() {
  const pathname = usePathname();
  const hide = pathname === "/" || pathname === "/login" || pathname === "/onboard" || pathname === "/motion";
  if (hide) return null;
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[40rem] flex-wrap items-center gap-2 px-4 py-3 sm:gap-4 sm:px-5">
        <Link href="/rooms" className="flex flex-none items-center"><Lockup size={26} wordmarkSize="sm" /></Link>
        <nav className="ml-auto flex flex-wrap justify-end gap-1">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return <Link key={t.href} href={t.href}
              className={cn("rounded-[10px] px-2.5 py-1.5 text-[0.85rem] font-medium transition-colors sm:px-3.5 sm:text-[0.875rem]",
                active ? "bg-flame/10 text-flame" : "text-muted hover:bg-paper-2 hover:text-ink")}>{t.label}</Link>;
          })}
        </nav>
      </div>
    </header>
  );
}
