import { NextResponse } from "next/server";
import { createRequest, listRequests } from "@/lib/requests-store";
import { requestToActivity } from "@/lib/seed-requests";
import type { CapturedRequestType } from "@/lib/seed-requests";

export const runtime = "nodejs";

export async function GET() {
  const requests = await listRequests();
  const activity = requests.slice(0, 20).map(requestToActivity);

  return NextResponse.json({
    count: requests.length,
    liveCount: requests.filter((item) => item.source === "live").length,
    mockCount: requests.filter((item) => item.source === "mock").length,
    requests: requests.slice(0, 50),
    activity,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    type?: CapturedRequestType;
    name?: string;
    email?: string;
    phone?: string;
    travelDate?: string;
    tourSlug?: string;
    tourTitle?: string;
    groupSize?: string | number;
    pickup?: string;
    details?: string;
    joinGroup?: boolean | string;
    businessName?: string;
  };

  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 },
    );
  }

  const type: CapturedRequestType =
    body.type === "operator_interest" ||
    body.type === "tour_interest" ||
    body.type === "custom_request"
      ? body.type
      : "custom_request";

  const saved = await createRequest({
    type,
    name: body.name,
    email: body.email,
    phone: body.phone,
    travelDate: body.travelDate,
    tourSlug: body.tourSlug,
    tourTitle: body.tourTitle,
    groupSize:
      body.groupSize === undefined || body.groupSize === ""
        ? undefined
        : Number(body.groupSize),
    pickup: body.pickup,
    details: body.details,
    joinGroup:
      body.joinGroup === true ||
      body.joinGroup === "true" ||
      body.joinGroup === "on",
    businessName: body.businessName,
  });

  return NextResponse.json({ ok: true, request: saved }, { status: 201 });
}
