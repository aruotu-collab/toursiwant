import { rankNycPlaces } from "@/lib/nyc-places";
import {
  formatCompactCount,
  sampleLikeBase,
} from "@/lib/sample-likes";
import type { ScoreboardLens } from "@/lib/tiw-score";

export type LeaderboardRow = {
  rank: number;
  name: string;
  meta: string;
  href: string | null;
};

export type ScorecardLeaderboard = {
  id: string;
  city: string;
  region: string;
  title: string;
  blurb: string;
  live: boolean;
  href: string | null;
  rows: LeaderboardRow[];
};

function nycTopByLikes(limit = 5): LeaderboardRow[] {
  return [...rankNycPlaces("overall")]
    .map((p) => ({
      place: p,
      likes: sampleLikeBase(p.slug, p.tiwScore),
    }))
    .sort((a, b) => b.likes - a.likes || b.place.tiwScore - a.place.tiwScore)
    .slice(0, limit)
    .map((row, i) => ({
      rank: i + 1,
      name: row.place.name,
      meta: `${formatCompactCount(row.likes)} likes`,
      href: `/new-york/${row.place.slug}`,
    }));
}

function nycTopByLens(lens: ScoreboardLens, limit = 5): LeaderboardRow[] {
  return rankNycPlaces(lens)
    .slice(0, limit)
    .map((p, i) => ({
      rank: i + 1,
      name: p.name,
      meta: `TIW ${Math.round(p.tiwScore)}`,
      href: `/new-york/${p.slug}?lens=${lens}`,
    }));
}

/** Preview ranks for cities that are not live yet. */
function previewBoard(
  seed: string,
  names: string[],
): LeaderboardRow[] {
  return names.map((name, i) => {
    let h = 2166136261;
    const key = `${seed}:${name}`;
    for (let j = 0; j < key.length; j++) {
      h ^= key.charCodeAt(j);
      h = Math.imul(h, 16777619);
    }
    const metric = 8_400 + ((h >>> 0) % 14_200);
    return {
      rank: i + 1,
      name,
      meta: `${formatCompactCount(metric)} explorers`,
      href: null,
    };
  });
}

/** Rotating mini-leaderboards for the Scorecard home rail. */
export function buildScorecardLeaderboards(): ScorecardLeaderboard[] {
  return [
    {
      id: "nyc-most-liked",
      city: "New York City",
      region: "New York",
      title: "Most liked right now",
      blurb: "What travelers are shortlisting on the live board.",
      live: true,
      href: "/new-york",
      rows: nycTopByLikes(5),
    },
    {
      id: "la-preview",
      city: "Los Angeles",
      region: "California",
      title: "Preview · most explored",
      blurb: "Coming soon — a taste of the LA scorecard.",
      live: false,
      href: null,
      rows: previewBoard("los-angeles-ca", [
        "Griffith Observatory",
        "Santa Monica Pier",
        "The Getty Center",
        "Hollywood Walk of Fame",
        "Venice Beach Boardwalk",
      ]),
    },
    {
      id: "nyc-families",
      city: "New York City",
      region: "New York",
      title: "Family favorites",
      blurb: "Top picks when the board is sorted for families.",
      live: true,
      href: "/new-york?lens=families",
      rows: nycTopByLens("families", 5),
    },
    {
      id: "miami-preview",
      city: "Miami",
      region: "Florida",
      title: "Preview · most explored",
      blurb: "Coming soon — beaches, Art Deco, and nightlife ranked.",
      live: false,
      href: null,
      rows: previewBoard("miami-fl", [
        "South Beach",
        "Wynwood Walls",
        "Vizcaya Museum",
        "Little Havana",
        "Everglades day trip",
      ]),
    },
    {
      id: "nyc-first-visit",
      city: "New York City",
      region: "New York",
      title: "First-timer musts",
      blurb: "Highest first-visit value on the TIW scorecard.",
      live: true,
      href: "/new-york?lens=first_visit",
      rows: nycTopByLens("first_visit", 5),
    },
  ];
}
