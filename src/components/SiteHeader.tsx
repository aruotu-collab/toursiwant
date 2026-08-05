"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGreeting, AuthNav } from "@/components/AuthNav";

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onDarkTours = pathname === "/tours";
  const onDarkEvents = pathname === "/events";
  const onDarkBoardPage = onDarkTours || onDarkEvents;

  // Homepage has its own command-center chrome.
  if (onHome) return null;

  if (onDarkBoardPage) {
    return (
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-[#0a1520]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
          <div className="min-w-0">
            <Link
              href={onDarkEvents ? "/?menu=events" : "/?menu=tours"}
              className="font-display text-xl tracking-tight text-white sm:text-2xl"
            >
              Tours<span className="text-amber">I</span>Want
            </Link>
            <AuthGreeting variant="dark" />
          </div>
          <nav className="flex shrink-0 items-center gap-2 text-sm text-white/70 sm:gap-4">
            <Link
              href="/?menu=pulse"
              className="bg-amber px-3 py-2 text-xs font-semibold text-ink transition hover:bg-amber-deep sm:text-sm"
            >
              Live board
            </Link>
            <Link
              href="/?menu=request"
              className="hidden transition hover:text-white sm:inline"
            >
              Request
            </Link>
            <AuthNav variant="dark" />
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
        <div className="min-w-0">
          <Link
            href="/?menu=pulse"
            className="font-display text-xl tracking-tight text-ink sm:text-2xl"
          >
            Tours<span className="text-amber">I</span>Want
          </Link>
          <AuthGreeting />
        </div>
        <nav className="flex shrink-0 items-center gap-2 text-sm text-ink-soft sm:gap-4">
          <Link
            href="/?menu=pulse"
            className="bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink-soft sm:text-sm"
          >
            Live board
          </Link>
          <Link
            href="/?menu=request"
            className="hidden transition hover:text-ink sm:inline"
          >
            Request
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
