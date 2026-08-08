"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGreeting, AuthNav } from "@/components/AuthNav";

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onTrip = pathname?.startsWith("/trips");

  // Homepage and trip templates have their own chrome.
  if (onHome || onTrip) return null;

  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
        <div className="min-w-0">
          <Link
            href="/"
            className="font-display text-xl tracking-tight text-ink sm:text-2xl"
          >
            Tours<span className="text-amber">I</span>Want
          </Link>
          <AuthGreeting />
        </div>
        <nav className="flex shrink-0 items-center gap-2 text-sm text-ink-soft sm:gap-4">
          <Link
            href="/new-york"
            className={`transition hover:text-ink ${
              pathname?.startsWith("/new-york")
                ? "font-semibold text-ink"
                : "hidden sm:inline"
            }`}
          >
            NY Scoreboard
          </Link>
          <Link
            href="/?door=explore"
            className="hidden transition hover:text-ink sm:inline"
          >
            Explore
          </Link>
          <Link
            href="/?door=here"
            className="bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink-soft sm:text-sm"
          >
            I&apos;m here now
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
