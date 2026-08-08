"use client";

import { useCallback, useEffect, useState } from "react";
import { MAX_TRIP_DAYS } from "@/lib/scoreboard-plan";

const WANTS_KEY = "tiw_nyc_wants_v1";
const DAYS_KEY = "tiw_nyc_plan_days_v1";

function clampDays(n: number) {
  if (!Number.isFinite(n)) return 3;
  return Math.min(MAX_TRIP_DAYS, Math.max(1, Math.round(n)));
}

export function useNycWants() {
  const [wants, setWants] = useState<string[]>([]);
  const [days, setDaysState] = useState(3);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WANTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed))
          setWants(parsed.filter((x) => typeof x === "string"));
      }
      const daysRaw = localStorage.getItem(DAYS_KEY);
      if (daysRaw) {
        const n = Number(daysRaw);
        if (Number.isFinite(n)) setDaysState(clampDays(n));
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: string[]) => {
    setWants(next);
    try {
      localStorage.setItem(WANTS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const setDays = useCallback((next: number) => {
    const d = clampDays(next);
    setDaysState(d);
    try {
      localStorage.setItem(DAYS_KEY, String(d));
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

  const removeMany = useCallback(
    (slugs: string[]) => {
      if (!slugs.length) return;
      const drop = new Set(slugs);
      persist(wants.filter((s) => !drop.has(s)));
    },
    [persist, wants],
  );

  const isWanted = useCallback(
    (slug: string) => wants.includes(slug),
    [wants],
  );

  return {
    wants,
    days,
    ready,
    toggle,
    clear,
    removeMany,
    isWanted,
    setWants: persist,
    setDays,
  };
}
