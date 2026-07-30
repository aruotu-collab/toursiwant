"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGreeting, AuthNav } from "@/components/AuthNav";

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  // Homepage has its own command-center chrome.
  if (onHome) return null;

  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="min-w-0">
          <Link
            href="/"
            className="font-display text-xl tracking-tight text-ink sm:text-2xl"
          >
            Tours<span className="text-amber">I</span>Want
          </Link>
          <AuthGreeting />
        </div>
        <nav className="flex items-center gap-3 text-sm text-ink-soft sm:gap-5">
          <Link
            href="/#pulse"
            className="hidden transition hover:text-ink sm:inline"
          >
            Pulse
          </Link>
          <Link
            href="/#rush"
            className="hidden transition hover:text-ink md:inline"
          >
            Live seats
          </Link>
          <Link
            href="/#tours"
            className="hidden transition hover:text-ink md:inline"
          >
            Find tours
          </Link>
          <Link
            href="/#events"
            className="hidden transition hover:text-ink sm:inline"
          >
            Events
          </Link>
          <Link href="/#request" className="transition hover:text-ink">
            Request
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
