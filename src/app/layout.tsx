import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { Topbar } from "@/components/topbar";
import { SplashScreen } from "@/components/splash-screen";
import { RegisterServiceWorker } from "@/components/register-service-worker";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LinkedOut",
    template: "%s · LinkedOut",
  },
  description: "The network where you cannot be found by employers.",
  applicationName: "LinkedOut",
  manifest: "/manifest.webmanifest",
  // No `icons` field here on purpose: app/icon.svg and app/apple-icon.tsx
  // are file-convention routes, so Next.js already injects the correct
  // <link rel="icon"> / <link rel="apple-touch-icon"> tags for them.
  // Repeating those URLs here just renders duplicate <link> tags.
  appleWebApp: {
    capable: true,
    title: "LinkedOut",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "LinkedOut",
    description: "The network where you cannot be found by employers.",
    siteName: "LinkedOut",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "LinkedOut",
    description: "The network where you cannot be found by employers.",
  },
};

export const viewport: Viewport = { themeColor: "#fdf8f3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {/*
          Runs before hydration. On a repeat visit this session, it adds
          .lo-skip-splash to <html> — the matching rule in globals.css hides
          #lo-splash immediately, so there's no one-frame flash of the splash
          before SplashScreen's own effect has a chance to run.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(sessionStorage.getItem('lo_splash_seen')==='1'){document.documentElement.classList.add('lo-skip-splash')}}catch(e){}})();",
          }}
        />
        <RegisterServiceWorker />
        <SplashScreen />
        <Topbar />
        <main className="mx-auto max-w-[40rem] px-5 pb-24">{children}</main>
      </body>
    </html>
  );
}
