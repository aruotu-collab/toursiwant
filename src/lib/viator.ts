/**
 * Viator Partner API v2 — Basic Access (Affiliate).
 * Docs: https://docs.viator.com/partner-api/affiliate/technical/
 * Golden Path: real-time /products/search → productUrl on Viator (commission).
 */

import {
  affiliateGoPath,
  type AffiliateProduct,
} from "@/lib/affiliate-products";
import type {
  PulseActivity,
  PulseCategory,
  PulseZoneId,
} from "@/lib/tour-pulse";
import type { TourTheme } from "@/lib/tour-themes";

export type ViatorEnv = "sandbox" | "production";

/** City slug → Viator destination id (primary selectable cities we market). */
export const viatorDestinationByCity: Record<
  string,
  { destinationId: string; cityName: string; stateCode: string }
> = {
  "new-york": { destinationId: "687", cityName: "New York", stateCode: "NY" },
  "los-angeles": {
    destinationId: "645",
    cityName: "Los Angeles",
    stateCode: "CA",
  },
  "las-vegas": { destinationId: "684", cityName: "Las Vegas", stateCode: "NV" },
  miami: { destinationId: "662", cityName: "Miami", stateCode: "FL" },
  orlando: { destinationId: "28", cityName: "Orlando", stateCode: "FL" },
  chicago: { destinationId: "673", cityName: "Chicago", stateCode: "IL" },
  "san-francisco": {
    destinationId: "651",
    cityName: "San Francisco",
    stateCode: "CA",
  },
  "washington-dc": {
    destinationId: "657",
    cityName: "Washington DC",
    stateCode: "DC",
  },
  boston: { destinationId: "479", cityName: "Boston", stateCode: "MA" },
  "new-orleans": {
    destinationId: "663",
    cityName: "New Orleans",
    stateCode: "LA",
  },
  seattle: { destinationId: "549", cityName: "Seattle", stateCode: "WA" },
  houston: { destinationId: "660", cityName: "Houston", stateCode: "TX" },
  dallas: { destinationId: "661", cityName: "Dallas", stateCode: "TX" },
  atlanta: { destinationId: "221", cityName: "Atlanta", stateCode: "GA" },
  "san-diego": {
    destinationId: "504",
    cityName: "San Diego",
    stateCode: "CA",
  },
  philadelphia: {
    destinationId: "505",
    cityName: "Philadelphia",
    stateCode: "PA",
  },
  honolulu: { destinationId: "213", cityName: "Honolulu", stateCode: "HI" },
  nashville: { destinationId: "302", cityName: "Nashville", stateCode: "TN" },
  denver: { destinationId: "525", cityName: "Denver", stateCode: "CO" },
  phoenix: { destinationId: "522", cityName: "Phoenix", stateCode: "AZ" },
};

type ViatorImageVariant = { height?: number; width?: number; url?: string };
type ViatorProductRaw = {
  productCode?: string;
  title?: string;
  description?: string;
  productUrl?: string;
  pricing?: {
    summary?: { fromPrice?: number; fromPriceBeforeDiscount?: number };
    currency?: string;
  };
  reviews?: { combinedAverageRating?: number; totalReviews?: number };
  images?: Array<{
    isCover?: boolean;
    variants?: ViatorImageVariant[];
  }>;
  destinations?: Array<{ ref?: string; primary?: boolean }>;
  flags?: string[];
  tags?: number[];
};

function apiBase(): string {
  const env = (process.env.VIATOR_API_ENV || "sandbox").toLowerCase();
  if (env === "production" || env === "prod") {
    return "https://api.viator.com/partner";
  }
  return "https://api.sandbox.viator.com/partner";
}

export function hasViatorApiKey() {
  return Boolean(process.env.VIATOR_API_KEY?.trim());
}

export function viatorEnvLabel(): ViatorEnv {
  const env = (process.env.VIATOR_API_ENV || "sandbox").toLowerCase();
  return env === "production" || env === "prod" ? "production" : "sandbox";
}

async function viatorFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const key = process.env.VIATOR_API_KEY?.trim();
  if (!key) return null;

  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "exp-api-key": key,
      Accept: "application/json;version=2.0",
      "Accept-Language": "en-US",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      `[viator] ${path} ${res.status}`,
      text.slice(0, 300),
    );
    return null;
  }

  return (await res.json()) as T;
}

function pickImage(product: ViatorProductRaw): string | undefined {
  const images = product.images || [];
  const cover = images.find((img) => img.isCover) || images[0];
  const variants = cover?.variants || [];
  const preferred =
    variants.find((v) => v.width === 400) ||
    variants.find((v) => (v.width || 0) >= 200) ||
    variants[variants.length - 1];
  return preferred?.url;
}

function formatPrice(product: ViatorProductRaw): string {
  const amount = product.pricing?.summary?.fromPrice;
  const currency = product.pricing?.currency || "USD";
  if (amount == null || Number.isNaN(Number(amount))) return "Check price";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `From $${Number(amount).toFixed(0)}`;
  }
}

