"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MAX_TRIP_DAYS,
  type DayAssignments,
} from "@/lib/scoreboard-plan";

const WANTS_KEY = "tiw_nyc_wants_v1";
const DAYS_KEY = "tiw_nyc_plan_days_v1";
const ASSIGN_KEY = "tiw_nyc_plan_day_assign_v1";

function clampDays(n: number) {
  if (!Number.isFinite(n)) return 3;
  return Math.min(MAX_TRIP_DAYS, Math.max(1, Math.round(n)));
}

function parseAssignments(raw: string | null): DayAssignments {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    const next: DayAssignments = {};
    for (const [slug, day] of Object.entries(parsed)) {
      const n = Number(day);
      if (typeof slug === "string" && Number.isFinite(n)) {
        next[slug] = clampDays(n);
      }
    }
    return next;
  } catch {
    return {};
  }
}

export function useNycWants() {
  const [wants, setWants] = useState<string[]>([]);
  const [days, setDaysState] = useState(3);
  const [dayAssignments, setDayAssignmentsState] = useState<DayAssignments>(
    {},
  );
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
      setDayAssignmentsState(parseAssignments(localStorage.getItem(ASSIGN_KEY)));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persistAssignments = useCallback((next: DayAssignments) => {
    setDayAssignmentsState(next);
    try {
      localStorage.setItem(ASSIGN_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback(
    (next: string[]) => {
      setWants(next);
      try {
        localStorage.setItem(WANTS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      // Drop assignments for places no longer wanted.
      setDayAssignmentsState((prev) => {
        const keep: DayAssignments = {};
        for (const slug of next) {
          if (prev[slug] != null) keep[slug] = prev[slug];
        }
        try {
          localStorage.setItem(ASSIGN_KEY, JSON.stringify(keep));
        } catch {
          /* ignore */
        }
        return keep;
      });
    },
    [],
  );

  const setDays = useCallback((next: number) => {
    const d = clampDays(next);
    setDaysState(d);
    try {
      localStorage.setItem(DAYS_KEY, String(d));
    } catch {
      /* ignore */
    }
    // Clamp pinned days into the new length.
    setDayAssignmentsState((prev) => {
      const keep: DayAssignments = {};
      for (const [slug, day] of Object.entries(prev)) {
        keep[slug] = Math.min(d, Math.max(1, day));
      }
      try {
        localStorage.setItem(ASSIGN_KEY, JSON.stringify(keep));
      } catch {
        /* ignore */
      }
      return keep;
    });
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

  const clear = useCallback(() => {
    persist([]);
    persistAssignments({});
  }, [persist, persistAssignments]);

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

  const setDayAssignments = persistAssignments;

  return {
    wants,
    days,
    dayAssignments,
    ready,
    toggle,
    clear,
    removeMany,
    isWanted,
    setWants: persist,
    setDays,
    setDayAssignments,
  };
}
