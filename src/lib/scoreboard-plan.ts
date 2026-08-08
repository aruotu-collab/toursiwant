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

/** How many days the current wants need (1–7), from hours + place count. */
export function suggestedDaysForSelections(slugs: string[]): number {
  let hours = 0;
  let count = 0;
  for (const slug of slugs) {
    const place = getPlaceBySlug(slug);
    if (!place) continue;
    hours += estimateHours(place);
    count += 1;
  }
  if (!count) return 1;
  const byHours = Math.ceil(hours / HOURS_PER_DAY - 1e-9) || 1;
  const byCount = Math.ceil(count / 4); // ~4 stops per day before adding a day
  return Math.min(7, Math.max(1, byHours, byCount));
}

/**
 * Turn selected place slugs into a practical day-by-day plan.
 * Oversized lists get a recommended subset + overflow.
 */
export function buildPlanFromSelections(
  slugs: string[],
  dayCount: number,
): BuiltPlan {
  const daysN = Math.max(1, Math.min(7, dayCount || 3));
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

  const byScore = [...stops].sort((a, b) => b.tiwScore - a.tiwScore);
  let used = 0;
  const recommended: PlannedStop[] = [];
  const overflow: PlannedStop[] = [];
  for (const s of byScore) {
    if (used + s.hours <= capacityHours * 1.05 || recommended.length < daysN) {
      recommended.push({ ...s, recommended: true });
      used += s.hours;
    } else {
      overflow.push({ ...s, recommended: false });
    }
  }

  const byArea = new Map<PlanArea, PlannedStop[]>();
  for (const s of recommended) {
    const list = byArea.get(s.area) || [];
    list.push(s);
    byArea.set(s.area, list);
  }

  const areaChunks: Array<{ area: PlanArea; stops: PlannedStop[] }> = [];
  for (const area of AREA_ORDER) {
    const list = byArea.get(area);
    if (list?.length) areaChunks.push({ area, stops: list });
  }

  const dayBuckets: PlannedStop[][] = Array.from({ length: daysN }, () => []);
  const dayHours = Array.from({ length: daysN }, () => 0);

  // Pack area groups into the earliest days that still have room so later
  // days can stay empty (and the trip can shrink when those days are cleared).
  const flat = areaChunks.flatMap((c) => c.stops);

  for (const stop of flat) {
    let target = -1;
    // Prefer an earlier day that already has this area and has capacity.
    for (let i = 0; i < daysN; i++) {
      if (dayHours[i] + stop.hours > HOURS_PER_DAY + 1.5) continue;
      if (dayBuckets[i].some((x) => x.area === stop.area)) {
        target = i;
        break;
      }
      if (target < 0) target = i; // first day with room
    }
    if (target < 0) {
      // Over capacity — put on the earliest lightest day
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

  const selectedHours =
    Math.round(stops.reduce((a, s) => a + s.hours, 0) * 10) / 10;
  const note =
    overflow.length > 0
      ? `You selected about ${selectedHours} hours of activities for a ${daysN}-day trip (≈${capacityHours} hours capacity). We kept the strongest ${recommended.length} by TIW Score and area fit; ${overflow.length} are hard to fit.`
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
