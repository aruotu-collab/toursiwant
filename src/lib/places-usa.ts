import type { ExperienceType } from "@/lib/near-me";
import type { PulseActivity, PulseCategory, PulseZoneId } from "@/lib/tour-pulse";

export type UsaStay = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  source: "google" | "curated";
  /** Set when inside the NYC corridor footprint */
  zoneId?: PulseZoneId;
  t?: number;
  metro: string;
};

export type UsaNearbySpot = {
  id: string;
  name: string;
  kind: string;
  experienceTypes: ExperienceType[];
  addressHint: string;
  howToBoard: string;
  lat: number;
  lng: number;
  walkMinutes: number;
  /** 0–1 for NYC corridor; otherwise used on radial map */
  t: number;
  zoneId: PulseZoneId;
  rating?: number;
};

export function hasGooglePlacesKey() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
}

/** Rough NYC metro box for corridor projection. */
export function isInNycMetro(lat: number, lng: number) {
  return lat >= 40.48 && lat <= 40.95 && lng >= -74.3 && lng <= -73.68;
}

/**
 * Project lat/lng onto the NYC spine (harbor → airports).
 * Approximate — good enough for “you are here” on the corridor.
 */
export function nycLatLngToCorridorT(lat: number, lng: number): {
  t: number;
  zoneId: PulseZoneId;
} {
  // Harbor SW-ish → Airports NE-ish
  const south = 40.7;
  const north = 40.78;
  const west = -74.02;
  const east = -73.78;
  const y = (lat - south) / (north - south);
  const x = (lng - west) / (east - west);
  const t = Math.max(0.05, Math.min(0.95, y * 0.55 + x * 0.45));

  let zoneId: PulseZoneId = "midtown";
  if (t < 0.16) zoneId = "harbor";
  else if (t < 0.32) zoneId = "lower-manhattan";
  else if (t < 0.5) zoneId = "midtown";
  else if (t < 0.66) zoneId = "central-park";
  else if (t < 0.84) zoneId = "brooklyn";
  else zoneId = "airports";

  return { t, zoneId };
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function walkMinutesFromMeters(meters: number) {
  // ~80 m/min urban walk
  return Math.max(1, Math.round(meters / 80));
}

export function metroLabel(lat: number, lng: number) {
  if (isInNycMetro(lat, lng)) return "New York";
  if (lat > 33.6 && lat < 34.4 && lng > -118.7 && lng < -117.8) return "Los Angeles";
  if (lat > 25.6 && lat < 26.0 && lng > -80.4 && lng < -80.0) return "Miami";
  if (lat > 41.7 && lat < 42.1 && lng > -87.9 && lng < -87.5) return "Chicago";
  if (lat > 37.6 && lat < 37.9 && lng > -122.6 && lng < -122.3) return "San Francisco";
  if (lat > 38.8 && lat < 39.0 && lng > -77.2 && lng < -76.9) return "Washington DC";
  if (lat > 42.2 && lat < 42.5 && lng > -71.3 && lng < -70.9) return "Boston";
  if (lat > 29.6 && lat < 29.9 && lng > -95.6 && lng < -95.1) return "Houston";
  if (lat > 32.6 && lat < 33.0 && lng > -97.0 && lng < -96.5) return "Dallas";
  if (lat > 33.3 && lat < 33.9 && lng > -84.6 && lng < -84.1) return "Atlanta";
  if (lat > 36.0 && lat < 36.3 && lng > -115.3 && lng < -114.9) return "Las Vegas";
  if (lat > 47.4 && lat < 47.8 && lng > -122.5 && lng < -122.1) return "Seattle";
  return "United States";
}

type NearbyQuery = {
  experience: ExperienceType;
  type?: string;
  keyword?: string;
  category: PulseCategory;
};

export const usaNearbyQueries: NearbyQuery[] = [
  { experience: "bus", type: "transit_station", keyword: "hop on hop off bus tour", category: "bus" },
  { experience: "bus", type: "tourist_attraction", keyword: "hop on hop off", category: "bus" },
  { experience: "museum", type: "museum", category: "museum" },
  { experience: "pizza", type: "restaurant", keyword: "pizza", category: "food" },
  { experience: "chinese", type: "restaurant", keyword: "chinese restaurant", category: "food" },
  { experience: "food", type: "restaurant", keyword: "food tour", category: "food" },
  { experience: "walking", type: "tourist_attraction", keyword: "walking tour", category: "tour" },
  { experience: "pickup", type: "taxi_stand", keyword: "hotel transfer", category: "pickup" },
  { experience: "cruise", type: "transit_station", keyword: "cruise terminal", category: "cruise" },
];

export function googlePlaceToSpot(input: {
  place: {
    place_id: string;
    name: string;
    vicinity?: string;
    formatted_address?: string;
    geometry: { location: { lat: number; lng: number } };
    rating?: number;
    types?: string[];
  };
  stay: { lat: number; lng: number };
  experience: ExperienceType;
  category: PulseCategory;
}): UsaNearbySpot {
  const lat = input.place.geometry.location.lat;
  const lng = input.place.geometry.location.lng;
  const meters = haversineMeters(input.stay, { lat, lng });
  const walkMinutes = walkMinutesFromMeters(meters);
  const inNyc = isInNycMetro(lat, lng);
  const projected = inNyc
    ? nycLatLngToCorridorT(lat, lng)
    : { t: Math.min(0.9, 0.2 + walkMinutes / 60), zoneId: "midtown" as PulseZoneId };

  const address =
    input.place.vicinity || input.place.formatted_address || "Nearby spot";

  return {
    id: `g-${input.place.place_id}`,
    name: input.place.name,
    kind: input.experience,
    experienceTypes: [input.experience],
    addressHint: address,
    howToBoard: `About ${walkMinutes} min walk from your stay. Open maps for turn-by-turn, or request a ToursIWant pickup/quote from this spot.`,
    lat,
    lng,
    walkMinutes,
    t: projected.t,
    zoneId: projected.zoneId,
    rating: input.place.rating,
  };
}

export function spotToPulseActivity(
  spot: UsaNearbySpot,
  category: PulseCategory,
): PulseActivity {
  return {
    id: `act-${spot.id}`,
    zoneId: spot.zoneId,
    category,
    status: "at_stop",
    title: spot.name,
    detail: `${spot.addressHint} · ~${spot.walkMinutes} min walk`,
    travellers: Math.max(2, Math.round((spot.rating || 4) * 2)),
    joinable: true,
    href: `/request?details=${encodeURIComponent(
      `I want to go to ${spot.name} near my stay (${spot.addressHint}).`,
    )}`,
    minutesAgo: Math.min(40, spot.walkMinutes),
  };
}
