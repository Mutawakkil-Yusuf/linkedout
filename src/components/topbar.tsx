"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lockup } from "@/components/logo";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/rooms", label: "Rooms" },
  { href: "/me", label: "Me" },
  { href: "/settings", label: "Settings" },
];

export function Topbar() {
  const pathname = usePathname();
  const hide = pathname === "/" || pathname === "/login" || pathname === "/onboard";
  if (hide) return null;
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[40rem] items-center gap-4 px-5 py-3">
        <Link href="/rooms" className="flex items-center"><Lockup size={28} /></Link>
        <nav className="ml-auto flex gap-1">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return <Link key={t.href} href={t.href}
              className={cn("rounded-[10px] px-3.5 py-1.5 text-[0.875rem] font-medium transition-colors",
                active ? "bg-flame/10 text-flame" : "text-muted hover:bg-paper-2 hover:text-ink")}>{t.label}</Link>;
          })}
        </nav>
      </div>
    </header>
  );
}
