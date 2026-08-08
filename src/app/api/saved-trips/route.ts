import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createSavedTrip,
  deleteSavedTrip,
  getSavedTrip,
  listSavedTripsForUser,
  updateSavedTrip,
} from "@/lib/saved-trips";
import type { ExperienceCategory } from "@/lib/trip-templates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const trip = await getSavedTrip(id, user.id);
    if (!trip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ trip });
  }

  const trips = await listSavedTripsForUser(user.id);
  return NextResponse.json({ trips });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      action?: "create" | "update" | "delete";
      id?: string;
      templateSlug?: string;
      templateTitle?: string;
      title?: string;
      route?: string;
      region?: string;
      cityCodes?: string[];
      hotelName?: string;
      selections?: Record<string, string>;
      wants?: ExperienceCategory[];
      routeNodes?: Array<{
        id: string;
        label: string;
        kind: "hotel" | "day" | "stop";
        blockId?: string;
        dayLabel?: string;
        dayIndex?: number;
        stops?: Array<{ id: string; label: string }>;
      }>;
      placeSlugs?: string[];
      planDays?: number;
      dayAssignments?: Record<string, number>;
      sourceShareCode?: string;
    };

    if (body.action === "delete") {
      if (!body.id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
      }
      await deleteSavedTrip(body.id, user.id);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "update") {
      if (!body.id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
      }
      const trip = await updateSavedTrip(body.id, user.id, {
        title: body.title,
        route: body.route,
        selections: body.selections,
        wants: body.wants,
        routeNodes: body.routeNodes,
        placeSlugs: body.placeSlugs,
        planDays: body.planDays,
        dayAssignments: body.dayAssignments,
      });
      if (!trip) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ trip });
    }

    // create (default)
    if (!body.templateSlug || !body.templateTitle) {
      return NextResponse.json(
        { error: "templateSlug and templateTitle required" },
        { status: 400 },
      );
    }

    const trip = await createSavedTrip({
      userId: user.id,
      userEmail: user.email,
      templateSlug: body.templateSlug,
      templateTitle: body.templateTitle,
      title: body.title,
      route: body.route,
      region: body.region,
      cityCodes: body.cityCodes,
      hotelName: body.hotelName,
      selections: body.selections,
      wants: body.wants,
      routeNodes: body.routeNodes,
      placeSlugs: body.placeSlugs,
      planDays: body.planDays,
      dayAssignments: body.dayAssignments,
      sourceShareCode: body.sourceShareCode,
    });

    return NextResponse.json({ trip });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save trip";
    console.error("[saved-trips]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
