import { rankNycPlaces } from "@/lib/nyc-places";
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
  /** Social proof + board teaser for live destinations */
  stats?: ScorecardDestinationStats;
  cta?: string;
};

function nycLiveCard() {
  const ranked = rankNycPlaces("overall");
  const likes = ranked.reduce(
    (sum, p) => sum + sampleLikeBase(p.slug, p.tiwScore),
    0,
  );
  const top = ranked[0]?.tiwScore;
  return {
    placeCount: ranked.length,
    blurb:
      "Icons, neighborhoods, and hidden gems — ranked so you know what's worth your days.",
    stats: {
      placesLabel: `${ranked.length} places ranked`,
      likesLabel: `${formatCompactCount(likes)} likes`,
      explorersLabel: `${formatCompactCount(sampleExplorerBase("new-york-ny"))} explorers`,
      topScoreLabel:
        typeof top === "number" ? `Top score ${Math.round(top)}` : undefined,
    } satisfies ScorecardDestinationStats,
    cta: "See what's worth doing",
  };
}

const nyc = nycLiveCard();

/** Destinations people can open from the Scorecard hub. */
export const scorecardDestinations: ScorecardDestination[] = [
  {
    id: "new-york-ny",
    country: "United States",
    state: "New York",
    city: "New York City",
    href: "/new-york",
    placeCount: nyc.placeCount,
    blurb: nyc.blurb,
    stats: nyc.stats,
    cta: nyc.cta,
  },
  {
    id: "los-angeles-ca",
    country: "United States",
    state: "California",
    city: "Los Angeles",
    href: null,
    blurb: "Coming soon — Hollywood, beaches, and food neighborhoods.",
  },
  {
    id: "chicago-il",
    country: "United States",
    state: "Illinois",
    city: "Chicago",
    href: null,
    blurb: "Coming soon — architecture, museums, and lakefront.",
  },
  {
    id: "miami-fl",
    country: "United States",
    state: "Florida",
    city: "Miami",
    href: null,
    blurb: "Coming soon — beaches, Art Deco, and nightlife.",
  },
  {
    id: "las-vegas-nv",
    country: "United States",
    state: "Nevada",
    city: "Las Vegas",
    href: null,
    blurb: "Coming soon — Strip icons and desert day trips.",
  },
];

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
