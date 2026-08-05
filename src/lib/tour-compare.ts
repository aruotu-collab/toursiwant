/**
 * ToursIWant comparison engine — deterministic ranking + explanations.
 * Viator supplies inventory; we turn noise into decisions.
 */

export type TriState = "yes" | "no" | "unknown";

export type ComparePriority =
  | "overall"
  | "value"
  | "reviews"
  | "convenient"
  | "family"
  | "short"
  | "premium";

export type NormalizedTour = {
  id: string;
  productCode: string;
  title: string;
  destination: string;
  attractionHint: string;
  durationMinutes: number | null;
  priceFrom: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number;
  productUrl: string;
  bookingPath: string;
  hotelPickup: TriState;
  guideIncluded: TriState;
  admissionIncluded: TriState;
  mealsIncluded: TriState;
  transportIncluded: TriState;
  flexibleCancellation: TriState;
  familyFriendly: TriState;
  smallGroup: TriState;
  ellisIsland: TriState;
  wheelchairInfo: TriState;
  inclusionsHint: string[];
  exclusionsHint: string[];
  summary: string;
  imageUrl?: string;
};

export type ComparePrefs = {
  query: string;
  citySlug: string;
  date?: string;
  adults: number;
  children: number;
  budgetPerPerson?: number;
  priority: ComparePriority;
  maxDurationHours?: number;
  minRating?: number;
};

export type ScoredTour = NormalizedTour & {
  qualityScore: number;
  fitScore: number;
  matchPercent: number;
  reviewConfidence: "very_strong" | "strong" | "moderate" | "limited";
  estimatedGroupPrice: number | null;
  groupPriceLabel: string;
  likes: string[];
  watchOuts: string[];
  whyWins: string;
  whyNotHigher?: string;
};

export type TourAward =
  | "best_overall"
  | "best_value"
  | "best_reviewed"
  | "most_convenient"
  | "best_fit"
  | "best_for_families"
  | "best_short"
  | "best_premium";

export type AwardedTour = {
  award: TourAward;
  label: string;
  tour: ScoredTour;
};

export type CompareFunnel = {
  analysed: number;
  afterBudget: number;
  afterRating: number;
  afterDuration: number;
  afterPreferences: number;
};

export type CompareResult = {
  query: string;
  citySlug: string;
  cityName: string;
  funnel: CompareFunnel;
  awards: AwardedTour[];
  shortlist: ScoredTour[];
  allScored: ScoredTour[];
  source: "viator" | "none";
  env?: string;
  error?: string;
};

export const comparePriorities: {
  id: ComparePriority;
  label: string;
  blurb: string;
}[] = [
  { id: "overall", label: "Best overall", blurb: "Balanced score" },
  { id: "value", label: "Lowest total cost / value", blurb: "Benefits vs price" },
  { id: "reviews", label: "Best reviews", blurb: "Rating + confidence" },
  { id: "convenient", label: "Most convenient", blurb: "Pickup & duration" },
  { id: "family", label: "Family-friendly", blurb: "Kids & groups" },
  { id: "short", label: "Shortest duration", blurb: "Time-tight days" },
  { id: "premium", label: "Premium / small group", blurb: "Upscale picks" },
];

export const compareCities = [
  { slug: "new-york", name: "New York" },
  { slug: "los-angeles", name: "Los Angeles" },
  { slug: "las-vegas", name: "Las Vegas" },
  { slug: "miami", name: "Miami" },
  { slug: "orlando", name: "Orlando" },
  { slug: "chicago", name: "Chicago" },
  { slug: "san-francisco", name: "San Francisco" },
  { slug: "washington-dc", name: "Washington DC" },
  { slug: "boston", name: "Boston" },
  { slug: "new-orleans", name: "New Orleans" },
  { slug: "seattle", name: "Seattle" },
  { slug: "houston", name: "Houston" },
  { slug: "dallas", name: "Dallas" },
  { slug: "atlanta", name: "Atlanta" },
  { slug: "san-diego", name: "San Diego" },
  { slug: "philadelphia", name: "Philadelphia" },
  { slug: "honolulu", name: "Honolulu" },
  { slug: "nashville", name: "Nashville" },
  { slug: "denver", name: "Denver" },
  { slug: "phoenix", name: "Phoenix" },
];

