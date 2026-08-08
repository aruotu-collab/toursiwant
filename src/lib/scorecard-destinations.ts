import {
  cityCatalogs,
  rankCityPlaces,
} from "@/lib/places/registry";
import {
  formatCompactCount,
  sampleExplorerBase,
  sampleLikeBase,
} from "@/lib/sample-likes";

export type ScorecardDestinationStats = {
  placesLabel: string;
  likesLabel: string;
  explorersLabel: string;
  topScoreLabel?: string;
};

export type ScorecardDestination = {
  id: string;
  country: string;
  state: string;
  city: string;
  /** Live board path, or null if coming soon */
  href: string | null;
  placeCount?: number;
  blurb: string;
  stats?: ScorecardDestinationStats;
  cta?: string;
};

function liveCard(opts: {
  id: string;
  places: { slug: string; tiwScore: number }[];
}) {
  const likes = opts.places.reduce(
    (sum, p) => sum + sampleLikeBase(p.slug, p.tiwScore),
    0,
  );
  const top = opts.places[0]?.tiwScore;
  return {
    placeCount: opts.places.length,
    stats: {
      placesLabel: `${opts.places.length} places ranked`,
      likesLabel: `${formatCompactCount(likes)} likes`,
      explorersLabel: `${formatCompactCount(sampleExplorerBase(opts.id))} explorers`,
      topScoreLabel:
        typeof top === "number" ? `Top score ${Math.round(top)}` : undefined,
    } satisfies ScorecardDestinationStats,
    cta: "See what's worth doing",
  };
}

/** Destinations people can open from the Scorecard hub. */
export const scorecardDestinations: ScorecardDestination[] = cityCatalogs.map(
  (c) => {
    const ranked = rankCityPlaces(c.places, "overall");
    const card = liveCard({
      id: `${c.slug}-live`,
      places: ranked.map((p) => ({ slug: p.slug, tiwScore: p.tiwScore })),
    });
    return {
      id: `${c.slug}-${c.state.toLowerCase().replace(/\s+/g, "-")}`,
      country: c.country,
      state: c.state,
      city: c.name,
      href: c.href,
      placeCount: card.placeCount,
      blurb: c.blurb,
      stats: card.stats,
      cta: card.cta,
    };
  },
);

export function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function scorecardCountries() {
  return uniqueSorted(scorecardDestinations.map((d) => d.country));
}

export function scorecardStates(country?: string) {
  const list = country
    ? scorecardDestinations.filter((d) => d.country === country)
    : scorecardDestinations;
  return uniqueSorted(list.map((d) => d.state));
}

export function scorecardCities(country?: string, state?: string) {
  let list = scorecardDestinations;
  if (country) list = list.filter((d) => d.country === country);
  if (state) list = list.filter((d) => d.state === state);
  return uniqueSorted(list.map((d) => d.city));
}