function mapCityFromProduct(
  product: ViatorProductRaw,
  fallbackCitySlug: string,
) {
  const primary =
    product.destinations?.find((d) => d.primary) || product.destinations?.[0];
  const destId = primary?.ref;
  if (destId) {
    const entry = Object.entries(viatorDestinationByCity).find(
      ([, v]) => v.destinationId === destId,
    );
    if (entry) {
      return {
        citySlug: entry[0],
        cityName: entry[1].cityName,
        stateCode: entry[1].stateCode,
      };
    }
  }
  const known = viatorDestinationByCity[fallbackCitySlug];
  if (known) {
    return {
      citySlug: fallbackCitySlug,
      cityName: known.cityName,
      stateCode: known.stateCode,
    };
  }
  return {
    citySlug: fallbackCitySlug || "new-york",
    cityName: "United States",
    stateCode: "US",
  };
}

function inferThemes(
  product: ViatorProductRaw,
  requested?: string,
): TourTheme[] {
  if (requested && requested !== "all") {
    return [requested as TourTheme];
  }
  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();
  const themes: TourTheme[] = [];
  if (/museum|gallery|art/.test(text)) themes.push("museum");
  if (/food|culinary|taste|wine/.test(text)) themes.push("food");
  if (/beach|boat|cruise|harbor|harbour|snorkel/.test(text))
    themes.push("beach");
  if (/night|show|club|jazz/.test(text)) themes.push("nightlife");
  if (/park|hike|nature|canyon|garden/.test(text)) themes.push("nature");
  if (/history|monument|heritage|ellis|statue/.test(text)) themes.push("history");
  if (/family|kids|disney|universal/.test(text)) themes.push("family");
  if (/church|cathedral|temple|religious|gospel|faith/.test(text))
    themes.push("religious");
  if (!themes.length) themes.push("city");
  return themes;
}

