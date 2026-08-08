import { getCityCatalog, rankCityPlaces } from "@/lib/places/registry";
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
  symbol?: string;
  score?: number;
  change?: number;
  volumeLabel?: string;
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

function hashUnit(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function sampleChange(key: string): number {
  const u = hashUnit(key);
  const mag = 0.2 + u * 2.4;
  return ((u > 0.42 ? 1 : -1) * Math.round(mag * 10)) / 10;
}

function makeSymbol(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 1) return words[0]!.slice(0, 4).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function placeHref(citySlug: string, placeSlug: string, lens?: ScoreboardLens) {
  if (citySlug === "new-york") {
    return lens
      ? `/new-york/${placeSlug}?lens=${lens}`
      : `/new-york/${placeSlug}`;
  }
  return `/city/${citySlug}/${placeSlug}`;
}

function cityTopByLikes(citySlug: string, limit = 5): LeaderboardRow[] {
  const catalog = getCityCatalog(citySlug);
  if (!catalog) return [];
  return [...rankCityPlaces(catalog.places, "overall")]
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
      href: placeHref(citySlug, row.place.slug),
      symbol: makeSymbol(row.place.name),
      score: Math.round(row.place.tiwScore * 10) / 10,
      change: sampleChange(`likes:${citySlug}:${row.place.slug}`),
      volumeLabel: formatCompactCount(row.likes),
    }));
}

function cityTopByLens(
  citySlug: string,
  lens: ScoreboardLens,
  limit = 5,
): LeaderboardRow[] {
  const catalog = getCityCatalog(citySlug);
  if (!catalog) return [];
  return rankCityPlaces(catalog.places, lens)
    .slice(0, limit)
    .map((p, i) => {
      const likes = sampleLikeBase(p.slug, p.tiwScore);
      return {
        rank: i + 1,
        name: p.name,
        meta: `TIW ${Math.round(p.tiwScore)}`,
        href: placeHref(citySlug, p.slug, lens),
        symbol: makeSymbol(p.name),
        score: Math.round(p.tiwScore * 10) / 10,
        change: sampleChange(`${citySlug}:${lens}:${p.slug}`),
        volumeLabel: formatCompactCount(likes),
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
      rows: cityTopByLikes("new-york", 5),
    },
    {
      id: "la-most-liked",
      city: "Los Angeles",
      region: "California",
      title: "Most liked right now",
      blurb: "Hollywood, beaches, and museums climbing the board.",
      live: true,
      href: "/city/los-angeles",
      rows: cityTopByLikes("los-angeles", 5),
    },
    {
      id: "nyc-families",
      city: "New York City",
      region: "New York",
      title: "Family favorites",
      blurb: "Top picks when the board is sorted for families.",
      live: true,
      href: "/new-york?lens=families",
      rows: cityTopByLens("new-york", "families", 5),
    },
    {
      id: "chicago-most-liked",
      city: "Chicago",
      region: "Illinois",
      title: "Most liked right now",
      blurb: "Lakefront icons and architecture crowd-pleasers.",
      live: true,
      href: "/city/chicago",
      rows: cityTopByLikes("chicago", 5),
    },
    {
      id: "nyc-first-visit",
      city: "New York City",
      region: "New York",
      title: "First-timer musts",
      blurb: "Highest first-visit value on the TIW scorecard.",
      live: true,
      href: "/new-york?lens=first_visit",
      rows: cityTopByLens("new-york", "first_visit", 5),
    },
    {
      id: "miami-most-liked",
      city: "Miami",
      region: "Florida",
      title: "Most liked right now",
      blurb: "Beaches, Wynwood, and Little Havana favorites.",
      live: true,
      href: "/city/miami",
      rows: cityTopByLikes("miami", 5),
    },
  ];
}

export function leaderboardTickerLines(
  boards: ScorecardLeaderboard[],
): string[] {
  return boards.flatMap((b) =>
    b.rows.slice(0, 3).map((r) => {
      const chg =
        typeof r.change === "number"
          ? `${r.change >= 0 ? "+" : ""}${r.change.toFixed(1)}`
          : "";
      const score = typeof r.score === "number" ? r.score.toFixed(1) : "";
      return `${b.city.toUpperCase()} ${b.title.toUpperCase()}  ${r.symbol || `#${r.rank}`}  ${score}  ${chg}  ${r.volumeLabel || ""}`.trim();
    }),
  );
}
