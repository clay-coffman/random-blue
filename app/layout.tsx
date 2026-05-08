import type { Metadata } from "next";
import Link from "next/link";
import {
  Roboto_Serif,
  Hanken_Grotesk,
  Kalam,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const robotoSerif = Roboto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-serif",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-kalam",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas — A guide for Utah founders",
  description:
    "Startup State Atlas: a guide, not a library. Six questions, one 90-day plan, and Utah's startup ecosystem on a map.",
};

const REPO_URL = "https://github.com/clay-coffman/startup-state-atlas";

const navLinks = [
  { href: "/", label: "Atlas" },
  { href: "/map", label: "Map" },
  { href: "/founder", label: "Resources" },
  { href: "/agents", label: "For agents" },
];

const footerLinks = [
  { href: "/llms.txt", label: "llms.txt", external: false },
  { href: "/AGENTS.md", label: "AGENTS.md", external: false },
  { href: "/api/v1/openapi.json", label: "openapi.json", external: false },
  { href: REPO_URL, label: "GitHub", external: true },
];

function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-topo bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-4 px-4 py-3 sm:px-7 md:gap-6">
        <Link
          href="/"
          className="group flex items-center gap-2"
          aria-label="Startup State Atlas — home"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink font-mono text-[12px] font-semibold"
          >
            N
          </span>
          <span className="font-serif leading-none">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Startup State
            </span>
            <span className="block text-2xl font-medium tracking-tight">
              Atlas
            </span>
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="order-3 -mx-4 flex w-full gap-4 overflow-x-auto px-4 font-hand text-[15px] font-bold md:order-none md:mx-0 md:w-auto md:flex-1 md:justify-center md:overflow-visible md:px-0"
        >
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap text-ink-2 transition hover:text-ember"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/sign-in"
            className="hidden whitespace-nowrap rounded-pill border-[1.5px] border-ink bg-paper-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up?intent=claim"
            className="inline-flex whitespace-nowrap items-center gap-1 rounded-pill border-[1.5px] border-ember bg-ember px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5"
          >
            Claim a company →
          </Link>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-topo bg-paper-2">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-4 py-6 font-mono text-[11px] uppercase tracking-wider text-ink-3 sm:px-7">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-5 w-5 place-items-center rounded-full border-[1.5px] border-ink-3 text-[9px]"
          >
            N
          </span>
          Atlas · startup.utah.gov
        </span>
        <nav aria-label="Resources" className="flex flex-wrap gap-4">
          {footerLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              {...(l.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="transition hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${robotoSerif.variable} ${hankenGrotesk.variable} ${kalam.variable} ${jetbrains.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-paper font-sans text-ink antialiased">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
