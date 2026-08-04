/**
 * Viator Partner API v2 — Basic Access (Affiliate).
 * Docs: https://docs.viator.com/partner-api/affiliate/technical/
 * Golden Path: real-time /products/search → productUrl on Viator (commission).
 */

import type { AffiliateProduct } from "@/lib/affiliate-products";
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

export type { ViatorProductRaw };
