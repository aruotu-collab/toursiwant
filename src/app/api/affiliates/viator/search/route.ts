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

  // If a tight query matches nothing in curated seed, still show city inventory
  const curatedOrCity =
    curated.length > 0
      ? curated
      : searchAffiliateProducts({
          theme,
          stateCode: stateCode === "all" ? "all" : stateCode,
          citySlug: citySlug === "all" ? "new-york" : citySlug,
          query: "",
        }).filter(
          (item) =>
            item.category === "experience" || item.category === "ticket",
        );

  if (!hasViatorApiKey()) {
    return NextResponse.json({
      products: curatedOrCity,
      source: "curated",
      viatorConfigured: false,
      env: viatorEnvLabel(),
      message:
        "Set VIATOR_API_KEY (and VIATOR_API_ENV=sandbox|production) on Vercel to load live inventory.",
      broadened: curated.length === 0 && Boolean(query),
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
      const extras = curatedOrCity.filter(
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

    // Live empty — try a broader city search once when a specific query was used
    if (query.trim()) {
      const broad = await searchViatorProducts({
        citySlug: citySlug === "all" ? "new-york" : citySlug,
        query: "",
        theme,
        count,
      });
      if (broad.products.length > 0 || curatedOrCity.length > 0) {
        const liveIds = new Set(broad.products.map((p) => p.id));
        const extras = curatedOrCity.filter(
          (p) => p.partner !== "viator" || !liveIds.has(p.id),
        );
        return NextResponse.json({
          products: [...broad.products, ...extras].slice(0, 40),
          source: broad.products.length ? "viator" : "curated",
          viatorConfigured: true,
          env: broad.env,
          totalLive: broad.products.length,
          broadened: true,
          message: `No exact matches for “${query}” — showing popular tours nearby.`,
        });
      }
    }

    return NextResponse.json({
      products: curatedOrCity,
      source: "curated",
      viatorConfigured: true,
      env: live.env,
      error: live.error || "No live products; showing curated fallback",
      broadened: curated.length === 0,
    });
  } catch (error) {
    return NextResponse.json({
      products: curatedOrCity,
      source: "curated",
      viatorConfigured: true,
      env: viatorEnvLabel(),
      error:
        error instanceof Error ? error.message : "Viator error; curated fallback",
    });
  }
}
