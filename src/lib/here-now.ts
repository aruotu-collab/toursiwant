import { haversineMeters, metroLabel } from "@/lib/places-usa";
import { getNearMePlace } from "@/lib/near-me";
import {
  hereNowHotels,
  listTemplates,
  type ExperienceCategory,
  type TripTemplate,
} from "@/lib/trip-templates";

const MATCH_METERS = 25_000; // ~15 miles — treat as “from this hotel”

const metroToCityCodes: Record<string, string[]> = {
  "New York": ["NYC"],
  "Los Angeles": ["LA"],
  "Miami": ["MIA"],
  Chicago: ["CHI"],
  "San Francisco": ["SF"],
  "Washington DC": ["DC"],
  Boston: ["BOS"],
  "Las Vegas": ["LAS"],
  Orlando: ["ORL"],
  "Niagara Falls": ["NIA"],
  "New Orleans": ["NOLA"],
  Nashville: ["NASH"],
  Philadelphia: ["PHL"],
  "San Diego": ["SD"],
};

export type ResolvedStay = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  metro: string;
  source: "google" | "curated";
};

export type HereNowMatch = {
  stay: ResolvedStay;
  matchedHotelId: string | null;
  matchedHotelName: string | null;
  distanceMeters: number | null;
  matchKind: "exact_hotel" | "nearby_hotel" | "metro" | "fallback";
  message: string;
  templates: TripTemplate[];
};

function hotelAnchors() {
  const map = new Map<
    string,
    { id: string; name: string; area: string; lat: number; lng: number }
  >();
  for (const t of listTemplates()) {
    if (!t.hotelAnchor) continue;
    if (!map.has(t.hotelAnchor.id)) {
      map.set(t.hotelAnchor.id, {
        id: t.hotelAnchor.id,
        name: t.hotelAnchor.name,
        area: t.hotelAnchor.area,
        lat: t.hotelAnchor.lat,
        lng: t.hotelAnchor.lng,
      });
    }
  }
  return [...map.values()];
}

function refineMetro(lat: number, lng: number, name: string, address: string) {
  const blob = `${name} ${address}`.toLowerCase();
  if (
    blob.includes("niagara") ||
    (lat > 42.9 && lat < 43.3 && lng > -79.3 && lng < -78.8)
  ) {
    return "Niagara Falls";
  }
  if (
    blob.includes("orlando") ||
    blob.includes("disney") ||
    blob.includes("international drive") ||
    (lat > 28.2 && lat < 28.7 && lng > -81.7 && lng < -81.1)
  ) {
    return "Orlando";
  }
  if (
    blob.includes("new orleans") ||
    (lat > 29.8 && lat < 30.1 && lng > -90.3 && lng < -89.8)
  ) {
    return "New Orleans";
  }
  if (
    blob.includes("nashville") ||
    (lat > 36.0 && lat < 36.3 && lng > -87.0 && lng < -86.6)
  ) {
    return "Nashville";
  }
  return metroLabel(lat, lng);
}

/** How well a template’s days/options match the traveler’s day topics. */
export function templateTopicScore(
  t: TripTemplate,
  topics: ExperienceCategory[],
): number {
  if (!topics.length) return 0;
  const want = new Set(topics);
  let score = 0;
  for (const b of t.blocks) {
    if (b.category && want.has(b.category)) score += 3;
    for (const a of b.alternatives || []) {
      if (want.has(a.category)) score += 1;
    }
  }
  return score;
}

