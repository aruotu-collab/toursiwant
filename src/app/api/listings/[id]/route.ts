import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setListingStatus } from "@/lib/listings-store";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (user.role !== "operator" && user.role !== "admin") {
    return NextResponse.json({ error: "Operator required." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    status?: string;
  } | null;
  const status = body?.status;
  if (status !== "published" && status !== "draft" && status !== "archived") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const listing = await setListingStatus(id, user.id, status);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  return NextResponse.json({ listing });
}
