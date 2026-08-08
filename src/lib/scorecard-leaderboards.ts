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
  /** Short code for terminal-style boards */
  symbol?: string;
  score?: number;
  /** Day change in TIW points (sample) */
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
  return (u > 0.42 ? 1 : -1) * Math.round(mag * 10) / 10;
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
      symbol: makeSymbol(row.place.name),
      score: Math.round(row.place.tiwScore * 10) / 10,
      change: sampleChange(`likes:${row.place.slug}`),
      volumeLabel: formatCompactCount(row.likes),
    }));
}

function nycTopByLens(lens: ScoreboardLens, limit = 5): LeaderboardRow[] {
  return rankNycPlaces(lens)
    .slice(0, limit)
    .map((p, i) => {
      const likes = sampleLikeBase(p.slug, p.tiwScore);
      return {
        rank: i + 1,
        name: p.name,
        meta: `TIW ${Math.round(p.tiwScore)}`,
        href: `/new-york/${p.slug}?lens=${lens}`,
        symbol: makeSymbol(p.name),
        score: Math.round(p.tiwScore * 10) / 10,
        change: sampleChange(`${lens}:${p.slug}`),
        volumeLabel: formatCompactCount(likes),
      };
    });
}

/** Preview ranks for cities that are not live yet. */
function previewBoard(seed: string, names: string[]): LeaderboardRow[] {
  return names.map((name, i) => {
    const u = hashUnit(`${seed}:${name}`);
    const metric = 8_400 + Math.floor(u * 14_200);
    const score = Math.round((78 + u * 18) * 10) / 10;
    return {
      rank: i + 1,
      name,
      meta: `${formatCompactCount(metric)} explorers`,
      href: null,
      symbol: makeSymbol(name),
      score,
      change: sampleChange(`${seed}:${name}:chg`),
      volumeLabel: formatCompactCount(metric),
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
