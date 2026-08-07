import { NextResponse } from "next/server";
import {
  curatedStayFromHotelId,
  matchHereNowFromStay,
  type ResolvedStay,
} from "@/lib/here-now";
import { hasGooglePlacesKey, metroLabel } from "@/lib/places-usa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  curatedId?: string;
  placeId?: string;
  name?: string;
  timeBucket?: string;
  mood?: string;
};

async function googleDetails(placeId: string, key: string) {
  const endpoint = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  endpoint.searchParams.set("place_id", placeId);
  endpoint.searchParams.set(
    "fields",
    "place_id,name,formatted_address,geometry",
  );
  endpoint.searchParams.set("key", key);
  const res = await fetch(endpoint.toString(), { next: { revalidate: 0 } });
  return (await res.json()) as {
    status: string;
    error_message?: string;
    result?: {
      place_id: string;
      name: string;
      formatted_address?: string;
      geometry: { location: { lat: number; lng: number } };
    };
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const filters = { timeBucket: body.timeBucket, mood: body.mood };

    if (body.curatedId) {
      const stay = curatedStayFromHotelId(body.curatedId);
      if (!stay) {
        return NextResponse.json({ error: "Stay not found." }, { status: 404 });
      }
      const match = matchHereNowFromStay(stay, filters);
      return NextResponse.json({
        enabled: hasGooglePlacesKey(),
        match,
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
            "Hotel search needs GOOGLE_PLACES_API_KEY. Use a featured hotel below for now.",
          enabled: false,
        },
        { status: 503 },
      );
    }

    const key = process.env.GOOGLE_PLACES_API_KEY!.trim();
    const details = await googleDetails(body.placeId, key);
    if (details.status !== "OK" || !details.result?.geometry?.location) {
      return NextResponse.json(
        {
          error:
            details.error_message ||
            "Could not resolve that hotel. Try another search or a featured stay.",
        },
        { status: 404 },
      );
    }

    const loc = details.result.geometry.location;
    const stay: ResolvedStay = {
      id: `google:${details.result.place_id}`,
      name: details.result.name || body.name || "Your stay",
      address: details.result.formatted_address || "United States",
      lat: loc.lat,
      lng: loc.lng,
      metro: metroLabel(loc.lat, loc.lng),
      source: "google",
    };

    const match = matchHereNowFromStay(stay, filters);
    return NextResponse.json({
      enabled: true,
      match,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not resolve your stay.",
      },
      { status: 500 },
    );
  }
}
