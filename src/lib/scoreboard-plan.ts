import { getPlaceBySlug, type NycPlace } from "@/lib/nyc-places";
import { computeTiwScore } from "@/lib/tiw-score";

export type PlanArea =
  | "Midtown"
  | "Downtown"
  | "West Side"
  | "East Side / UES"
  | "Brooklyn"
  | "Queens"
  | "Harlem / Uptown"
  | "Harbor"
  | "Flexible";

export type PlannedStop = {
  slug: string;
  name: string;
  neighborhood: string;
  area: PlanArea;
  hours: number;
  tiwScore: number;
  recommended: boolean;
};

export type PlanDay = {
  dayIndex: number;
  title: string;
  area: PlanArea;
  stops: PlannedStop[];
  hours: number;
};

export type BuiltPlan = {
  days: PlanDay[];
  recommended: PlannedStop[];
  overflow: PlannedStop[];
  selectedHours: number;
  capacityHours: number;
  note: string;
};

const AREA_ORDER: PlanArea[] = [
  "Midtown",
  "Harbor",
  "Downtown",
  "West Side",
  "East Side / UES",
  "Brooklyn",
  "Harlem / Uptown",
  "Queens",
  "Flexible",
];

export function areaForNeighborhood(neighborhood: string): PlanArea {
  const n = neighborhood.toLowerCase();
  if (n.includes("harbor") || n.includes("battery")) return "Harbor";
  if (
    n.includes("financial") ||
    n.includes("dumbo") ||
    n.includes("lower manhattan") ||
    n.includes("seaport")
  )
    return "Downtown";
  if (
    n.includes("chelsea") ||
    n.includes("meatpacking") ||
    n.includes("hudson yards") ||
    n.includes("hudson river") ||
    n.includes("soho") ||
    n.includes("west village") ||
    (n.includes("village") && !n.includes("jackson"))
  )
    return "West Side";
  if (n.includes("upper east") || n.includes("roosevelt"))
    return "East Side / UES";
  if (n.includes("harlem")) return "Harlem / Uptown";
  if (n.includes("upper west")) return "West Side";
  if (
    n.includes("brooklyn") ||
    n.includes("prospect") ||
    n.includes("coney") ||
    n.includes("park slope")
  )
    return "Brooklyn";
  if (
    n.includes("queens") ||
    n.includes("astoria") ||
    n.includes("flushing") ||
    n.includes("jackson")
  )
    return "Queens";
  if (n.includes("midtown") || n.includes("theater")) return "Midtown";
  return "Flexible";
}

export function estimateHours(place: NycPlace): number {
  const d = place.durationLabel.toLowerCase();
  if (d.includes("evening")) return 3.5;
  if (d.includes("half day")) return 4;
  if (d.includes("3–5") || d.includes("3-5")) return 4;
  if (d.includes("2–4") || d.includes("2-4")) return 3;
  if (d.includes("2–3") || d.includes("2-3")) return 2.5;
  if (d.includes("1–3") || d.includes("1-3")) return 2;
  if (d.includes("1–2") || d.includes("1-2")) return 1.5;
  if (d.includes("45") || d.includes("30")) return 1;
  return 2;
}

export const HOURS_PER_DAY = 8;
/** Upper bound for auto day-fit and the plan length dropdown. */
export const MAX_TRIP_DAYS = 14;

/**
 * Days the packed plan will actually use — same result as Build my trip.
 * (Not a rough places÷3 guess, which over-counted empty trailing days.)
 */
export function suggestedDaysForSelections(slugs: string[]): number {
  if (!slugs.length) return 1;
  const plan = buildPlanFromSelections(slugs, MAX_TRIP_DAYS);
  const used = plan.days.filter((d) => d.stops.length > 0).length;
  return Math.max(1, Math.min(MAX_TRIP_DAYS, used || 1));
}

/** slug → 1-based day index (manual placement overrides auto-pack). */
export type DayAssignments = Record<string, number>;

/**
 * Turn selected place slugs into a practical day-by-day plan.
 * Oversized lists get a recommended subset + overflow.
 * Optional dayAssignments pin places to a chosen day (e.g. move Day 10 → Day 8).
 */
