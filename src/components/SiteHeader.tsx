"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGreeting, AuthNav } from "@/components/AuthNav";

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onTrip = pathname?.startsWith("/trips");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Homepage and trip templates have their own chrome.
  if (onHome || onTrip) return null;

  const onScorecard =
    pathname?.startsWith("/scorecard") || pathname?.startsWith("/new-york");

  const links = [
    { href: "/scorecard", label: "Scorecard", active: onScorecard },
    {
      href: "/account#my-trips",
      label: "My trips",
      active: pathname === "/account",
    },
    { href: "/?door=explore", label: "Explore", active: false },
    { href: "/?door=here", label: "I'm here now", active: false },
  ];

  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-5">
        <div className="min-w-0">
          <Link
            href="/"
            className="font-display text-xl tracking-tight text-ink sm:text-2xl"
          >
            Tours<span className="text-amber">I</span>Want
          </Link>
          <AuthGreeting />
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 text-sm text-ink-soft md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`transition hover:text-ink ${
                l.active ? "font-semibold text-ink" : ""
              } ${
                l.label === "I'm here now"
                  ? "bg-ink px-3 py-2 font-semibold text-white hover:bg-ink-soft"
                  : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
          <AuthNav />
        </nav>

        {/* Mobile: compact actions + menu */}
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <Link
            href="/scorecard"
            className={`px-2 py-1.5 text-xs font-semibold ${
              onScorecard ? "text-ink" : "text-ink-soft"
            }`}
          >
            Scorecard
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="border border-ink/20 bg-white px-3 py-2 text-xs font-semibold text-ink"
            aria-expanded={menuOpen}
            aria-controls="mobile-site-menu"
          >
            Menu
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" id="mobile-site-menu">
          <button
            type="button"
            className="absolute inset-0 bg-ink/45"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(19rem,88vw)] flex-col border-l border-ink/10 bg-paper shadow-xl">
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
              <p className="font-display text-lg text-ink">Menu</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="px-2 py-1 text-sm text-ink-soft"
              >
                Close
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-3 text-base ${
                    l.active
                      ? "bg-ink text-white"
                      : "bg-white text-ink hover:bg-paper-deep"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-4 border-t border-ink/10 pt-4">
                <div className="flex flex-col gap-2 [&_a]:w-full [&_a]:text-center [&_button]:w-full">
                  <AuthNav />
                </div>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
