import { NextResponse } from "next/server";
import { searchAffiliateProducts } from "@/lib/affiliate-products";
import {
  hasViatorApiKey,
  searchViatorProducts,
  viatorEnvLabel,
} from "@/lib/viator";

export const dynamic = "force-dynamic";

/**
 * Live Viator inventory for Bookable now.
 * Falls back to curated affiliate seed if API key missing or call fails.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const citySlug = searchParams.get("city") || "new-york";
  const stateCode = searchParams.get("state") || "all";
  const theme = searchParams.get("theme") || "all";
  const query = searchParams.get("q") || "";
  const count = Number(searchParams.get("count") || 24);

  const curated = searchAffiliateProducts({
    theme,
    stateCode: stateCode === "all" ? "all" : stateCode,
    citySlug: citySlug === "all" ? "all" : citySlug,
    query,
  }).filter(
    (item) => item.category === "experience" || item.category === "ticket",
  );

  if (!hasViatorApiKey()) {
    return NextResponse.json({
      products: curated,
      source: "curated",
      viatorConfigured: false,
      env: viatorEnvLabel(),
      message:
        "Set VIATOR_API_KEY (and VIATOR_API_ENV=sandbox|production) on Vercel to load live inventory.",
    });
  }

  try {
    const live = await searchViatorProducts({
      citySlug: citySlug === "all" ? "new-york" : citySlug,
      query,
      theme,
      count,
    });

    if (live.products.length > 0) {
      // Prefer live; keep curated non-viator (tiqets etc.) and unique viator extras
      const liveIds = new Set(live.products.map((p) => p.id));
      const extras = curated.filter(
        (p) => p.partner !== "viator" || !liveIds.has(p.id),
      );
      return NextResponse.json({
        products: [...live.products, ...extras].slice(0, 40),
        source: "viator",
        viatorConfigured: true,
        env: live.env,
        totalLive: live.products.length,
      });
    }

    return NextResponse.json({
      products: curated,
      source: "curated",
      viatorConfigured: true,
      env: live.env,
      error: live.error || "No live products; showing curated fallback",
    });
  } catch (error) {
    return NextResponse.json({
      products: curated,
      source: "curated",
      viatorConfigured: true,
      env: viatorEnvLabel(),
      error:
        error instanceof Error ? error.message : "Viator error; curated fallback",
    });
  }
}