export const nycQuickSearches = [
  { label: "Statue of Liberty", query: "Statue of Liberty", citySlug: "new-york" },
  { label: "Empire State", query: "Empire State Building", citySlug: "new-york" },
  { label: "Central Park", query: "Central Park tour", citySlug: "new-york" },
  { label: "9/11 Memorial", query: "9/11 Memorial Museum", citySlug: "new-york" },
  { label: "Hop-on hop-off", query: "hop on hop off bus", citySlug: "new-york" },
  { label: "Food tours", query: "food tour", citySlug: "new-york" },
  { label: "Broadway", query: "Broadway tour", citySlug: "new-york" },
  { label: "Helicopter", query: "helicopter tour", citySlug: "new-york" },
];

function triFromText(
  text: string,
  yesPatterns: RegExp[],
  noPatterns: RegExp[] = [],
): TriState {
  const t = text.toLowerCase();
  if (noPatterns.some((p) => p.test(t))) return "no";
  if (yesPatterns.some((p) => p.test(t))) return "yes";
  return "unknown";
}

function parseDurationMinutes(text: string): number | null {
  const t = text.toLowerCase();
  const hours = t.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/);
  const mins = t.match(/(\d+)\s*(?:minutes?|mins?)/);
  if (hours) return Math.round(Number(hours[1]) * 60);
  if (mins) return Number(mins[1]);
  const half = t.match(/half[\s-]?day/);
  if (half) return 240;
  const full = t.match(/full[\s-]?day/);
  if (full) return 480;
  return null;
}

export function normalizeFromViatorLike(input: {
  productCode: string;
  title: string;
  description?: string;
  productUrl: string;
  priceFrom?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  flags?: string[];
  imageUrl?: string;
  destination?: string;
}): NormalizedTour {
  const blob = `${input.title} ${input.description || ""}`;
  const flags = input.flags || [];
  const inclusionsHint: string[] = [];
  const exclusionsHint: string[] = [];

  const hotelPickup = triFromText(
    blob,
    [/hotel pickup/, /pick[\s-]?up from (?:your )?hotel/, /includes pickup/],
    [/no hotel pickup/, /pickup not included/, /own way to/],
  );
  const guideIncluded = triFromText(
    blob,
    [/guided/, /live guide/, /tour guide/, /expert guide/],
    [/self[\s-]?guided/, /audio guide only/],
  );
  const admissionIncluded = triFromText(
    blob,
    [/admission included/, /ticket included/, /entry included/, /includes admission/],
    [/admission not included/, /tickets not included/, /entry fee not/],
  );
  const mealsIncluded = triFromText(blob, [/lunch included/, /meal included/, /breakfast included/]);
  const transportIncluded = triFromText(
    blob,
    [/ferry included/, /boat included/, /transport included/, /round[\s-]?trip/],
  );
  const ellisIsland = triFromText(blob, [/ellis island/]);
  const familyFriendly = triFromText(
    blob,
    [/family/, /kids/, /children/, /all ages/],
  );
  const smallGroup = triFromText(
    blob,
    [/small group/, /private tour/, /max \d+ (?:guests|people)/],
  );
  const flexibleCancellation: TriState = flags.includes("FREE_CANCELLATION")
    ? "yes"
    : triFromText(blob, [/free cancellation/, /cancel for free/]);

  if (hotelPickup === "yes") inclusionsHint.push("Hotel pickup");
  if (admissionIncluded === "yes") inclusionsHint.push("Admission");
  if (ellisIsland === "yes") inclusionsHint.push("Ellis Island");
  if (guideIncluded === "yes") inclusionsHint.push("Guide");
  if (flexibleCancellation === "yes") inclusionsHint.push("Flexible cancellation");
  if (hotelPickup === "no") exclusionsHint.push("Hotel pickup not included");
  if (admissionIncluded === "no") exclusionsHint.push("Admission not included");

  return {
    id: input.productCode,
    productCode: input.productCode,
    title: input.title,
    destination: input.destination || "New York",
    attractionHint: input.title,
    durationMinutes: parseDurationMinutes(blob),
    priceFrom: input.priceFrom ?? null,
    currency: input.currency || "USD",
    rating: input.rating ?? null,
    reviewCount: input.reviewCount ?? 0,
    productUrl: input.productUrl,
    bookingPath: `/go/viator/${encodeURIComponent(input.productCode)}`,
    hotelPickup,
    guideIncluded,
    admissionIncluded,
    mealsIncluded,
    transportIncluded,
    flexibleCancellation,
    familyFriendly,
    smallGroup,
    ellisIsland,
    wheelchairInfo: "unknown",
    inclusionsHint,
    exclusionsHint,
    summary: (input.description || "").replace(/\s+/g, " ").trim().slice(0, 180),
    imageUrl: input.imageUrl,
  };
}

