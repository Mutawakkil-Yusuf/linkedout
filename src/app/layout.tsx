import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { Topbar } from "@/components/topbar";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "LinkedOut — You're not for sale.",
  description: "You're not for sale. The pseudonymous social network where you can't be found by employers.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fdf8f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <Topbar />
        <main className="mx-auto max-w-[40rem] px-5 pb-24">{children}</main>
      </body>
    </html>
  );
}
