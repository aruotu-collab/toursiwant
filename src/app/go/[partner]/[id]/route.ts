import { NextResponse } from "next/server";
import {
  getAffiliateProduct,
  resolveAffiliateDestination,
} from "@/lib/affiliate-products";
import { trackRevenueEvent } from "@/lib/revenue-events";
import { getViatorProductUrl } from "@/lib/viator";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ partner: string; id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { partner, id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  // Curated catalog product
  const curated = getAffiliateProduct(id);
  if (curated && curated.partner === partner) {
    try {
      await trackRevenueEvent({
        kind: "affiliate_click",
        partner: curated.partner,
        productId: curated.id,
        citySlug: curated.citySlug,
        path: `/go/${partner}/${id}`,
        meta: curated.category,
      });
    } catch {
      // continue
    }
    return NextResponse.redirect(resolveAffiliateDestination(curated), 302);
  }

  // Live Viator product codes (e.g. 7908P9) from API search
  if (partner === "viator") {
    try {
      await trackRevenueEvent({
        kind: "affiliate_click",
        partner: "viator",
        productId: id,
        path: `/go/viator/${id}`,
        meta: "api",
      });
    } catch {
      // continue
    }

    const productUrl = await getViatorProductUrl(id);
    if (productUrl) {
      return NextResponse.redirect(productUrl, 302);
    }

    // Last resort: search page on Viator
    return NextResponse.redirect(
      `https://www.viator.com/searchResults/all?text=${encodeURIComponent(id)}`,
      302,
    );
  }

  return NextResponse.redirect(new URL("/tours", request.url), 302);
}
