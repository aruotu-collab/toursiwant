import { NextResponse } from "next/server";
import {
  addSpecialEventRequest,
  createTripSession,
  getSessionByShareCode,
  saveSessionVotes,
  saveTravelledRating,
} from "@/lib/trip-sessions";
import type { ExperienceCategory } from "@/lib/trip-templates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }
  const session = await getSessionByShareCode(code);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "create" | "vote" | "rate" | "special";
    templateSlug?: string;
    templateTitle?: string;
    hotelName?: string;
    selections?: Record<string, string>;
    wants?: ExperienceCategory[];
    shareCode?: string;
    blockId?: string;
    optionId?: string;
    voterName?: string;
    rating?: number;
    note?: string;
    kind?: "band" | "private_dinner" | "other";
  };

  if (body.action === "create") {
    if (!body.templateSlug || !body.templateTitle) {
      return NextResponse.json({ error: "Missing template" }, { status: 400 });
    }
    const session = await createTripSession({
      templateSlug: body.templateSlug,
      templateTitle: body.templateTitle,
      hotelName: body.hotelName,
      selections: body.selections,
      wants: body.wants,
    });
    return NextResponse.json({ session });
  }

  if (body.action === "vote") {
    if (!body.shareCode || !body.blockId || !body.optionId) {
      return NextResponse.json({ error: "Missing vote fields" }, { status: 400 });
    }
    const session = await saveSessionVotes(
      body.shareCode,
      body.blockId,
      body.optionId,
      body.voterName || "Guest",
    );
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  }

  if (body.action === "rate") {
    if (!body.shareCode || !body.rating) {
      return NextResponse.json({ error: "Missing rating" }, { status: 400 });
    }
    const session = await saveTravelledRating(
      body.shareCode,
      body.rating,
      body.note,
    );
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  }

  if (body.action === "special") {
    if (!body.shareCode || !body.kind) {
      return NextResponse.json({ error: "Missing special fields" }, { status: 400 });
    }
    const session = await addSpecialEventRequest(
      body.shareCode,
      body.kind,
      body.note || "",
    );
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
