import { NextResponse } from "next/server";
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
  const { code } = await ctx.params;
  const body = (await request.json()) as {
    action?: "join" | "vote";
    name?: string;
    voterKey?: string;
    votes?: Record<string, ScoreboardVote>;
  };

  if (body.action === "join") {
    const result = await joinScoreboardGroup(
      code,
      body.name || "Traveller",
      body.voterKey,
    );
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
