import { NextResponse } from "next/server";
import { hasGooglePlacesKey } from "@/lib/places-usa";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    enabled: hasGooglePlacesKey(),
    coverage: hasGooglePlacesKey()
      ? "United States hotels & nearby places via Google Places"
      : "Curated New York stays until GOOGLE_PLACES_API_KEY is set",
  });
}
