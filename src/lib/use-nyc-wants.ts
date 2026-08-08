"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tiw_nyc_wants_v1";

export function useNycWants() {
  const [wants, setWants] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setWants(parsed.filter((x) => typeof x === "string"));
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: string[]) => {
    setWants(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    (slug: string) => {
      persist(
        wants.includes(slug)
          ? wants.filter((s) => s !== slug)
          : [...wants, slug],
      );
    },
    [persist, wants],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const isWanted = useCallback(
    (slug: string) => wants.includes(slug),
    [wants],
  );

  return { wants, ready, toggle, clear, isWanted, setWants: persist };
}
