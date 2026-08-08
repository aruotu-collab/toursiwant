import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getScoreboardGroup,
  joinScoreboardGroup,
  rankGroupPlaces,
  setScoreboardVotes,
  type ScoreboardVote,
} from "@/lib/scoreboard-groups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const group = await getScoreboardGroup(code);
  if (!group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    group,
    ranks: rankGroupPlaces(group),
  });
}

export async function POST(request: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { code } = await ctx.params;
  const body = (await request.json()) as {
    action?: "join" | "vote";
    name?: string;
    voterKey?: string;
    votes?: Record<string, ScoreboardVote>;
  };

  if (body.action === "join") {
    const name =
      body.name?.trim() ||
      user.name?.split(" ")[0] ||
      user.email.split("@")[0] ||
      "Traveller";
    const result = await joinScoreboardGroup(code, name, {
      existingKey: body.voterKey,
      userId: user.id,
    });
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      group: result.group,
      voterKey: result.voterKey,
      ranks: rankGroupPlaces(result.group),
    });
  }

  if (body.action === "vote") {
    if (!body.voterKey || !body.votes) {
      return NextResponse.json(
        { error: "voterKey and votes required" },
        { status: 400 },
      );
    }

    // Ensure this voter seat belongs to the signed-in user (or claim legacy seats).
    const existing = await getScoreboardGroup(code);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const voter = existing.voters.find((v) => v.key === body.voterKey);
    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }
    if (voter.userId && voter.userId !== user.id) {
      return NextResponse.json(
        { error: "This vote seat belongs to another account" },
        { status: 403 },
      );
    }
    if (!voter.userId) {
      voter.userId = user.id;
      // Persist claim via a no-op name update through join helper path:
      await joinScoreboardGroup(code, voter.name, {
        existingKey: voter.key,
        userId: user.id,
      });
    }

    const group = await setScoreboardVotes(code, body.voterKey, body.votes);
    if (!group) {
      return NextResponse.json(
        { error: "Voter or group not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      group,
      ranks: rankGroupPlaces(group),
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
