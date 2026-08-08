import { NextResponse } from "next/server";
import {
  createScoreboardGroup,
  getScoreboardGroup,
  rankGroupPlaces,
} from "@/lib/scoreboard-groups";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    hostName?: string;
  };
  const { group, voterKey } = await createScoreboardGroup({
    title: body.title || "New York Friends Trip",
    hostName: body.hostName || "Host",
  });
  return NextResponse.json({
    group,
    voterKey,
    ranks: rankGroupPlaces(group),
  });
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }
  const group = await getScoreboardGroup(code);
  if (!group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    group,
    ranks: rankGroupPlaces(group),
  });
}
