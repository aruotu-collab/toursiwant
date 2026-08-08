import { austinPlaces } from "@/lib/places/data/austin";
import { bostonPlaces } from "@/lib/places/data/boston";
import { chicagoPlaces } from "@/lib/places/data/chicago";
import { lasVegasPlaces } from "@/lib/places/data/las-vegas";
import { losAngelesPlaces } from "@/lib/places/data/los-angeles";
import { miamiPlaces } from "@/lib/places/data/miami";
import { newOrleansPlaces } from "@/lib/places/data/new-orleans";
import { sanFranciscoPlaces } from "@/lib/places/data/san-francisco";
import { seattlePlaces } from "@/lib/places/data/seattle";
import { washingtonDcPlaces } from "@/lib/places/data/washington-dc";
import { nycPlaces, type NycPlace } from "@/lib/nyc-places";
import {
  computeTiwScore,
  scoreExplanation,
  type ScoreboardLens,
} from "@/lib/tiw-score";
import type { CityPlace } from "@/lib/places/types";

export type CityCatalog = {
  slug: string;
  name: string;
  state: string;
  country: string;
  blurb: string;
  places: CityPlace[];
  /** App path for the live board */
  href: string;
};

export const cityCatalogs: CityCatalog[] = [
  {
    slug: "new-york",
    name: "New York City",
    state: "New York",
    country: "United States",
    blurb:
      "Icons, neighborhoods, and hidden gems — ranked so you know what's worth your days.",
    places: nycPlaces,
    href: "/new-york",
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    state: "California",
    country: "United States",
    blurb: "Hollywood, beaches, museums, and food neighborhoods — ranked.",
    places: losAngelesPlaces,
    href: "/city/los-angeles",
  },
  {
    slug: "chicago",
    name: "Chicago",
    state: "Illinois",
    country: "United States",
    blurb: "Architecture, lakefront, and deep-dish energy — ranked.",
    places: chicagoPlaces,
    href: "/city/chicago",
  },
  {
    slug: "miami",
    name: "Miami",
    state: "Florida",
    country: "United States",
    blurb: "Beaches, Art Deco, Wynwood, and Little Havana — ranked.",
    places: miamiPlaces,
    href: "/city/miami",
  },
  {
    slug: "las-vegas",
    name: "Las Vegas",
    state: "Nevada",
    country: "United States",
    blurb: "Strip icons, downtown neon, and desert day trips — ranked.",
    places: lasVegasPlaces,
    href: "/city/las-vegas",
  },
  {
    slug: "san-francisco",
    name: "San Francisco",
    state: "California",
    country: "United States",
    blurb: "Bridge views, neighborhoods, and bay days — ranked.",
    places: sanFranciscoPlaces,
    href: "/city/san-francisco",
  },
  {
    slug: "boston",
    name: "Boston",
    state: "Massachusetts",
    country: "United States",
    blurb: "Freedom Trail history, harbor, and campus energy — ranked.",
    places: bostonPlaces,
    href: "/city/boston",
  },
  {
    slug: "washington-dc",
    name: "Washington, D.C.",
    state: "District of Columbia",
    country: "United States",
    blurb: "Monuments, free Smithsonian museums, and neighborhoods — ranked.",
    places: washingtonDcPlaces,
    href: "/city/washington-dc",
  },
  {
    slug: "seattle",
    name: "Seattle",
    state: "Washington",
    country: "United States",
    blurb: "Pike Place, waterfront, and mountain-day options — ranked.",
    places: seattlePlaces,
    href: "/city/seattle",
  },
  {
    slug: "austin",
    name: "Austin",
    state: "Texas",
    country: "United States",
    blurb: "Live music, BBQ, and Lady Bird Lake — ranked.",
    places: austinPlaces,
    href: "/city/austin",
  },
  {
    slug: "new-orleans",
    name: "New Orleans",
    state: "Louisiana",
    country: "United States",
    blurb: "French Quarter, jazz, and Creole food — ranked.",
    places: newOrleansPlaces,
    href: "/city/new-orleans",
  },
];

export function getCityCatalog(slug: string): CityCatalog | null {
  return cityCatalogs.find((c) => c.slug === slug) || null;
}

export function getCityPlace(
  citySlug: string,
  placeSlug: string,
): CityPlace | null {
  const city = getCityCatalog(citySlug);
  if (!city) return null;
  return city.places.find((p) => p.slug === placeSlug) || null;
}

export type RankedCityPlace = CityPlace & {
  tiwScore: number;
  rank: number;
  explanation: string;
};

export function rankCityPlaces(
  places: CityPlace[],
  lens: ScoreboardLens = "overall",
): RankedCityPlace[] {
  const ranked = places
    .map((p) => {
      const tiwScore = computeTiwScore(p.factors, lens);
      return {
        ...p,
        tiwScore,
        rank: 0,
        explanation:
          p.whyHigh || scoreExplanation(p.name, p.factors, tiwScore),
      };
    })
    .sort((a, b) => b.tiwScore - a.tiwScore || a.name.localeCompare(b.name));

  return ranked.map((p, i) => ({ ...p, rank: i + 1 }));
}

export function totalLivePlaceCount() {
  return cityCatalogs.reduce((n, c) => n + c.places.length, 0);
}

/** Narrow helper when callers still expect NycPlace. */
export function asNycPlaces(places: CityPlace[]): NycPlace[] {
  return places as NycPlace[];
}
