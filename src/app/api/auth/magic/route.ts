import { NextResponse } from "next/server";
import {
  createMagicLink,
  sendMagicEmail,
  type UserRole,
} from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      {
        error:
          "Accounts need Postgres. Set DATABASE_URL to enable magic-link signup.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    email?: string;
    name?: string;
    role?: UserRole;
    nextPath?: string;
  };

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }

  const role: UserRole =
    body.role === "operator" || body.role === "admin"
      ? body.role
      : "traveller";

  const nextPath =
    body.nextPath?.startsWith("/") && !body.nextPath.startsWith("//")
      ? body.nextPath
      : role === "operator"
        ? "/operator"
        : "/";

  const { magicUrl, expiresAt } = await createMagicLink({
    email,
    name: body.name?.trim(),
    role,
    nextPath,
  });

  const emailResult = await sendMagicEmail(email, magicUrl);

  return NextResponse.json({
    ok: true,
    email,
    expiresAt,
    emailed: emailResult.sent,
    emailReason: emailResult.sent ? undefined : emailResult.reason,
    // Dev / no-Resend fallback so signup still works
    magicUrl: emailResult.sent ? undefined : magicUrl,
  });
}
