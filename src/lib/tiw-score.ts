/**
 * ToursIWant Score — transparent 0–100 destination scoring.
 * Weights are public; category boards re-weight the same components.
 */

export type ScoreFactors = {
  travellerSatisfaction: number;
  popularity: number;
  value: number;
  uniqueness: number;
  convenience: number;
  familyAppeal: number;
  firstTimerValue: number;
  /** Higher = more walking required (used to invert for “low walking”). */
  walkingDemand: number;
};

export type ScoreboardLens =
  | "overall"
  | "families"
  | "couples"
  | "free"
  | "views"
  | "food"
  | "culture"
  | "history"
  | "low_walking"
  | "under_50"
  | "first_visit"
  | "evening"
  | "rainy_day";

/** Interest sorts — pick History, then Art & culture, etc. while building a trip. */
export const interestLenses: ScoreboardLens[] = [
  "history",
  "culture",
  "food",
  "views",
  "evening",
  "rainy_day",
];

export const practicalLenses: ScoreboardLens[] = [
  "overall",
  "first_visit",
  "families",
  "couples",
  "free",
  "under_50",
  "low_walking",
];

export const scoreFactorLabel: Record<keyof ScoreFactors, string> = {
  travellerSatisfaction: "Traveller satisfaction",
  popularity: "Popularity",
  value: "Value for money",
  uniqueness: "Uniqueness",
  convenience: "Ease of visit",
  familyAppeal: "Family appeal",
  firstTimerValue: "First-time visitor value",
  walkingDemand: "Walking demand",
};

/** Default overall TIW Score weights (sum = 1). */
export const overallWeights: Partial<Record<keyof ScoreFactors, number>> = {
  travellerSatisfaction: 0.3,
  popularity: 0.2,
  value: 0.15,
  uniqueness: 0.15,
  convenience: 0.1,
  firstTimerValue: 0.1,
};

const lensWeights: Record<
  ScoreboardLens,
  Partial<Record<keyof ScoreFactors, number>>
> = {
  overall: overallWeights,
  families: {
    familyAppeal: 0.35,
    travellerSatisfaction: 0.2,
    convenience: 0.15,
    value: 0.15,
    firstTimerValue: 0.1,
    popularity: 0.05,
  },
  couples: {
    uniqueness: 0.25,
    travellerSatisfaction: 0.25,
    firstTimerValue: 0.15,
    value: 0.15,
    popularity: 0.1,
    convenience: 0.1,
  },
  free: {
    value: 0.4,
    uniqueness: 0.2,
    travellerSatisfaction: 0.2,
    convenience: 0.1,
    firstTimerValue: 0.1,
  },
  views: {
    uniqueness: 0.3,
    travellerSatisfaction: 0.25,
    firstTimerValue: 0.2,
    popularity: 0.15,
    value: 0.1,
  },
  food: {
    travellerSatisfaction: 0.3,
    uniqueness: 0.25,
    value: 0.2,
    popularity: 0.15,
    convenience: 0.1,
  },
  culture: {
    uniqueness: 0.3,
    travellerSatisfaction: 0.25,
    firstTimerValue: 0.2,
    value: 0.15,
    popularity: 0.1,
  },
  history: {
    uniqueness: 0.3,
    firstTimerValue: 0.25,
    travellerSatisfaction: 0.2,
    popularity: 0.15,
    value: 0.1,
  },
  low_walking: {
    convenience: 0.35,
    travellerSatisfaction: 0.25,
    value: 0.15,
    firstTimerValue: 0.15,
    popularity: 0.1,
  },
  under_50: {
    value: 0.35,
    travellerSatisfaction: 0.25,
    uniqueness: 0.15,
    convenience: 0.15,
    firstTimerValue: 0.1,
  },
  first_visit: {
    firstTimerValue: 0.35,
    uniqueness: 0.2,
    travellerSatisfaction: 0.2,
    popularity: 0.15,
    convenience: 0.1,
  },
  evening: {
    uniqueness: 0.25,
    travellerSatisfaction: 0.25,
    popularity: 0.2,
    convenience: 0.15,
    value: 0.15,
  },
  rainy_day: {
    convenience: 0.3,
    travellerSatisfaction: 0.25,
    uniqueness: 0.2,
    value: 0.15,
    popularity: 0.1,
  },
};

