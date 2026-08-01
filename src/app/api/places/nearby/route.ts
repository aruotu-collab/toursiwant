import { NextResponse } from "next/server";
import { getNearMePlace, stopsNearPlace } from "@/lib/near-me";
import {
  googlePlaceToSpot,
  hasGooglePlacesKey,
  isInNycMetro,
  metroLabel,
  nycLatLngToCorridorT,
  spotToPulseActivity,
  usaNearbyQueries,
  type UsaNearbySpot,
  type UsaStay,
} from "@/lib/places-usa";
import type { ExperienceType } from "@/lib/near-me";
import type { PulseActivity } from "@/lib/tour-pulse";

export const runtime = "nodejs";

type Body = {
  curatedId?: string;
  placeId?: string;
  name?: string;
};

async function googleDetails(placeId: string, key: string) {
  const endpoint = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  endpoint.searchParams.set("place_id", placeId);
  endpoint.searchParams.set(
    "fields",
    "place_id,name,formatted_address,geometry,types",
  );
  endpoint.searchParams.set("key", key);
  const res = await fetch(endpoint.toString(), { next: { revalidate: 0 } });
  return (await res.json()) as {
    status: string;
    result?: {
      place_id: string;
      name: string;
      formatted_address?: string;
      geometry: { location: { lat: number; lng: number } };
    };
  };
}

async function googleNearby(input: {
  lat: number;
  lng: number;
  key: string;
  type?: string;
  keyword?: string;
}) {
  const endpoint = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
  );
  endpoint.searchParams.set("location", `${input.lat},${input.lng}`);
  endpoint.searchParams.set("radius", "3200");
  if (input.type) endpoint.searchParams.set("type", input.type);
  if (input.keyword) endpoint.searchParams.set("keyword", input.keyword);
  endpoint.searchParams.set("key", input.key);
  const res = await fetch(endpoint.toString(), { next: { revalidate: 0 } });
  return (await res.json()) as {
    status: string;
    results?: Array<{
      place_id: string;
      name: string;
      vicinity?: string;
      geometry: { location: { lat: number; lng: number } };
      rating?: number;
      types?: string[];
    }>;
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as Body;

  // Curated NYC stays — local seed data, no Google required
  if (body.curatedId) {
    const place = getNearMePlace(body.curatedId);
    if (!place) {
      return NextResponse.json({ error: "Stay not found." }, { status: 404 });
    }
    const stay: UsaStay = {
      id: place.id,
      name: place.name,
      address: place.blurb,
      lat: 40.756,
      lng: -73.99,
      source: "curated",
      zoneId: place.zoneId,
      t: place.t,
      metro: "New York",
    };
    // Rough lat/lng by corridor zone for curated pins
    const zoneCoords: Record<string, { lat: number; lng: number }> = {
      harbor: { lat: 40.76, lng: -74.0 },
      "lower-manhattan": { lat: 40.703, lng: -74.016 },
      midtown: { lat: 40.756, lng: -73.99 },
      "central-park": { lat: 40.779, lng: -73.963 },
      brooklyn: { lat: 40.703, lng: -73.99 },
      airports: { lat: 40.644, lng: -73.782 },
    };
    const c = zoneCoords[place.zoneId] || zoneCoords.midtown;
    stay.lat = c.lat;
    stay.lng = c.lng;

    const spots = stopsNearPlace(place.id, "all").map((stop) => ({
      id: stop.id,
      name: stop.name,
      kind: stop.kind,
      experienceTypes: stop.experienceTypes,
      addressHint: stop.addressHint,
      howToBoard: stop.howToBoard,
      lat: stay.lat,
      lng: stay.lng,
      walkMinutes: stop.walkMinutes,
      t: stop.t,
      zoneId: stop.zoneId,
    }));

    return NextResponse.json({
      mode: "curated",
      stay,
      useCorridor: true,
      spots,
      activities: null,
      typeCounts: null,
    });
  }

  if (!body.placeId) {
    return NextResponse.json(
      { error: "placeId or curatedId required." },
      { status: 400 },
    );
  }

  if (!hasGooglePlacesKey()) {
    return NextResponse.json(
      {
        error:
          "USA-wide stay search needs GOOGLE_PLACES_API_KEY on the server.",
        enabled: false,
      },
      { status: 503 },
    );
  }

  const key = process.env.GOOGLE_PLACES_API_KEY!.trim();
  const details = await googleDetails(body.placeId, key);
  if (details.status !== "OK" || !details.result?.geometry?.location) {
    return NextResponse.json(
      { error: "Could not resolve that stay." },
      { status: 404 },
    );
  }

  const loc = details.result.geometry.location;
  const inNyc = isInNycMetro(loc.lat, loc.lng);
  const projected = inNyc ? nycLatLngToCorridorT(loc.lat, loc.lng) : null;

  const stay: UsaStay = {
    id: `google:${details.result.place_id}`,
    name: details.result.name || body.name || "Your stay",
    address: details.result.formatted_address || "United States",
    lat: loc.lat,
    lng: loc.lng,
    source: "google",
    zoneId: projected?.zoneId,
    t: projected?.t,
    metro: metroLabel(loc.lat, loc.lng),
  };

  const spotMap = new Map<string, UsaNearbySpot>();
  const activityMap = new Map<string, PulseActivity>();
  const typeCounts: Partial<Record<ExperienceType, number>> = {};

  for (const query of usaNearbyQueries) {
    const nearby = await googleNearby({
      lat: loc.lat,
      lng: loc.lng,
      key,
      type: query.type,
      keyword: query.keyword,
    });
    const results = nearby.results || [];
    typeCounts[query.experience] =
      (typeCounts[query.experience] || 0) + results.length;

    for (const place of results.slice(0, 4)) {
      if (spotMap.has(place.place_id)) continue;
      const spot = googlePlaceToSpot({
        place,
        stay: loc,
        experience: query.experience,
        category: query.category,
      });
      spotMap.set(place.place_id, spot);
      activityMap.set(
        place.place_id,
        spotToPulseActivity(spot, query.category),
      );
    }
  }

  const spots = [...spotMap.values()].sort(
    (a, b) => a.walkMinutes - b.walkMinutes,
  );
  const activities = [...activityMap.values()].sort(
    (a, b) => a.minutesAgo - b.minutesAgo,
  );

  return NextResponse.json({
    mode: "google",
    stay,
    useCorridor: inNyc,
    spots,
    activities,
    typeCounts,
  });
}
