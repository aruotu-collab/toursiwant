"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: string;
};

type Variant = "light" | "dark";

function useAuthUser() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

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

  return { user, setUser };
}

function firstName(user: AuthUser) {
  return user.name?.split(" ")[0] || user.email.split("@")[0];
}

/** Greeting shown under the ToursIWant logo when signed in. */
export function AuthGreeting({ variant = "light" }: { variant?: Variant }) {
  const { user } = useAuthUser();
  const dark = variant === "dark";

  if (user === undefined) {
    return (
      <span
        className={
          dark
            ? "mt-0.5 block h-3 w-16 animate-pulse bg-white/10"
            : "mt-0.5 block h-3 w-16 animate-pulse bg-ink/10"
        }
        aria-hidden
      />
    );
  }

  if (!user) return null;

  return (
    <Link
      href="/account"
      className={
        dark
          ? "mt-0.5 block truncate text-[11px] font-medium text-white/70 transition hover:text-white sm:text-xs"
          : "mt-0.5 block text-xs font-medium text-ink-soft transition hover:text-ink sm:text-sm"
      }
    >
      Hi, {firstName(user)}
    </Link>
  );
}

/** Account actions for the right side of the nav (no greeting). */
export function AuthNav({ variant = "light" }: { variant?: Variant }) {
  const router = useRouter();
  const { user, setUser } = useAuthUser();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
    setBusy(false);
  }

  const dark = variant === "dark";
  const linkClass = dark
    ? "px-2 py-2 text-xs font-medium text-white/75 transition hover:text-white sm:px-0 sm:text-sm"
    : "transition hover:text-ink";
  const buttonClass = dark
    ? "border border-white/35 bg-white/10 px-2.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:px-3 sm:py-1.5 sm:text-sm"
    : "border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-white";
  const accountClass = dark
    ? "bg-amber px-2.5 py-2 text-xs font-semibold text-ink transition hover:bg-amber-deep sm:px-3 sm:py-1.5 sm:text-sm"
    : "rounded-sm bg-ink px-3 py-2 text-sm text-white transition hover:bg-ink-soft";

  if (user === undefined) {
    return (
      <span
        className={
          dark
            ? "h-9 w-16 animate-pulse bg-white/10 sm:w-24"
            : "h-8 w-24 animate-pulse bg-ink/10"
        }
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <Link href="/join" className={accountClass}>
        Sign in
      </Link>
    );
  }

  return (
    <>
      <Link href="/account#my-trips" className={linkClass}>
        <span className="sm:hidden">Trips</span>
        <span className="hidden sm:inline">My trips</span>
      </Link>
      <Link href="/account" className={accountClass}>
        <span className="sm:hidden">Account</span>
        <span className="hidden sm:inline">My account</span>
      </Link>
      {user.role === "admin" ? (
        <Link href="/admin" className={`hidden sm:inline ${linkClass}`}>
          Admin
        </Link>
      ) : null}
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className={buttonClass}
      >
        {busy ? "…" : "Log out"}
      </button>
    </>
  );
}
