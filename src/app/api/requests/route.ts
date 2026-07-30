import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createRequest, listRequests, storageMode } from "@/lib/requests-store";
import { requestToActivity } from "@/lib/seed-requests";
import type { CapturedRequestType } from "@/lib/seed-requests";

export const runtime = "nodejs";

const ALLOWED_TYPES: CapturedRequestType[] = [
  "tour_interest",
  "custom_request",
  "operator_interest",
  "event_ride",
  "accommodation_request",
];

export async function GET() {
  const requests = await listRequests();
  const activity = requests.slice(0, 20).map(requestToActivity);

  return NextResponse.json({
    storage: storageMode(),
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
    needAccommodation?: boolean | string;
    accommodationNotes?: string;
    eventSlug?: string;
    eventName?: string;
    returnAddress?: string;
    eventStart?: string;
    eventEnd?: string;
  };

  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 },
    );
  }

  const type: CapturedRequestType = ALLOWED_TYPES.includes(
    body.type as CapturedRequestType,
  )
    ? (body.type as CapturedRequestType)
    : "custom_request";

  const user = await getCurrentUser().catch(() => null);

  const needAccommodation =
    body.needAccommodation === true ||
    body.needAccommodation === "true" ||
    body.needAccommodation === "on";

  const saved = await createRequest({
    type:
      needAccommodation && type === "custom_request"
        ? "custom_request"
        : type,
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
    userId: user?.id,
    needAccommodation,
    accommodationNotes: body.accommodationNotes,
    eventSlug: body.eventSlug,
    eventName: body.eventName,
    returnAddress: body.returnAddress,
    eventStart: body.eventStart,
    eventEnd: body.eventEnd,
  });

  return NextResponse.json({ ok: true, request: saved }, { status: 201 });
}
