import { NextResponse } from "next/server";
import {
  addSpecialEventRequest,
  createTripSession,
  getSessionByShareCode,
  joinTripSession,
  saveSessionVotes,
  saveTravelledRating,
  updateSessionWants,
  winningOptions,
} from "@/lib/trip-sessions";
import type { ExperienceCategory } from "@/lib/trip-templates";

export const dynamic = "force-dynamic";

function fail(error: unknown, fallback: string, status = 500) {
  const message = error instanceof Error ? error.message : fallback;
  console.error("[trip-sessions]", message, error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const code = new URL(request.url).searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }
    const session = await getSessionByShareCode(code);
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      session,
      winners: winningOptions(session),
    });
  } catch (error) {
    return fail(error, "Could not load share session");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "create" | "join" | "vote" | "rate" | "special" | "sync";
      templateSlug?: string;
      templateTitle?: string;
      hotelName?: string;
      selections?: Record<string, string>;
      wants?: ExperienceCategory[];
      shareCode?: string;
      blockId?: string;
      optionId?: string;
      voterName?: string;
      voterKey?: string;
      hostName?: string;
      hostKey?: string;
      rating?: number;
      note?: string;
      kind?: "band" | "private_dinner" | "other";
    };

    if (body.action === "create") {
      if (!body.templateSlug || !body.templateTitle) {
        return NextResponse.json(
          { error: "Missing template" },
          { status: 400 },
        );
      }
      const hostKey =
        body.hostKey ||
        body.voterKey ||
        `host_${Date.now().toString(36)}`;
      const hostName = (body.hostName || body.voterName || "Host").trim();
      const session = await createTripSession({
        templateSlug: body.templateSlug,
        templateTitle: body.templateTitle,
        hotelName: body.hotelName,
        selections: body.selections,
        wants: body.wants,
        hostName,
        hostKey,
      });
      return NextResponse.json({ session, winners: winningOptions(session) });
    }

    if (body.action === "join") {
      if (!body.shareCode || !body.voterKey) {
        return NextResponse.json(
          { error: "Missing join fields" },
          { status: 400 },
        );
      }
      const session = await joinTripSession(
        body.shareCode,
        body.voterKey,
        body.voterName || "Guest",
      );
      if (!session) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ session, winners: winningOptions(session) });
    }

    if (body.action === "vote") {
      if (!body.shareCode || !body.blockId || !body.optionId || !body.voterKey) {
        return NextResponse.json(
          { error: "Missing vote fields" },
          { status: 400 },
        );
      }
      const session = await saveSessionVotes(
        body.shareCode,
        body.blockId,
        body.optionId,
        body.voterName || "Guest",
        body.voterKey,
      );
      if (!session) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ session, winners: winningOptions(session) });
    }

    if (body.action === "sync") {
      if (!body.shareCode) {
        return NextResponse.json(
          { error: "Missing share code" },
          { status: 400 },
        );
      }
      const session = await updateSessionWants(
        body.shareCode,
        body.wants || [],
        body.selections || {},
      );
      if (!session) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ session, winners: winningOptions(session) });
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
      return NextResponse.json({ session, winners: winningOptions(session) });
    }

    if (body.action === "special") {
      if (!body.shareCode || !body.kind) {
        return NextResponse.json(
          { error: "Missing special fields" },
          { status: 400 },
        );
      }
      const session = await addSpecialEventRequest(
        body.shareCode,
        body.kind,
        body.note || "",
      );
      if (!session) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ session, winners: winningOptions(session) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return fail(error, "Could not update share session");
  }
}
