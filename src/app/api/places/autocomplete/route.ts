import { NextResponse } from "next/server";
import { searchNearMePlaces } from "@/lib/near-me";
import { hasGooglePlacesKey } from "@/lib/places-usa";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";

  const lodgingOnly = url.searchParams.get("lodging") === "1";

  const curated = searchNearMePlaces(q, 5).map((place) => ({
    id: place.id,
    name: place.name,
    subtitle: place.blurb,
    source: "curated" as const,
    zoneId: place.zoneId,
    t: place.t,
  }));

  if (!hasGooglePlacesKey() || q.length < 2) {
    return NextResponse.json({
      enabled: hasGooglePlacesKey(),
      places: curated,
    });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY!.trim();
  const endpoint = new URL(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json",
  );
  endpoint.searchParams.set("input", q);
  endpoint.searchParams.set(
    "types",
    lodgingOnly ? "lodging" : "establishment",
  );
  endpoint.searchParams.set("components", "country:us");
  endpoint.searchParams.set("key", key);

  try {
    const res = await fetch(endpoint.toString(), { next: { revalidate: 0 } });
    const data = (await res.json()) as {
      status: string;
      error_message?: string;
      predictions?: Array<{
        place_id: string;
        description: string;
        structured_formatting?: {
          main_text: string;
          secondary_text?: string;
        };
      }>;
    };

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({
        enabled: true,
        places: curated,
        warning: data.error_message || data.status,
      });
    }

    const google = (data.predictions || []).slice(0, 6).map((p) => ({
      id: `google:${p.place_id}`,
      placeId: p.place_id,
      name: p.structured_formatting?.main_text || p.description,
      subtitle:
        p.structured_formatting?.secondary_text ||
        "United States · Google Places",
      source: "google" as const,
    }));

    // Curated first when names overlap, then Google USA results
    const places = [...curated, ...google].slice(0, 10);
    return NextResponse.json({ enabled: true, places });
  } catch {
    return NextResponse.json({
      enabled: true,
      places: curated,
      warning: "Places lookup temporarily unavailable.",
    });
  }
}
