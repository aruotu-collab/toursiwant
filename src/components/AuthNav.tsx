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

type AuthNavProps = {
  variant?: "light" | "dark";
};

export function AuthNav({ variant = "light" }: AuthNavProps) {
  const pathname = usePathname();
  const router = useRouter();
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
    router.push("/");
    router.refresh();
    setBusy(false);
  }

  const dark = variant === "dark";
  const linkClass = dark
    ? "text-xs font-medium text-white/75 transition hover:text-white sm:text-sm"
    : "transition hover:text-ink";
  const buttonClass = dark
    ? "border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:text-sm"
    : "border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-white";
  const accountClass = dark
    ? "bg-amber px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-amber-deep sm:text-sm"
    : "rounded-sm bg-ink px-3 py-2 text-sm text-white transition hover:bg-ink-soft";

  if (user === undefined) {
    return (
      <span
        className={
          dark ? "h-8 w-24 animate-pulse bg-white/10" : "h-8 w-24 animate-pulse bg-ink/10"
        }
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <>
        <Link href="/join" className={`hidden lg:inline ${linkClass}`}>
          Sign in
        </Link>
        <Link
          href="/join?role=operator&next=/operator"
          className={accountClass}
        >
          Operators
        </Link>
      </>
    );
  }

  const label = user.name?.split(" ")[0] || user.email.split("@")[0];

  return (
    <>
      <Link href="/account" className={`hidden sm:inline ${linkClass}`}>
        Hi, {label}
      </Link>
      <Link href="/account" className={accountClass}>
        My account
      </Link>
      {user.role === "operator" || user.role === "admin" ? (
        <Link href="/operator" className={linkClass}>
          Inbox
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