export const scoreboardLenses: Array<{
  id: ScoreboardLens;
  label: string;
  blurb: string;
  group: "practical" | "interest";
}> = [
  { id: "overall", label: "Overall", blurb: "Balanced TIW Score", group: "practical" },
  {
    id: "first_visit",
    label: "First visit",
    blurb: "Icons you should not miss",
    group: "practical",
  },
  { id: "families", label: "Families", blurb: "Kid-friendly picks", group: "practical" },
  { id: "couples", label: "Couples", blurb: "Date-night energy", group: "practical" },
  { id: "free", label: "Free", blurb: "No ticket required", group: "practical" },
  { id: "under_50", label: "Under $50", blurb: "Strong value", group: "practical" },
  {
    id: "low_walking",
    label: "Low walking",
    blurb: "Easier on the feet",
    group: "practical",
  },
  {
    id: "history",
    label: "History",
    blurb: "Heritage, memorials, and historic sites",
    group: "interest",
  },
  {
    id: "culture",
    label: "Art & culture",
    blurb: "Museums, galleries, and the arts",
    group: "interest",
  },
  { id: "food", label: "Food", blurb: "Eat your way through", group: "interest" },
  { id: "views", label: "Views", blurb: "Skyline & vistas", group: "interest" },
  { id: "evening", label: "Evening", blurb: "After dark", group: "interest" },
  { id: "rainy_day", label: "Rainy day", blurb: "Mostly indoors", group: "interest" },
];

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeTiwScore(
  factors: ScoreFactors,
  lens: ScoreboardLens = "overall",
): number {
  const weights = lensWeights[lens] || overallWeights;
  let sum = 0;
  let weightTotal = 0;

  for (const [key, weight] of Object.entries(weights) as Array<
    [keyof ScoreFactors, number]
  >) {
    if (!weight) continue;
    let value = factors[key];
    // For low-walking lens, invert walking demand into a convenience-like signal
    if (key === "walkingDemand") {
      value = 100 - factors.walkingDemand;
    }
    sum += value * weight;
    weightTotal += weight;
  }

  // Low walking: also blend inverted walking demand
  if (lens === "low_walking") {
    const walkEase = 100 - factors.walkingDemand;
    sum += walkEase * 0.2;
    weightTotal += 0.2;
  }

  if (!weightTotal) return 0;
  return clampScore(sum / weightTotal);
}

export function scoreExplanation(
  name: string,
  factors: ScoreFactors,
  score: number,
): string {
  const highs: string[] = [];
  const lows: string[] = [];
  const pairs: Array<[string, number]> = [
    ["traveller interest", factors.travellerSatisfaction],
    ["first-visit value", factors.firstTimerValue],
    ["uniqueness", factors.uniqueness],
    ["popularity", factors.popularity],
    ["value", factors.value],
    ["convenience", factors.convenience],
    ["family appeal", factors.familyAppeal],
  ];
  const sorted = [...pairs].sort((a, b) => b[1] - a[1]);
  for (const [label, n] of sorted.slice(0, 2)) {
    if (n >= 88) highs.push(label);
  }
  for (const [label, n] of [...pairs].sort((a, b) => a[1] - b[1]).slice(0, 2)) {
    if (n <= 82) lows.push(label);
  }

  const highBit = highs.length
    ? `Strong ${highs.join(" and ")}`
    : "Solid across the board";
  const lowBit = lows.length
    ? ` It loses a little on ${lows.join(" and ")}.`
    : "";

  return `${name} scores ${score}/100. ${highBit}.${lowBit}`;
}
