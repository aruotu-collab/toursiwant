"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGreeting } from "@/components/AuthNav";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: string;
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const onTrip = pathname?.startsWith("/trips");
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user?: AuthUser | null }) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/scorecard");
    router.refresh();
    setBusy(false);
  }

  // Legacy trip-template pages keep their own chrome if opened via old links.
  if (onTrip) return null;

  const onScorecard =
    pathname?.startsWith("/scorecard") || pathname?.startsWith("/new-york");
  const onAccount = pathname === "/account";
  const onAdmin = pathname?.startsWith("/admin");

  const navItems: Array<{
    href: string;
    label: string;
    active: boolean;
    mobileOnly?: boolean;
  }> = [
    { href: "/scorecard", label: "Scorecard", active: Boolean(onScorecard) },
    { href: "/account#my-trips", label: "My trips", active: onAccount },
  ];

  if (user) {
    navItems.push({
      href: "/account",
      label: "Account",
      active: onAccount,
      mobileOnly: true,
    });
    if (user.role === "admin") {
      navItems.push({
        href: "/admin",
        label: "Admin",
        active: Boolean(onAdmin),
        mobileOnly: true,
      });
    }
  } else if (user === null) {
    navItems.push({
      href: "/join",
      label: "Sign in",
      active: false,
      mobileOnly: true,
    });
  }

  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4 pt-3 sm:px-8 sm:pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/scorecard"
              className="font-display text-xl tracking-tight text-ink sm:text-2xl"
            >
              Tours<span className="text-amber">I</span>Want
            </Link>
            <AuthGreeting />
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {user === undefined ? (
              <span className="h-8 w-24 animate-pulse bg-ink/10" aria-hidden />
            ) : user ? (
              <>
                <Link
                  href="/account"
                  className="bg-ink px-3 py-2 text-sm text-white transition hover:bg-ink-soft"
                >
                  My account
                </Link>
                {user.role === "admin" ? (
                  <Link
                    href="/admin"
                    className="text-sm text-ink-soft transition hover:text-ink"
                  >
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={logout}
                  disabled={busy}
                  className="border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-white"
                >
                  {busy ? "…" : "Log out"}
                </button>
              </>
            ) : (
              <Link
                href="/join"
                className="bg-ink px-3 py-2 text-sm text-white transition hover:bg-ink-soft"
              >
                Sign in
              </Link>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {user === undefined ? (
              <span className="h-8 w-14 animate-pulse bg-ink/10" aria-hidden />
            ) : user ? (
              <button
                type="button"
                onClick={logout}
                disabled={busy}
                className="border border-ink/20 px-2.5 py-1.5 text-xs font-semibold text-ink"
              >
                {busy ? "…" : "Log out"}
              </button>
            ) : (
              <Link
                href="/join"
                className="bg-ink px-2.5 py-1.5 text-xs font-semibold text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        <nav
          className="mt-3 max-w-full overflow-x-auto overscroll-x-contain touch-pan-x pb-3 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          <ul className="flex w-max items-center gap-2">
            {navItems.map((item) => (
              <li
                key={`${item.href}-${item.label}`}
                className={item.mobileOnly ? "md:hidden" : undefined}
              >
                <Link
                  href={item.href}
                  className={`block shrink-0 whitespace-nowrap border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                    item.active
                      ? "border-amber bg-amber text-ink"
                      : "border-ink/15 bg-white text-ink-soft hover:border-amber hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
