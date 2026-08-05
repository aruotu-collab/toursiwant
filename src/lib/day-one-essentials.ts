import type { PulseZoneId } from "@/lib/tour-pulse";
import {
  haversineMeters,
  walkMinutesFromMeters,
} from "@/lib/places-usa";

/** Day-1 jobs after hotel check-in (not tours). */
export type DayOneNeed =
  | "convenience"
  | "supermarket"
  | "pharmacy"
  | "atm";

export type DayOneEssential = {
  id: string;
  need: DayOneNeed;
  name: string;
  addressHint: string;
  walkMinutes: number;
  /** meters from stay when known */
  meters?: number;
  rating?: number;
  /** Maps deep link (no API key) */
  mapsUrl: string;
  tip: string;
  /** Further walk often = better value than hotel-strip shops */
  valueNote?: "closer" | "stretch_for_value";
  source: "google" | "curated";
};

export const dayOneNeedLabel: Record<DayOneNeed, string> = {
  convenience: "Convenience store",
  supermarket: "Supermarket",
  pharmacy: "Pharmacy",
  atm: "ATM / cash",
};

export const dayOneNeedOrder: DayOneNeed[] = [
  "convenience",
  "supermarket",
  "pharmacy",
  "atm",
];

/** Google Nearby searches for check-in essentials. */
export const dayOneEssentialQueries: {
  need: DayOneNeed;
  type: string;
  keyword?: string;
  radius: number;
}[] = [
  { need: "convenience", type: "convenience_store", radius: 1200 },
  { need: "supermarket", type: "supermarket", radius: 2500 },
  { need: "pharmacy", type: "pharmacy", radius: 1500 },
  { need: "atm", type: "atm", radius: 1000 },
];

const tipByNeed: Record<DayOneNeed, string> = {
  convenience:
    "Water, snacks, basics without a full supermarket run.",
  supermarket:
    "Hotel-block shops are often pricier — a 10–15 min walk usually lands better value.",
  pharmacy: "OTC meds, toiletries, contact solution when you need them tonight.",
  atm: "Cash for tips, markets, and places that skip cards.",
};