export function buildPlanFromSelections(
  slugs: string[],
  dayCount: number,
  dayAssignments?: DayAssignments,
): BuiltPlan {
  const daysN = Math.max(1, Math.min(MAX_TRIP_DAYS, dayCount || 3));
  const capacityHours = daysN * HOURS_PER_DAY;

  const stops: PlannedStop[] = [];
  for (const slug of slugs) {
    const place = getPlaceBySlug(slug);
    if (!place) continue;
    stops.push({
      slug: place.slug,
      name: place.name,
      neighborhood: place.neighborhood,
      area: areaForNeighborhood(place.neighborhood),
      hours: estimateHours(place),
      tiwScore: computeTiwScore(place.factors, "overall"),
      recommended: true,
    });
  }

  const dayBuckets: PlannedStop[][] = Array.from({ length: daysN }, () => []);
  const dayHours = Array.from({ length: daysN }, () => 0);
  const pinned = new Set<string>();

  // Manual placements first — user intent wins over auto geography packing.
  if (dayAssignments) {
    for (const s of stops) {
      const day = dayAssignments[s.slug];
      if (!Number.isFinite(day)) continue;
      const idx = Math.round(day) - 1;
      if (idx < 0 || idx >= daysN) continue;
      dayBuckets[idx].push({ ...s, recommended: true });
      dayHours[idx] += s.hours;
      pinned.add(s.slug);
    }
  }

  const unpinned = stops.filter((s) => !pinned.has(s.slug));
  const pinnedHours = [...pinned].reduce((sum, slug) => {
    const s = stops.find((x) => x.slug === slug);
    return sum + (s?.hours || 0);
  }, 0);

  const byScore = [...unpinned].sort((a, b) => b.tiwScore - a.tiwScore);
  let used = pinnedHours;
  const autoIn: PlannedStop[] = [];
  const overflow: PlannedStop[] = [];
  for (const s of byScore) {
    if (used + s.hours <= capacityHours * 1.05 || autoIn.length + pinned.size < daysN) {
      autoIn.push({ ...s, recommended: true });
      used += s.hours;
    } else {
      overflow.push({ ...s, recommended: false });
    }
  }

  const byArea = new Map<PlanArea, PlannedStop[]>();
  for (const s of autoIn) {
    const list = byArea.get(s.area) || [];
    list.push(s);
    byArea.set(s.area, list);
  }

  const areaChunks: Array<{ area: PlanArea; stops: PlannedStop[] }> = [];
  for (const area of AREA_ORDER) {
    const list = byArea.get(area);
    if (list?.length) areaChunks.push({ area, stops: list });
  }

  // Pack unpinned stops into the earliest days that still have room.
  const flat = areaChunks.flatMap((c) => c.stops);

  for (const stop of flat) {
    let target = -1;
    for (let i = 0; i < daysN; i++) {
      if (dayHours[i] + stop.hours > HOURS_PER_DAY + 1.5) continue;
      if (dayBuckets[i].some((x) => x.area === stop.area)) {
        target = i;
        break;
      }
      if (target < 0) target = i;
    }
    if (target < 0) {
      target = 0;
      for (let i = 1; i < daysN; i++) {
        if (dayHours[i] < dayHours[target]) target = i;
      }
    }
    dayBuckets[target].push(stop);
    dayHours[target] += stop.hours;
  }

  const days: PlanDay[] = dayBuckets.map((bucket, i) => {
    const areaCounts = new Map<PlanArea, number>();
    for (const s of bucket) {
      areaCounts.set(s.area, (areaCounts.get(s.area) || 0) + 1);
    }
    const topArea =
      [...areaCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "Flexible";
    return {
      dayIndex: i + 1,
      title: `Day ${i + 1} — ${topArea}`,
      area: topArea,
      stops: bucket,
      hours: Math.round(dayHours[i] * 10) / 10,
    };
  });

  const recommended = days.flatMap((d) => d.stops);
  const selectedHours =
    Math.round(stops.reduce((a, s) => a + s.hours, 0) * 10) / 10;
  const hasPins = pinned.size > 0;
  const note =
    overflow.length > 0
      ? `You selected about ${selectedHours} hours of activities for a ${daysN}-day trip (≈${capacityHours} hours capacity). We kept the strongest ${recommended.length} by TIW Score and area fit; ${overflow.length} are hard to fit.`
      : hasPins
        ? `We kept your day moves and grouped the rest across ${daysN} days.`
        : `We grouped ${recommended.length} places across ${daysN} days to cut unnecessary cross-town travel.`;

  return {
    days,
    recommended,
    overflow,
    selectedHours,
    capacityHours,
    note,
  };
}

/** Snapshot every placed stop’s day so one move doesn’t reshuffle the rest. */
export function pinPlanDays(plan: BuiltPlan): DayAssignments {
  const next: DayAssignments = {};
  for (const day of plan.days) {
    for (const s of day.stops) next[s.slug] = day.dayIndex;
  }
  return next;
}
