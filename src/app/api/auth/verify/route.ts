import { NextResponse } from "next/server";
import { consumeMagicToken, createSessionCookie } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || url.origin;

  if (!hasDatabase() || !token) {
    return NextResponse.redirect(`${site}/join?error=invalid`);
  }

  const result = await consumeMagicToken(token);
  if (!result) {
    return NextResponse.redirect(`${site}/join?error=expired`);
  }

  await createSessionCookie(result.sessionToken, result.sessionExpires);

  const next =
    result.nextPath.startsWith("/") && !result.nextPath.startsWith("//")
      ? result.nextPath
      : "/";

  return NextResponse.redirect(`${site}${next}`);
}
