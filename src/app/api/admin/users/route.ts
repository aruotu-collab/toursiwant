import { NextResponse } from "next/server";
import {
  listUsers,
  requireAdmin,
  updateUserRole,
  type UserRole,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const users = await listUsers(300);
  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const body = (await request.json()) as {
    userId?: string;
    role?: UserRole;
  };

  if (
    !body.userId ||
    !body.role ||
    !["traveller", "operator", "admin"].includes(body.role)
  ) {
    return NextResponse.json(
      { error: "userId and a valid role are required." },
      { status: 400 },
    );
  }

  const updated = await updateUserRole(body.userId, body.role);
  if (!updated) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user: updated });
}
