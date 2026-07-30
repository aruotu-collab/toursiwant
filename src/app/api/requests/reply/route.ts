import { NextResponse } from "next/server";
import { getCurrentUser, sendOperatorReplyEmail } from "@/lib/auth";
import {
  getRequestById,
  updateRequestReply,
} from "@/lib/requests-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (user.role !== "operator" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Operator access required." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    requestId?: string;
    message?: string;
    quote?: string;
  };

  const requestId = body.requestId?.trim();
  const message = body.message?.trim();
  if (!requestId || !message) {
    return NextResponse.json(
      { error: "Request id and message are required." },
      { status: 400 },
    );
  }

  const existing = await getRequestById(requestId);
  if (!existing || existing.source !== "live") {
    return NextResponse.json(
      { error: "Live request not found." },
      { status: 404 },
    );
  }

  const updated = await updateRequestReply({
    id: requestId,
    operatorReply: message,
    operatorQuote: body.quote,
    operatorName: user.name,
    operatorBusinessName: user.businessName,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Could not save reply." },
      { status: 500 },
    );
  }

  const operatorLabel =
    user.businessName?.trim() ||
    user.name?.trim() ||
    "A ToursIWant operator";
  const tourLabel =
    updated.tourTitle ||
    updated.eventName ||
    updated.details?.slice(0, 80) ||
    "your request";

  const emailResult = await sendOperatorReplyEmail({
    to: updated.email,
    travellerName: updated.name,
    tourLabel,
    travelDate: updated.travelDate,
    operatorLabel,
    quote: updated.operatorQuote,
    message: updated.operatorReply || message,
  });

  return NextResponse.json({
    ok: true,
    request: updated,
    emailSent: emailResult.sent,
    emailReason: emailResult.sent ? undefined : emailResult.reason,
  });
}
