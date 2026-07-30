import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { ensureAppSchema, getSql, hasDatabase } from "@/lib/db";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  if (hasDatabase()) {
    await ensureAppSchema();
    const cookieStore = await cookies();
    const token = cookieStore.get("toursiwant_session")?.value;
    if (token) {
      const sql = getSql();
      await sql`DELETE FROM sessions WHERE token = ${token}`;
    }
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