export function viatorProductToAffiliate(
  product: ViatorProductRaw,
  fallbackCitySlug: string,
  theme?: string,
): AffiliateProduct | null {
  const code = product.productCode?.trim();
  const title = product.title?.trim();
  const url = product.productUrl?.trim();
  if (!code || !title || !url) return null;

  const place = mapCityFromProduct(product, fallbackCitySlug);
  const rating = product.reviews?.combinedAverageRating;
  const reviews = product.reviews?.totalReviews;
  const freeCancel = product.flags?.includes("FREE_CANCELLATION");

  let summary = (product.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  if (summary.length === 140) summary = `${summary}…`;
  if (rating != null) {
    summary = `${rating.toFixed(1)}★${reviews ? ` (${reviews})` : ""}${freeCancel ? " · Free cancellation" : ""}${summary ? ` · ${summary}` : ""}`;
  }

  return {
    id: code,
    partner: "viator",
    title,
    citySlug: place.citySlug,
    cityName: place.cityName,
    stateCode: place.stateCode,
    themes: inferThemes(product, theme),
    priceFrom: formatPrice(product),
    duration: "See partner",
    summary: summary || "Book on Viator — ToursIWant affiliate inventory.",
    destinationUrl: url,
    category: "experience",
  };
}

export async function searchViatorProducts(options: {
  citySlug?: string;
  query?: string;
  theme?: string;
  count?: number;
}): Promise<{
  products: AffiliateProduct[];
  source: "viator" | "none";
  env: ViatorEnv;
  error?: string;
}> {
  if (!hasViatorApiKey()) {
    return {
      products: [],
      source: "none",
      env: viatorEnvLabel(),
      error: "VIATOR_API_KEY not set",
    };
  }

  const count = Math.min(Math.max(options.count || 20, 1), 50);
  const citySlug = options.citySlug && options.citySlug !== "all"
    ? options.citySlug
    : "new-york";
  const dest =
    viatorDestinationByCity[citySlug] || viatorDestinationByCity["new-york"];

  const query = options.query?.trim();

  // Free-text when user typed a search (e.g. Patterson, museum…)
  if (query && query.length >= 2) {
    const freetext = await viatorFetch<{
      products?: ViatorProductRaw[];
      totalCount?: number;
    }>("/search/freetext", {
      method: "POST",
      body: JSON.stringify({
        searchTerm: query,
        productFiltering: {
          destination: dest.destinationId,
        },
        searchTypes: ["PRODUCTS"],
        currency: "USD",
        pagination: { start: 1, count },
      }),
    });

    // Some API versions nest differently; also try products/search with destination only + client filter
    if (freetext) {
      const products = (freetext.products || [])
        .map((p) => viatorProductToAffiliate(p, citySlug, options.theme))
        .filter((p): p is AffiliateProduct => Boolean(p));
      if (products.length) {
        return { products, source: "viator", env: viatorEnvLabel() };
      }
    }
  }

  const body = {
    filtering: {
      destination: dest.destinationId,
    },
    sorting: {
      sort: "TRAVELER_RATING",
      order: "DESCENDING",
    },
    pagination: {
      start: 1,
      count,
    },
    currency: "USD",
  };

  const data = await viatorFetch<{
    products?: ViatorProductRaw[];
    totalCount?: number;
  }>("/products/search", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!data) {
    return {
      products: [],
      source: "none",
      env: viatorEnvLabel(),
      error: "Viator search failed (check key / wait for activation)",
    };
  }

  let products = (data.products || [])
    .map((p) => viatorProductToAffiliate(p, citySlug, options.theme))
    .filter((p): p is AffiliateProduct => Boolean(p));

  if (query) {
    const q = query.toLowerCase();
    products = products.filter((p) =>
      `${p.title} ${p.summary}`.toLowerCase().includes(q),
    );
  }

  if (options.theme && options.theme !== "all") {
    products = products.filter((p) =>
      p.themes.includes(options.theme as TourTheme),
    );
  }

  return { products, source: "viator", env: viatorEnvLabel() };
}

/** Resolve product page URL for redirect tracking. */
export async function getViatorProductUrl(
  productCode: string,
): Promise<string | null> {
  if (!hasViatorApiKey()) return null;
  const code = encodeURIComponent(productCode);
  const data = await viatorFetch<ViatorProductRaw>(`/products/${code}`, {
    method: "GET",
    next: { revalidate: 3600 },
  });
  return data?.productUrl || null;
}

/** Map hotel metro label → destination we can search on Viator. */
export function citySlugFromMetroLabel(metro?: string | null): string {
  if (!metro) return "new-york";
  const m = metro.toLowerCase();
  if (/new york|manhattan|brooklyn|queens|jersey city/.test(m)) return "new-york";
  if (/los angeles|hollywood|hollywood hollywood|santa monica/.test(m))
    return "los-angeles";
  if (/las vegas/.test(m)) return "las-vegas";
  if (/miami|fort lauderdale|south beach/.test(m)) return "miami";
  if (/orlando|disney/.test(m)) return "orlando";
  if (/chicago/.test(m)) return "chicago";
  if (/san francisco|sf bay|oakland/.test(m)) return "san-francisco";
  if (/washington|d\.?c\.?/.test(m)) return "washington-dc";
  if (/boston/.test(m)) return "boston";
  if (/new orleans|nola/.test(m)) return "new-orleans";
  if (/seattle/.test(m)) return "seattle";
  if (/houston/.test(m)) return "houston";
  if (/dallas|fort worth/.test(m)) return "dallas";
  if (/atlanta/.test(m)) return "atlanta";
  if (/san diego/.test(m)) return "san-diego";
  if (/philadelphia|philly/.test(m)) return "philadelphia";
  if (/honolulu|waikiki|oahu/.test(m)) return "honolulu";
  if (/nashville/.test(m)) return "nashville";
  if (/denver/.test(m)) return "denver";
  if (/phoenix|scottsdale/.test(m)) return "phoenix";
  return "new-york";
}

function zoneForViatorTitle(title: string, index: number): PulseZoneId {
  const t = title.toLowerCase();
  if (/statue|ellis|harbor|harbour|cruise|battery|liberty|ferry/.test(t))
    return "harbor";
  if (/wall street|downtown|9\/?11|financial|lower manhattan|ground zero/.test(t))
    return "lower-manhattan";
  if (/central park|museum|moma|met |guggenheim|upper east|5th /.test(t))
    return "central-park";
  if (/brooklyn|dumbo|williamsburg|bridge walk/.test(t)) return "brooklyn";
  if (/airport|jfk|lga|ewr|transfer|shuttle/.test(t)) return "airports";
  if (
    /times square|broadway|midtown|rockefeller|empire|one world|summit|radio city/.test(
      t,
    )
  )
    return "midtown";
  const zones: PulseZoneId[] = [
    "harbor",
    "lower-manhattan",
    "midtown",
    "central-park",
    "brooklyn",
    "airports",
  ];
  return zones[index % zones.length];
}

function categoryForViatorProduct(product: AffiliateProduct): PulseCategory {
  const text = `${product.title} ${product.summary} ${product.themes.join(" ")}`.toLowerCase();
  if (/museum|gallery|art/.test(text) || product.themes.includes("museum"))
    return "museum";
  if (/food|taste|culinary|wine|pizza/.test(text) || product.themes.includes("food"))
    return "food";
  if (/cruise|boat|ferry|harbor|yacht/.test(text)) return "cruise";
  if (/bus|hop.?on|hop.?off|coach/.test(text)) return "bus";
  if (/airport|transfer|pickup|shuttle/.test(text)) return "pickup";
  if (/show|broadway|concert|event/.test(text)) return "event";
  return "tour";
}

/** Project Viator affiliate inventory onto the NYC pulse spine. */
export function viatorProductToPulseActivity(
  product: AffiliateProduct,
  index: number,
): PulseActivity {
  return {
    id: `viator-${product.id}`,
    zoneId: zoneForViatorTitle(product.title, index),
    category: categoryForViatorProduct(product),
    status: "departing_soon",
    title: product.title,
    detail: `Viator · ${product.priceFrom}${product.duration !== "See partner" ? ` · ${product.duration}` : ""} · book now`,
    travellers: 4 + (index % 9),
    joinable: true,
    href: affiliateGoPath(product),
    source: "viator",
    priceFrom: product.priceFrom,
    minutesAgo: index % 12,
  };
}

export type { ViatorProductRaw };