export function mapsDirectionsUrl(
  dest: { lat?: number; lng?: number; name: string; address?: string },
  origin?: { lat: number; lng: number },
) {
  const params = new URLSearchParams({
    api: "1",
    travelmode: "walking",
  });
  if (dest.lat != null && dest.lng != null) {
    params.set("destination", `${dest.lat},${dest.lng}`);
  } else {
    params.set(
      "destination",
      dest.address ? `${dest.name}, ${dest.address}` : dest.name,
    );
  }
  if (origin) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function googlePlaceToDayOne(input: {
  place: {
    place_id: string;
    name: string;
    vicinity?: string;
    geometry: { location: { lat: number; lng: number } };
    rating?: number;
  };
  stay: { lat: number; lng: number };
  need: DayOneNeed;
}): DayOneEssential {
  const lat = input.place.geometry.location.lat;
  const lng = input.place.geometry.location.lng;
  const meters = haversineMeters(input.stay, { lat, lng });
  const walkMinutes = walkMinutesFromMeters(meters);
  const address = input.place.vicinity || "Nearby";

  let valueNote: DayOneEssential["valueNote"] = "closer";
  if (input.need === "supermarket" && walkMinutes >= 8) {
    valueNote = "stretch_for_value";
  } else if (input.need === "convenience" && walkMinutes <= 6) {
    valueNote = "closer";
  }

  return {
    id: `ess-${input.need}-${input.place.place_id}`,
    need: input.need,
    name: input.place.name,
    addressHint: address,
    walkMinutes,
    meters: Math.round(meters),
    rating: input.place.rating,
    mapsUrl: mapsDirectionsUrl(
      { lat, lng, name: input.place.name, address },
      input.stay,
    ),
    tip: tipByNeed[input.need],
    valueNote,
    source: "google",
  };
}

/** NYC corridor seed when Google Places is offline (curated hotels). */
const curatedByZone: Partial<Record<PulseZoneId, DayOneEssential[]>> = {
  midtown: [
    {
      id: "cur-mid-duane",
      need: "pharmacy",
      name: "Duane Reade (Midtown chain)",
      addressHint: "Look on 7th / 8th Ave corridors near Times Square hotels",
      walkMinutes: 5,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Duane+Reade+near+Times+Square",
      tip: tipByNeed.pharmacy,
      valueNote: "closer",
      source: "curated",
    },
    {
      id: "cur-mid-cvs",
      need: "convenience",
      name: "CVS / 7-Eleven style corner shops",
      addressHint: "Hotel corridors · tourist prices higher on avenues",
      walkMinutes: 4,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=convenience+store+near+Times+Square",
      tip: tipByNeed.convenience,
      valueNote: "closer",
      source: "curated",
    },
    {
      id: "cur-mid-trader",
      need: "supermarket",
      name: "Trader Joe’s / Food Emporium (better value)",
      addressHint: "Often ~10–15 min walk from Midtown West hotels",
      walkMinutes: 14,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Trader+Joes+near+Hell's+Kitchen",
      tip: tipByNeed.supermarket,
      valueNote: "stretch_for_value",
      source: "curated",
    },
    {
      id: "cur-mid-atm",
      need: "atm",
      name: "Bank ATM (Chase / Bank of America)",
      addressHint: "Prefer bank ATMs over hotel lobby machines when possible",
      walkMinutes: 6,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=bank+ATM+near+Times+Square",
      tip: tipByNeed.atm,
      valueNote: "closer",
      source: "curated",
    },
  ],
  "lower-manhattan": [
    {
      id: "cur-low-cvs",
      need: "convenience",
      name: "Convenience near Financial District",
      addressHint: "Broadway / Greenwich corridors",
      walkMinutes: 5,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=convenience+store+near+Wall+Street",
      tip: tipByNeed.convenience,
      source: "curated",
    },
    {
      id: "cur-low-super",
      need: "supermarket",
      name: "Whole Foods / local market (better value than tourist shops)",
      addressHint: "Walk toward larger grocery — not Battery souvenir strip",
      walkMinutes: 12,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=supermarket+near+Financial+District",
      tip: tipByNeed.supermarket,
      valueNote: "stretch_for_value",
      source: "curated",
    },
    {
      id: "cur-low-pharm",
      need: "pharmacy",
      name: "Rite Aid / Duane Reade",
      addressHint: "Lower Manhattan chain pharmacies",
      walkMinutes: 7,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=pharmacy+near+Battery+Park",
      tip: tipByNeed.pharmacy,
      source: "curated",
    },
    {
      id: "cur-low-atm",
      need: "atm",
      name: "Bank ATM",
      addressHint: "Main bank branches downtown",
      walkMinutes: 5,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=bank+ATM+near+Wall+Street",
      tip: tipByNeed.atm,
      source: "curated",
    },
  ],
  harbor: [
    {
      id: "cur-har-cvs",
      need: "convenience",
      name: "Convenience near cruise / Battery",
      addressHint: "Stock up before sightseeing runs",
      walkMinutes: 8,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=convenience+store+near+Battery+Park",
      tip: tipByNeed.convenience,
      source: "curated",
    },
    {
      id: "cur-har-super",
      need: "supermarket",
      name: "Grocery a short walk inland",
      addressHint: "Avoid terminal souvenir kiosks for everyday prices",
      walkMinutes: 15,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=supermarket+near+Battery+Park+City",
      tip: tipByNeed.supermarket,
      valueNote: "stretch_for_value",
      source: "curated",
    },
    {
      id: "cur-har-pharm",
      need: "pharmacy",
      name: "Pharmacy near waterfront hotels",
      addressHint: "Check hours — some close earlier on weekends",
      walkMinutes: 10,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=pharmacy+near+Battery+Park",
      tip: tipByNeed.pharmacy,
      source: "curated",
    },
    {
      id: "cur-har-atm",
      need: "atm",
      name: "Bank ATM",
      addressHint: "Prefer bank machines over cruise-port kiosks",
      walkMinutes: 8,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=ATM+near+Battery+Park",
      tip: tipByNeed.atm,
      source: "curated",
    },
  ],
  "central-park": [
    {
      id: "cur-park-cvs",
      need: "convenience",
      name: "Corner shops Upper East / Midtown East",
      addressHint: "Along Madison / Lexington",
      walkMinutes: 6,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=convenience+store+near+Central+Park+South",
      tip: tipByNeed.convenience,
      source: "curated",
    },
    {
      id: "cur-park-super",
      need: "supermarket",
      name: "Whole Foods / Fairway-style markets",
      addressHint: "Stretch away from park southern strip for value",
      walkMinutes: 14,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=supermarket+near+Columbus+Circle",
      tip: tipByNeed.supermarket,
      valueNote: "stretch_for_value",
      source: "curated",
    },
    {
      id: "cur-park-pharm",
      need: "pharmacy",
      name: "Duane Reade / CVS",
      addressHint: "Museum hotel belt",
      walkMinutes: 7,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=pharmacy+near+Central+Park",
      tip: tipByNeed.pharmacy,
      source: "curated",
    },
    {
      id: "cur-park-atm",
      need: "atm",
      name: "Bank ATM",
      addressHint: "5th Ave bank branches",
      walkMinutes: 6,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=bank+ATM+near+Central+Park",
      tip: tipByNeed.atm,
      source: "curated",
    },
  ],
  brooklyn: [
    {
      id: "cur-bk-cvs",
      need: "convenience",
      name: "Corner bodega / convenience",
      addressHint: "DUMBO / Downtown Brooklyn streets",
      walkMinutes: 5,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=convenience+store+near+DUMBO",
      tip: tipByNeed.convenience,
      source: "curated",
    },
    {
      id: "cur-bk-super",
      need: "supermarket",
      name: "Traders / Brooklyn markets",
      addressHint: "Often better value than waterfront souvenir shops",
      walkMinutes: 12,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=supermarket+near+Downtown+Brooklyn",
      tip: tipByNeed.supermarket,
      valueNote: "stretch_for_value",
      source: "curated",
    },
    {
      id: "cur-bk-pharm",
      need: "pharmacy",
      name: "Pharmacy near waterfront hotels",
      addressHint: "Check late-night hours",
      walkMinutes: 8,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=pharmacy+near+DUMBO",
      tip: tipByNeed.pharmacy,
      source: "curated",
    },
    {
      id: "cur-bk-atm",
      need: "atm",
      name: "Bank ATM",
      addressHint: "Avoid touristy high-fee cash kiosks",
      walkMinutes: 6,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=bank+ATM+near+Brooklyn+Bridge",
      tip: tipByNeed.atm,
      source: "curated",
    },
  ],
  airports: [
    {
      id: "cur-air-cvs",
      need: "convenience",
      name: "Terminal / hotel shop (expect tourist pricing)",
      addressHint: "Airside and hotel shops are expensive — stock in the city if you can",
      walkMinutes: 3,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=convenience+store+JFK+hotel",
      tip: "Airport-adjacent shops are often the priciest option.",
      valueNote: "closer",
      source: "curated",
    },
    {
      id: "cur-air-super",
      need: "supermarket",
      name: "Off-site supermarket (if not flying soon)",
      addressHint: "Needs a short ride — not a walk from terminals",
      walkMinutes: 25,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=supermarket+near+Jamaica+Queens",
      tip: tipByNeed.supermarket,
      valueNote: "stretch_for_value",
      source: "curated",
    },
    {
      id: "cur-air-pharm",
      need: "pharmacy",
      name: "Airport pharmacy / nearby drugstore",
      addressHint: "Hours vary by terminal",
      walkMinutes: 8,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=pharmacy+near+JFK",
      tip: tipByNeed.pharmacy,
      source: "curated",
    },
    {
      id: "cur-air-atm",
      need: "atm",
      name: "Airport bank ATM",
      addressHint: "Compare fees — hotel lobby ATMs can cost more",
      walkMinutes: 4,
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=ATM+JFK+airport",
      tip: tipByNeed.atm,
      source: "curated",
    },
  ],
};

export function curatedEssentialsForZone(
  zoneId?: PulseZoneId | null,
): DayOneEssential[] {
  const list =
    (zoneId && curatedByZone[zoneId]) || curatedByZone.midtown || [];
  return list.map((item) => ({ ...item }));
}

/** One of each need, preferring shortest walk for close needs, stretch for supermarket. */
export function pickBestEssentials(items: DayOneEssential[]): DayOneEssential[] {
  const byNeed = new Map<DayOneNeed, DayOneEssential[]>();
  for (const item of items) {
    const list = byNeed.get(item.need) || [];
    list.push(item);
    byNeed.set(item.need, list);
  }

  const picked: DayOneEssential[] = [];
  for (const need of dayOneNeedOrder) {
    const candidates = (byNeed.get(need) || []).sort(
      (a, b) => a.walkMinutes - b.walkMinutes,
    );
    if (!candidates.length) continue;
    if (need === "supermarket" && candidates.length > 1) {
      // Prefer a slightly longer walk if we have options beyond 7 min
      // (hotel strip is usually the nearest but pricier)
      const stretch = candidates.find((c) => c.walkMinutes >= 8);
      picked.push(stretch || candidates[0]);
    } else {
      picked.push(candidates[0]);
    }
  }
  return picked;
}

/** Keep several options per need (for client filters), nearest first. */
export function rankEssentialsForFilters(
  items: DayOneEssential[],
  perNeed = 4,
): DayOneEssential[] {
  const byNeed = new Map<DayOneNeed, DayOneEssential[]>();
  for (const item of items) {
    const list = byNeed.get(item.need) || [];
    list.push(item);
    byNeed.set(item.need, list);
  }
  const out: DayOneEssential[] = [];
  for (const need of dayOneNeedOrder) {
    const sorted = (byNeed.get(need) || []).sort(
      (a, b) => a.walkMinutes - b.walkMinutes,
    );
    // mark stretch option for supermarket further away
    for (const item of sorted) {
      if (need === "supermarket" && item.walkMinutes >= 8) {
        item.valueNote = "stretch_for_value";
      } else if (need === "supermarket" && item.walkMinutes < 8) {
        item.valueNote = item.valueNote || "closer";
      }
    }
    out.push(...sorted.slice(0, perNeed));
  }
  return out;
}

/**
 * Day-trip search terms for major metros (Viator free text).
 * Solves “we wanted Niagara but didn’t know how to get there.”
 */
export const dayTripQueriesByCity: Record<string, string> = {
  "new-york": "Niagara Falls day tour",
  "los-angeles": "day trip",
  "las-vegas": "Grand Canyon day",
  miami: "Key West day",
  orlando: "day tour",
  chicago: "day tour",
  "san-francisco": "day trip",
  "washington-dc": "day tour",
  boston: "day tour",
  "new-orleans": "day tour",
  seattle: "day tour",
  houston: "day tour",
  dallas: "day tour",
  atlanta: "day tour",
  "san-diego": "day trip",
  philadelphia: "day tour",
  honolulu: "island day",
  nashville: "day tour",
  denver: "day trip",
  phoenix: "day tour",
};

export function dayTripQueryForCity(citySlug: string) {
  return dayTripQueriesByCity[citySlug] || "day tour";
}
