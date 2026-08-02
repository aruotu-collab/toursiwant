import { NextResponse } from "next/server";
import {
  getAffiliateProduct,
  resolveAffiliateDestination,
} from "@/lib/affiliate-products";
import { trackRevenueEvent } from "@/lib/revenue-events";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ partner: string; id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { partner, id } = await params;
  const product = getAffiliateProduct(id);

  if (!product || product.partner !== partner) {
    return NextResponse.redirect(new URL("/tours", request.url), 302);
  }

  try {
    await trackRevenueEvent({
      kind: "affiliate_click",
      partner: product.partner,
      productId: product.id,
      citySlug: product.citySlug,
      path: `/go/${partner}/${id}`,
      meta: product.category,
    });
  } catch {
    // Still redirect even if tracking fails
  }

  const destination = resolveAffiliateDestination(product);
  return NextResponse.redirect(destination, 302);
}
