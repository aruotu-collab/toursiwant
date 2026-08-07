import { haversineMeters, metroLabel } from "@/lib/places-usa";
import {
  hereNowHotels,
  listTemplates,
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

function filterPlans(
  hotelId: string | null,
  cityCodes: string[],
  timeBucket?: string,
  mood?: string,
) {
  if (hotelId) {
    const exact = listTemplates({
      scale: "here_now",
      hotelId,
      timeBucket,
      mood,
    });
    if (exact.length) return exact;
    const hotelOnly = listTemplates({ scale: "here_now", hotelId });
    if (hotelOnly.length) return hotelOnly;
    const area = listTemplates({ scale: "hotel_area", hotelId });
    if (area.length) return area;
  }

  if (cityCodes.length) {
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
    if (filtered.length) return filtered;
    if (byCity.length) return byCity;
  }

  return listTemplates({ scale: "here_now" }).slice(0, 6);
}

export function matchHereNowFromStay(
  stay: ResolvedStay,
  filters?: { timeBucket?: string; mood?: string },
): HereNowMatch {
  const metro = refineMetro(stay.lat, stay.lng, stay.name, stay.address);
  const stayWithMetro = { ...stay, metro };

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
      metroToCityCodes[metro] || [],
      filters?.timeBucket,
      filters?.mood,
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
      metroToCityCodes[metro] || [],
      filters?.timeBucket,
      filters?.mood,
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

  const cityCodes = metroToCityCodes[metro] || [];
  if (cityCodes.length) {
    const templates = filterPlans(
      null,
      cityCodes,
      filters?.timeBucket,
      filters?.mood,
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
  );
  return {
    stay: stayWithMetro,
    matchedHotelId: null,
    matchedHotelName: null,
    distanceMeters: nearest ? Math.round(nearestMeters) : null,
    matchKind: "fallback",
    message: `We don't have ${metro}-specific right-now plans yet — here are starter plans. Pick time and mood, or try a featured hotel below.`,
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
