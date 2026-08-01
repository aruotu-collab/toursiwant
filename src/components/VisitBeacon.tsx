"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function sessionKey() {
  try {
    const key = "tiw_vid";
    let value = window.localStorage.getItem(key);
    if (!value) {
      value = `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(key, value);
    }
    return value;
  } catch {
    return undefined;
  }
}

function VisitBeaconInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSent = useRef("");

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (!path || path === lastSent.current) return;
    lastSent.current = path;

    const payload = JSON.stringify({
      path,
      referrer: document.referrer || undefined,
      sessionKey: sessionKey(),
    });

    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }, [pathname, searchParams]);

  return null;
}

export function VisitBeacon() {
  return (
    <Suspense fallback={null}>
      <VisitBeaconInner />
    </Suspense>
  );
}
