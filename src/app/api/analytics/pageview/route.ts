import { NextResponse } from "next/server";
import { dbRecordPageView, hasDatabase } from "@/lib/db";

export const runtime = "nodejs";

const SKIP_PREFIXES = ["/api/", "/admin", "/operator", "/account", "/join"];

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  const body = (await request.json().catch(() => null)) as {
    path?: string;
    referrer?: string;
    sessionKey?: string;
  } | null;

  const path = body?.path?.trim() || "/";
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    SKIP_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
  ) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  await dbRecordPageView({
    id: `pv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    path,
    referrer: body?.referrer,
    sessionKey: body?.sessionKey,
  });

  return NextResponse.json({ ok: true, tracked: true });
}