function reviewConfidence(
  rating: number | null,
  count: number,
): ScoredTour["reviewConfidence"] {
  if (count >= 2000 && (rating || 0) >= 4.5) return "very_strong";
  if (count >= 500 && (rating || 0) >= 4.3) return "strong";
  if (count >= 80) return "moderate";
  return "limited";
}

function qualityScore(tour: NormalizedTour): number {
  let score = 40;
  const rating = tour.rating || 0;
  const reviews = tour.reviewCount;
  score += Math.min(25, rating * 4);
  score += Math.min(20, Math.log10(reviews + 1) * 8);
  if (tour.admissionIncluded === "yes") score += 6;
  if (tour.hotelPickup === "yes") score += 5;
  if (tour.guideIncluded === "yes") score += 4;
  if (tour.flexibleCancellation === "yes") score += 4;
  if (tour.ellisIsland === "yes") score += 3;
  if (tour.smallGroup === "yes") score += 3;
  if (reviews < 30) score -= 8;
  return Math.max(0, Math.min(100, score));
}

function fitScore(tour: NormalizedTour, prefs: ComparePrefs): number {
  let score = 50;
  const travellers = Math.max(1, prefs.adults + prefs.children);
  const price = tour.priceFrom;

  if (prefs.budgetPerPerson != null && price != null) {
    if (price <= prefs.budgetPerPerson) score += 18;
    else if (price <= prefs.budgetPerPerson * 1.15) score += 6;
    else score -= Math.min(25, (price - prefs.budgetPerPerson) / 4);
  }

  if (prefs.minRating != null && tour.rating != null) {
    if (tour.rating >= prefs.minRating) score += 10;
    else score -= 12;
  }

  if (prefs.maxDurationHours != null && tour.durationMinutes != null) {
    const maxMin = prefs.maxDurationHours * 60;
    if (tour.durationMinutes <= maxMin) score += 10;
    else score -= Math.min(20, (tour.durationMinutes - maxMin) / 15);
  }

  switch (prefs.priority) {
    case "value":
      if (price != null) score += Math.max(0, 18 - price / 8);
      if (tour.admissionIncluded === "yes") score += 8;
      break;
    case "reviews":
      score += Math.min(20, Math.log10(tour.reviewCount + 1) * 7);
      score += (tour.rating || 0) * 3;
      break;
    case "convenient":
      if (tour.hotelPickup === "yes") score += 16;
      if (tour.durationMinutes != null && tour.durationMinutes <= 240) score += 6;
      break;
    case "family":
      if (tour.familyFriendly === "yes") score += 14;
      if (prefs.children > 0) score += 6;
      if (tour.ellisIsland === "yes") score += 4;
      break;
    case "short":
      if (tour.durationMinutes != null) {
        score += Math.max(0, 20 - tour.durationMinutes / 20);
      }
      break;
    case "premium":
      if (tour.smallGroup === "yes") score += 12;
      if (tour.hotelPickup === "yes") score += 6;
      if ((tour.priceFrom || 0) >= 90) score += 4;
      break;
    default:
      score += qualityScore(tour) * 0.15;
  }

  // Slight bias that more travellers care about total clarity
  if (travellers >= 3 && tour.admissionIncluded === "yes") score += 3;

  return Math.max(0, Math.min(100, score));
}