function applyTopicFilter(
  plans: TripTemplate[],
  topics?: ExperienceCategory[],
  cityCodes: string[] = [],
): TripTemplate[] {
  if (!topics?.length) return plans;

  const scored = plans
    .map((t) => ({ t, score: templateTopicScore(t, topics) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  let next = scored.map((x) => x.t);

  // Also pull city / hotel-area templates that cover these day topics
  if (cityCodes.length) {
    const extras = [
      ...listTemplates({ scale: "hotel_area" }),
      ...listTemplates({ scale: "city" }),
    ]
      .filter(
        (t) =>
          t.cityCodes.some((c) => cityCodes.includes(c)) &&
          templateTopicScore(t, topics) > 0 &&
          !next.some((p) => p.id === t.id),
      )
      .map((t) => ({ t, score: templateTopicScore(t, topics) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.t);
    next = [...next, ...extras];
  }

  if (next.length) {
    return next
      .map((t) => ({ t, score: templateTopicScore(t, topics) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.t)
      .slice(0, 12);
  }

  // No hard matches — keep location plans so the traveler isn’t stuck
  return plans.slice(0, 6);
}

function filterPlans(
  hotelId: string | null,
  cityCodes: string[],
  timeBucket?: string,
  mood?: string,
  topics?: ExperienceCategory[],
) {
  let plans: TripTemplate[] = [];

  if (hotelId) {
    const exact = listTemplates({
      scale: "here_now",
      hotelId,
      timeBucket,
      mood,
    });
    if (exact.length) plans = exact;
    else {
      const hotelOnly = listTemplates({ scale: "here_now", hotelId });
      if (hotelOnly.length) plans = hotelOnly;
      else {
        const area = listTemplates({ scale: "hotel_area", hotelId });
        if (area.length) plans = area;
      }
    }
  }

  if (!plans.length && cityCodes.length) {
    const byCity = listTemplates({ scale: "here_now" }).filter((t) =>
      t.cityCodes.some((c) => cityCodes.includes(c)),
    );
    const filtered = byCity.filter((t) => {
      if (
        timeBucket &&
        t.timeBuckets &&
        !t.timeBuckets.includes(timeBucket as never)
      )
        return false;
      if (mood && t.moods && !t.moods.includes(mood)) return false;
      return true;
    });
    plans = filtered.length ? filtered : byCity;
  }

  if (!plans.length) {
    plans = listTemplates({ scale: "here_now" }).slice(0, 6);
  }

  return applyTopicFilter(plans, topics, cityCodes);
}

export type HereNowFilters = {
  timeBucket?: string;
  mood?: string;
  topics?: ExperienceCategory[];
};

export function matchHereNowFromStay(
  stay: ResolvedStay,
  filters?: HereNowFilters,
): HereNowMatch {
  const metro = refineMetro(stay.lat, stay.lng, stay.name, stay.address);
  const stayWithMetro = { ...stay, metro };
  const cityCodes = metroToCityCodes[metro] || [];
  const topics = filters?.topics;

  const anchors = hotelAnchors();
  let nearest: (typeof anchors)[number] | null = null;
  let nearestMeters = Number.POSITIVE_INFINITY;
  for (const anchor of anchors) {
    const meters = haversineMeters(
      { lat: stay.lat, lng: stay.lng },
      { lat: anchor.lat, lng: anchor.lng },
    );
    if (meters < nearestMeters) {
      nearestMeters = meters;
      nearest = anchor;
    }
  }

  // Exact curated pick
  if (stay.source === "curated" && hereNowHotels.some((h) => h.id === stay.id)) {
    const templates = filterPlans(
      stay.id,
      cityCodes,
      filters?.timeBucket,
      filters?.mood,
      topics,
    );
    const hotel = hereNowHotels.find((h) => h.id === stay.id);
    return {
      stay: stayWithMetro,
      matchedHotelId: stay.id,
      matchedHotelName: hotel?.name || stay.name,
      distanceMeters: 0,
      matchKind: "exact_hotel",
      message: hotel?.blurb || `Plans from ${stay.name}.`,
      templates,
    };
  }

  if (nearest && nearestMeters <= MATCH_METERS) {
    const templates = filterPlans(
      nearest.id,
      cityCodes,
      filters?.timeBucket,
      filters?.mood,
      topics,
    );
    const miles = (nearestMeters / 1609.34).toFixed(1);
    return {
      stay: stayWithMetro,
      matchedHotelId: nearest.id,
      matchedHotelName: nearest.name,
      distanceMeters: Math.round(nearestMeters),
      matchKind: nearestMeters < 800 ? "exact_hotel" : "nearby_hotel",
      message:
        nearestMeters < 800
          ? `Matched to plans from ${nearest.name}.`
          : `Closest crafted plans are from ${nearest.name} (~${miles} mi). Still useful from ${stay.name}.`,
      templates,
    };
  }

  if (cityCodes.length) {
    const templates = filterPlans(
      null,
      cityCodes,
      filters?.timeBucket,
      filters?.mood,
      topics,
    );
    return {
      stay: stayWithMetro,
      matchedHotelId: null,
      matchedHotelName: null,
      distanceMeters: nearest ? Math.round(nearestMeters) : null,
      matchKind: "metro",
      message: `No hand-crafted plan from this exact hotel yet — showing ${metro} plans you can use from ${stay.name}.`,
      templates,
    };
  }

  const templates = filterPlans(
    null,
    [],
    filters?.timeBucket,
    filters?.mood,
    topics,
  );
  return {
    stay: stayWithMetro,
    matchedHotelId: null,
    matchedHotelName: null,
    distanceMeters: nearest ? Math.round(nearestMeters) : null,
    matchKind: "fallback",
    message: `We don't have ${metro}-specific right-now plans yet — here are starter plans. Pick time, mood, and day topics, or try a featured hotel below.`,
    templates,
  };
}

export function curatedStayFromHotelId(hotelId: string): ResolvedStay | null {
  const hotel = hereNowHotels.find((h) => h.id === hotelId);
  const anchor = hotelAnchors().find((a) => a.id === hotelId);
  if (!hotel || !anchor) return null;
  return {
    id: hotelId,
    name: hotel.name,
    address: hotel.area,
    lat: anchor.lat,
    lng: anchor.lng,
    metro: refineMetro(anchor.lat, anchor.lng, hotel.name, hotel.area),
    source: "curated",
  };
}

/** Near-me autocomplete ids → featured here-now hotel templates. */
const nearMePlaceToHotelId: Record<string, string> = {
  "aliz-hotel": "midtown-generic",
  "times-square": "midtown-generic",
  "bryant-park": "midtown-generic",
  "battery-park": "midtown-generic",
  dumbo: "midtown-generic",
  "met-museum": "midtown-generic",
  "chinatown-stay": "midtown-generic",
  jfk: "midtown-generic",
  "manhattan-cruise": "midtown-generic",
};

const zoneToHotelId: Record<string, string> = {
  midtown: "midtown-generic",
  "lower-manhattan": "midtown-generic",
  "central-park": "midtown-generic",
  brooklyn: "midtown-generic",
  airports: "midtown-generic",
  harbor: "midtown-generic",
};

const zoneCoords: Record<string, { lat: number; lng: number }> = {
  harbor: { lat: 40.76, lng: -74.0 },
  "lower-manhattan": { lat: 40.703, lng: -74.016 },
  midtown: { lat: 40.758, lng: -73.9855 },
  "central-park": { lat: 40.779, lng: -73.963 },
  brooklyn: { lat: 40.703, lng: -73.99 },
  airports: { lat: 40.644, lng: -73.782 },
};

/**
 * Resolve a Suggested (near-me) autocomplete pick into a stay + Midtown plans.
 * Keeps the place name travellers typed (e.g. Aliz) while matching hotel templates.
 */
export function curatedStayFromNearMePlace(
  placeId: string,
): ResolvedStay | null {
  // Already a featured hotel id
  const direct = curatedStayFromHotelId(placeId);
  if (direct) return direct;

  const place = getNearMePlace(placeId);
  if (!place) return null;

  const hotelId =
    nearMePlaceToHotelId[place.id] ||
    zoneToHotelId[place.zoneId] ||
    "midtown-generic";
  const base = curatedStayFromHotelId(hotelId);
  const coords = zoneCoords[place.zoneId] || zoneCoords.midtown;

  if (base) {
    return {
      ...base,
      // Keep featured hotel id so templates match; show the suggested stay name
      name: place.name,
      address: place.blurb,
      lat: coords.lat,
      lng: coords.lng,
      metro: refineMetro(coords.lat, coords.lng, place.name, place.blurb),
    };
  }

  return {
    id: hotelId,
    name: place.name,
    address: place.blurb,
    lat: coords.lat,
    lng: coords.lng,
    metro: "New York",
    source: "curated",
  };
}
