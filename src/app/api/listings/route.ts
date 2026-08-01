import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createOperatorListing,
  interestFromThemes,
  listOperatorListings,
  listPublishedCatalogTours,
} from "@/lib/listings-store";
import type { TourTheme } from "@/lib/tour-themes";
import { tourThemeDefs } from "@/lib/tour-themes";

export const dynamic = "force-dynamic";

const themeIds = new Set(
  tourThemeDefs.filter((t) => t.id !== "all").map((t) => t.id),
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "public";

  if (scope === "mine") {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    if (user.role !== "operator" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Operator account required." },
        { status: 403 },
      );
    }
    const listings = await listOperatorListings(user.id);
    return NextResponse.json({ listings });
  }

  const tours = await listPublishedCatalogTours();
  return NextResponse.json({ tours });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (user.role !== "operator" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Operator account required to publish tours." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const citySlug = String(body.citySlug || "").trim();
  const duration = String(body.duration || "").trim();
  const meetup = String(body.meetup || "").trim();
  const priceFrom = String(body.priceFrom || "").trim();
  const summary = String(body.summary || "").trim();
  const themes = Array.isArray(body.themes)
    ? (body.themes as string[]).filter((t): t is TourTheme =>
        themeIds.has(t as TourTheme),
      )
    : [];

  if (!title || !citySlug || !duration || !meetup || !priceFrom || !summary) {
    return NextResponse.json(
      { error: "Title, city, duration, meetup, price, and summary are required." },
      { status: 400 },
    );
  }
  if (!themes.length) {
    return NextResponse.json(
      { error: "Select at least one theme (e.g. Religious)." },
      { status: 400 },
    );
  }

  try {
    const listing = await createOperatorListing({
      operatorUserId: user.id,
      operatorEmail: user.email,
      operatorName: user.name,
      businessName: user.businessName,
      citySlug,
      title,
      duration,
      meetup,
      priceFrom,
      summary,
      themes,
      interest: interestFromThemes(themes),
      joinable: body.joinable !== false,
      timeLabel: String(body.timeLabel || "On request"),
      schedule:
        body.schedule === "fixed" || body.schedule === "rolling"
          ? body.schedule
          : "flexible",
      weekdays: Array.isArray(body.weekdays)
        ? (body.weekdays as number[]).filter((n) => n >= 0 && n <= 6)
        : [],
      spacesDefault: Number(body.spacesDefault) || 8,
      status: body.status === "draft" ? "draft" : "published",
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not publish listing.",
      },
      { status: 400 },
    );
  }
}