function buildLikes(tour: NormalizedTour, prefs: ComparePrefs): string[] {
  const likes: string[] = [];
  if (
    prefs.budgetPerPerson != null &&
    tour.priceFrom != null &&
    tour.priceFrom <= prefs.budgetPerPerson
  ) {
    likes.push("Fits your budget");
  }
  if (tour.rating != null && tour.rating >= 4.5 && tour.reviewCount >= 100) {
    likes.push("Strong review evidence");
  }
  if (tour.admissionIncluded === "yes") likes.push("Main admission included");
  if (tour.ellisIsland === "yes") likes.push("Ellis Island included");
  if (tour.hotelPickup === "yes") likes.push("Hotel pickup included");
  if (tour.flexibleCancellation === "yes") likes.push("Flexible cancellation");
  if (tour.guideIncluded === "yes") likes.push("Guided experience");
  if (tour.familyFriendly === "yes" && prefs.children > 0) {
    likes.push("Family-friendly signals");
  }
  return likes.slice(0, 5);
}

function buildWatchOuts(tour: NormalizedTour): string[] {
  const w: string[] = [];
  if (tour.hotelPickup === "no") w.push("Hotel pickup not included");
  if (tour.hotelPickup === "unknown") w.push("Hotel pickup not clearly specified");
  if (tour.admissionIncluded === "no") w.push("Admission may not be included");
  if (tour.admissionIncluded === "unknown") {
    w.push("Admission inclusion not clearly specified");
  }
  if (tour.wheelchairInfo === "unknown") {
    w.push("Wheelchair details not clearly specified");
  }
  if (tour.reviewCount < 50) w.push("Limited review evidence");
  return w.slice(0, 4);
}

function whyWins(tour: ScoredTour, prefs: ComparePrefs): string {
  const bits: string[] = [];
  if (
    prefs.budgetPerPerson != null &&
    tour.priceFrom != null &&
    tour.priceFrom <= prefs.budgetPerPerson
  ) {
    bits.push(`fits your $${prefs.budgetPerPerson} budget`);
  }
  if (tour.ellisIsland === "yes") bits.push("includes Ellis Island");
  if (tour.admissionIncluded === "yes") bits.push("includes main admission");
  if (tour.hotelPickup === "yes") bits.push("includes hotel pickup");
  if (tour.reviewCount >= 500) {
    bits.push(`has ${tour.reviewCount.toLocaleString()} reviews`);
  } else if (tour.rating != null) {
    bits.push(`rates ${tour.rating.toFixed(1)}★`);
  }
  if (tour.durationMinutes) {
    bits.push(`runs about ${(tour.durationMinutes / 60).toFixed(1)} hours`);
  }
  if (!bits.length) {
    return "Strong overall balance of price, reviews and inclusions among analysed options.";
  }
  return `This ranks highly because it ${bits.slice(0, 4).join(", ")}.`;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount)}`;
  }
}

export function scoreTour(tour: NormalizedTour, prefs: ComparePrefs): ScoredTour {
  const quality = qualityScore(tour);
  const fit = fitScore(tour, prefs);
  const matchPercent = Math.round(quality * 0.45 + fit * 0.55);
  const travellers = Math.max(1, prefs.adults + prefs.children);
  const estimatedGroupPrice =
    tour.priceFrom != null ? Math.round(tour.priceFrom * travellers) : null;

  const scored: ScoredTour = {
    ...tour,
    qualityScore: Math.round(quality),
    fitScore: Math.round(fit),
    matchPercent,
    reviewConfidence: reviewConfidence(tour.rating, tour.reviewCount),
    estimatedGroupPrice,
    groupPriceLabel:
      estimatedGroupPrice != null
        ? `Est. group total ${formatMoney(estimatedGroupPrice, tour.currency)} (${travellers} travellers · from-price)`
        : "Group total — verify on Viator",
    likes: [],
    watchOuts: [],
    whyWins: "",
  };
  scored.likes = buildLikes(scored, prefs);
  scored.watchOuts = buildWatchOuts(scored);
  scored.whyWins = whyWins(scored, prefs);
  return scored;
}

function passesHardConstraints(tour: NormalizedTour, prefs: ComparePrefs) {
  if (
    prefs.budgetPerPerson != null &&
    tour.priceFrom != null &&
    tour.priceFrom > prefs.budgetPerPerson * 1.35
  ) {
    return false;
  }
  if (
    prefs.minRating != null &&
    tour.rating != null &&
    tour.rating < prefs.minRating - 0.3
  ) {
    return false;
  }
  if (
    prefs.maxDurationHours != null &&
    tour.durationMinutes != null &&
    tour.durationMinutes > prefs.maxDurationHours * 60 * 1.25
  ) {
    return false;
  }
  return true;
}

export function runComparison(
  tours: NormalizedTour[],
  prefs: ComparePrefs,
): Omit<CompareResult, "cityName" | "source" | "env" | "error"> {
  const analysed = tours.length;
  let pool = [...tours];

  const afterBudget =
    prefs.budgetPerPerson != null
      ? pool.filter(
          (t) => t.priceFrom == null || t.priceFrom <= prefs.budgetPerPerson! * 1.35,
        )
      : pool;
  pool = afterBudget;

  const afterRating =
    prefs.minRating != null
      ? pool.filter((t) => t.rating == null || t.rating >= prefs.minRating! - 0.3)
      : pool;
  pool = afterRating;

  const afterDuration =
    prefs.maxDurationHours != null
      ? pool.filter(
          (t) =>
            t.durationMinutes == null ||
            t.durationMinutes <= prefs.maxDurationHours! * 60 * 1.25,
        )
      : pool;
  pool = afterDuration;

  const scored = pool
    .filter((t) => passesHardConstraints(t, prefs))
    .map((t) => scoreTour(t, prefs))
    .sort((a, b) => b.matchPercent - a.matchPercent || b.qualityScore - a.qualityScore);

  const afterPreferences = scored.length;
  const shortlist = scored.slice(0, 8);

  const awards: AwardedTour[] = [];
  const used = new Set<string>();

  function take(
    award: TourAward,
    label: string,
    pick: (list: ScoredTour[]) => ScoredTour | undefined,
  ) {
    const tour = pick(scored.filter((t) => !used.has(t.id)));
    if (!tour) return;
    used.add(tour.id);
    awards.push({ award, label, tour });
  }

  take("best_overall", "Best Overall", (list) => list[0]);
  take("best_value", "Best Value", (list) =>
    [...list].sort((a, b) => {
      const va =
        (a.admissionIncluded === "yes" ? 20 : 0) +
        (a.durationMinutes || 120) / 10 -
        (a.priceFrom || 999) / 5;
      const vb =
        (b.admissionIncluded === "yes" ? 20 : 0) +
        (b.durationMinutes || 120) / 10 -
        (b.priceFrom || 999) / 5;
      return vb - va;
    })[0],
  );
  take("best_reviewed", "Best Reviewed", (list) =>
    [...list].sort(
      (a, b) =>
        b.reviewCount * (b.rating || 0) - a.reviewCount * (a.rating || 0),
    )[0],
  );
  take("most_convenient", "Most Convenient", (list) =>
    [...list].sort((a, b) => {
      const sa =
        (a.hotelPickup === "yes" ? 40 : 0) -
        (a.durationMinutes || 300) / 20;
      const sb =
        (b.hotelPickup === "yes" ? 40 : 0) -
        (b.durationMinutes || 300) / 20;
      return sb - sa;
    })[0],
  );
  take("best_fit", "Best Fit for You", (list) =>
    [...list].sort((a, b) => b.fitScore - a.fitScore)[0],
  );

  if (prefs.priority === "family" || prefs.children > 0) {
    take("best_for_families", "Best for Families", (list) =>
      [...list].sort((a, b) => {
        const sa =
          (a.familyFriendly === "yes" ? 30 : 0) +
          (a.ellisIsland === "yes" ? 8 : 0) +
          a.fitScore;
        const sb =
          (b.familyFriendly === "yes" ? 30 : 0) +
          (b.ellisIsland === "yes" ? 8 : 0) +
          b.fitScore;
        return sb - sa;
      })[0],
    );
  }
  if (prefs.priority === "short") {
    take("best_short", "Best Short Tour", (list) =>
      [...list]
        .filter((t) => t.durationMinutes != null)
        .sort((a, b) => (a.durationMinutes || 999) - (b.durationMinutes || 999))[0],
    );
  }
  if (prefs.priority === "premium") {
    take("best_premium", "Best Premium Choice", (list) =>
      [...list].sort((a, b) => {
        const sa =
          (a.smallGroup === "yes" ? 25 : 0) +
          (a.hotelPickup === "yes" ? 10 : 0) +
          (a.priceFrom || 0) / 10;
        const sb =
          (b.smallGroup === "yes" ? 25 : 0) +
          (b.hotelPickup === "yes" ? 10 : 0) +
          (b.priceFrom || 0) / 10;
        return sb - sa;
      })[0],
    );
  }

  // Fill whyNotHigher for shortlist ranks 2+
  for (let i = 1; i < shortlist.length; i++) {
    const t = shortlist[i];
    const top = shortlist[0];
    const gaps: string[] = [];
    if (
      top.priceFrom != null &&
      t.priceFrom != null &&
      t.priceFrom > top.priceFrom
    ) {
      gaps.push(
        `costs about ${formatMoney(t.priceFrom - top.priceFrom, t.currency)} more per person than the top pick`,
      );
    }
    if (top.reviewCount > t.reviewCount * 2) {
      gaps.push("has fewer reviews than the leading option");
    }
    if (top.hotelPickup === "yes" && t.hotelPickup !== "yes") {
      gaps.push("does not clearly include hotel pickup");
    }
    if (top.ellisIsland === "yes" && t.ellisIsland !== "yes") {
      gaps.push("does not clearly include Ellis Island");
    }
    t.whyNotHigher = gaps.length
      ? `Ranks lower because it ${gaps.slice(0, 2).join(" and ")}.`
      : "Still a strong option — slightly behind on the blended fit score.";
  }

  return {
    query: prefs.query,
    citySlug: prefs.citySlug,
    funnel: {
      analysed,
      afterBudget: afterBudget.length,
      afterRating: afterRating.length,
      afterDuration: afterDuration.length,
      afterPreferences,
    },
    awards: awards.slice(0, 6),
    shortlist,
    allScored: scored,
  };
}

export function triLabel(v: TriState) {
  if (v === "yes") return "Yes";
  if (v === "no") return "No";
  return "Not specified";
}

export function formatDuration(minutes: number | null) {
  if (minutes == null) return "See partner";
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return `${h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)} hr`;
}

export function formatFromPrice(tour: NormalizedTour) {
  if (tour.priceFrom == null) return "Check price";
  return formatMoney(tour.priceFrom, tour.currency);
}
