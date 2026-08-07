import type { TourTheme } from "@/lib/tour-themes";

/** Monetisation partners (Phase A: affiliate redirect). */
export type AffiliatePartner =
  | "viator"
  | "tiqets"
  | "klook"
  | "expedia"
  | "airalo"
  | "discovercars";

export type AffiliateProduct = {
  id: string;
  partner: AffiliatePartner;
  title: string;
  citySlug: string;
  cityName: string;
  stateCode: string;
  themes: TourTheme[];
  priceFrom: string;
  duration: string;
  summary: string;
  /** Destination page when booked externally */
  destinationUrl: string;
  category: "experience" | "ticket" | "hotel" | "esim" | "car" | "transfer";
};

export const affiliatePartners: {
  id: AffiliatePartner;
  label: string;
  homeSignup: string;
}[] = [
  {
    id: "viator",
    label: "Viator",
    homeSignup: "https://www.viator.com/en-GB/partner/affiliate",
  },
  {
    id: "tiqets",
    label: "Tiqets",
    homeSignup: "https://www.tiqets.com/en/partners/",
  },
  {
    id: "klook",
    label: "Klook",
    homeSignup: "https://www.klook.com/en-US/affiliate/",
  },
  {
    id: "expedia",
    label: "Expedia",
    homeSignup: "https://developer.expediagroup.com/travel-seller/",
  },
  {
    id: "airalo",
    label: "Airalo",
    homeSignup: "https://www.airalo.com/affiliates",
  },
  {
    id: "discovercars",
    label: "DiscoverCars",
    homeSignup: "https://www.discovercars.com/affiliates",
  },
];

/**
 * Curated bookable-now inventory (hand-picked destinations).
 * Replace destinationUrl with tracked affiliate deep links once approved.
 * Clicks always go through /go/{partner}/{id} for measurement.
 */
export const affiliateProducts: AffiliateProduct[] = [
  {
    id: "viator-nyc-statue-ellis",
    partner: "viator",
    title: "Statue of Liberty & Ellis Island",
    citySlug: "new-york",
    cityName: "New York",
    stateCode: "NY",
    themes: ["history", "city", "museum"],
    priceFrom: "From ~$59",
    duration: "Half day",
    summary: "Standard bookable harbour experience — complete on partner site.",
    destinationUrl:
      "https://www.viator.com/New-York-City-attractions/Statue-of-Liberty/d687-a86",
    category: "experience",
  },
  {
    id: "viator-nyc-summit",
    partner: "viator",
    title: "SUMMIT One Vanderbilt tickets",
    citySlug: "new-york",
    cityName: "New York",
    stateCode: "NY",
    themes: ["city", "family"],
    priceFrom: "From ~$46",
    duration: "1–2 hours",
    summary: "Midtown observation experience — book instantly via partner.",
    destinationUrl:
      "https://www.viator.com/New-York-City-attractions/SUMMIT-One-Vanderbilt/d687-a25092",
    category: "experience",
  },
  {
    id: "viator-nyc-hop-on",
    partner: "viator",
    title: "Hop-on hop-off bus day pass",
    citySlug: "new-york",
    cityName: "New York",
    stateCode: "NY",
    themes: ["city", "family"],
    priceFrom: "From ~$49",
    duration: "All day",
    summary: "Flexible sightseeing loops across Manhattan.",
    destinationUrl:
      "https://www.viator.com/New-York-City-tours/Hop-on-Hop-off-Tours/d687-g12-c97",
    category: "experience",
  },
  {
    id: "viator-nyc-central-park",
    partner: "viator",
    title: "Central Park bike or walking tour",
    citySlug: "new-york",
    cityName: "New York",
    stateCode: "NY",
    themes: ["nature", "city"],
    priceFrom: "From ~$35",
    duration: "2–3 hours",
    summary: "Bookable park experience for same-day travellers.",
    destinationUrl:
      "https://www.viator.com/New-York-City-attractions/Central-Park/d687-a82",
    category: "experience",
  },
  {
    id: "viator-nyc-food",
    partner: "viator",
    title: "Lower East Side food tour",
    citySlug: "new-york",
    cityName: "New York",
    stateCode: "NY",
    themes: ["food", "city"],
    priceFrom: "From ~$99",
    duration: "3 hours",
    summary: "Small-group tasting walks — affiliate bookable now.",
    destinationUrl:
      "https://www.viator.com/New-York-City/d687-ttd/2-10",
    category: "experience",
  },
  {
    id: "tiqets-nyc-moma",
    partner: "tiqets",
    title: "MoMA admission tickets",
    citySlug: "new-york",
    cityName: "New York",
    stateCode: "NY",
    themes: ["museum", "history"],
    priceFrom: "Check partner",
    duration: "Flexible",
    summary: "Attraction tickets — pair with a ToursIWant driver or walk.",
    destinationUrl: "https://www.tiqets.com/en/new-york-attractions-c66065/",
    category: "ticket",
  },
  {
    id: "tiqets-nyc-edge",
    partner: "tiqets",
    title: "Edge observation deck",
    citySlug: "new-york",
    cityName: "New York",
    stateCode: "NY",
    themes: ["city", "family"],
    priceFrom: "Check partner",
    duration: "1–2 hours",
    summary: "Hudson Yards views — ticket affiliate inventory.",
    destinationUrl: "https://www.tiqets.com/en/new-york-attractions-c66065/",
    category: "ticket",
  },
  {
    id: "viator-la-hollywood",
    partner: "viator",
    title: "Hollywood & celebrity homes tour",
    citySlug: "los-angeles",
    cityName: "Los Angeles",
    stateCode: "CA",
    themes: ["city", "family"],
    priceFrom: "From ~$55",
    duration: "2–4 hours",
    summary: "Standard LA sightseeing — book on partner site.",
    destinationUrl: "https://www.viator.com/Los-Angeles/d645-ttd",
    category: "experience",
  },
  {
    id: "viator-vegas-grand-canyon",
    partner: "viator",
    title: "Grand Canyon day trip from Las Vegas",
    citySlug: "las-vegas",
    cityName: "Las Vegas",
    stateCode: "NV",
    themes: ["nature", "family"],
    priceFrom: "From ~$99",
    duration: "Full day",
    summary: "High-demand day trip inventory via affiliate.",
    destinationUrl: "https://www.viator.com/Las-Vegas/d684-ttd",
    category: "experience",
  },
  {
    id: "viator-miami-boat",
    partner: "viator",
    title: "Miami boat & coastline cruise",
    citySlug: "miami",
    cityName: "Miami",
    stateCode: "FL",
    themes: ["beach", "city"],
    priceFrom: "From ~$35",
    duration: "1.5–3 hours",
    summary: "Bookable water experiences for South Florida.",
    destinationUrl: "https://www.viator.com/Miami/d662-ttd",
    category: "experience",
  },
  {
    id: "viator-orlando-theme",
    partner: "viator",
    title: "Orlando theme-park day options",
    citySlug: "orlando",
    cityName: "Orlando",
    stateCode: "FL",
    themes: ["family"],
    priceFrom: "Check partner",
    duration: "Full day",
    summary: "Family day inventory — tickets & experiences.",
    destinationUrl: "https://www.viator.com/Orlando/d28-ttd",
    category: "experience",
  },
  {
    id: "viator-chicago-architecture",
    partner: "viator",
    title: "Chicago architecture river cruise",
    citySlug: "chicago",
    cityName: "Chicago",
    stateCode: "IL",
    themes: ["city", "history"],
    priceFrom: "From ~$49",
    duration: "1.5 hours",
    summary: "Classic Chicago bookable experience.",
    destinationUrl: "https://www.viator.com/Chicago/d673-ttd",
    category: "experience",
  },
  {
    id: "expedia-nyc-hotels",
    partner: "expedia",
    title: "Hotels near Midtown / Times Square",
    citySlug: "new-york",
    cityName: "New York",
    stateCode: "NY",
    themes: ["city", "family"],
    priceFrom: "Compare rates",
    duration: "Stay",
    summary: "Stay near your tour pickup — accommodation affiliate.",
    destinationUrl:
      "https://www.expedia.com/Hotel-Search?destination=New%20York%2C%20New%20York",
    category: "hotel",
  },
  {
    id: "airalo-usa-esim",
    partner: "airalo",
    title: "USA eSIM mobile data",
    citySlug: "new-york",
    cityName: "United States",
    stateCode: "NY",
    themes: ["transfer", "city"],
    priceFrom: "From ~$5",
    duration: "Trip data",
    summary: "Connectivity add-on for international travellers.",
    destinationUrl: "https://www.airalo.com/united-states-esim",
    category: "esim",
  },
  {
    id: "discovercars-nyc",
    partner: "discovercars",
    title: "Car rental · New York area",
    citySlug: "new-york",
    cityName: "New York",
    stateCode: "NY",
    themes: ["transfer", "family"],
    priceFrom: "Compare quotes",
    duration: "Rental",
    summary: "Self-drive option alongside ToursIWant transfers.",
    destinationUrl: "https://www.discovercars.com/usa/new-york",
    category: "car",
  },
  {
    id: "viator-sf-alcatraz",
    partner: "viator",
    title: "Alcatraz & San Francisco bay",
    citySlug: "san-francisco",
    cityName: "San Francisco",
    stateCode: "CA",
    themes: ["history", "city"],
    priceFrom: "From ~$99",
    duration: "Half day",
    summary: "High-intent bay area inventory.",
    destinationUrl: "https://www.viator.com/San-Francisco/d651-ttd",
    category: "experience",
  },
  {
    id: "viator-dc-monuments",
    partner: "viator",
    title: "Washington DC monuments tour",
    citySlug: "washington-dc",
    cityName: "Washington DC",
    stateCode: "DC",
    themes: ["history", "city"],
    priceFrom: "From ~$49",
    duration: "3–4 hours",
    summary: "Capital city bookable sightseeing.",
    destinationUrl: "https://www.viator.com/Washington-DC/d657-ttd",
    category: "experience",
  },
];

export function getAffiliateProduct(id: string) {
  return affiliateProducts.find((item) => item.id === id);
}

export function affiliateGoPath(product: AffiliateProduct) {
  return `/go/${product.partner}/${product.id}`;
}

/** Append partner tracking IDs when env vars are configured. */
export function resolveAffiliateDestination(product: AffiliateProduct): string {
  const url = new URL(product.destinationUrl);

  if (product.partner === "viator") {
    const pid = process.env.VIATOR_PARTNER_ID?.trim();
    if (pid) url.searchParams.set("pid", pid);
  }
  if (product.partner === "tiqets") {
    const ref = process.env.TIQETS_PARTNER_ID?.trim();
    if (ref) url.searchParams.set("partner", ref);
  }
  if (product.partner === "expedia") {
    const camref = process.env.EXPEDIA_CAMREF?.trim();
    if (camref) url.searchParams.set("camref", camref);
  }
  if (product.partner === "airalo") {
    const aid = process.env.AIRALO_AFFILIATE_ID?.trim();
    if (aid) url.searchParams.set("a_aid", aid);
  }
  if (product.partner === "klook") {
    const aid = process.env.KLOOK_AID?.trim();
    if (aid) url.searchParams.set("aid", aid);
  }
  if (product.partner === "discovercars") {
    const a = process.env.DISCOVERCARS_AFFILIATE_ID?.trim();
    if (a) url.searchParams.set("a_aid", a);
  }

  return url.toString();
}

export function searchAffiliateProducts(filters: {
  theme?: string;
  stateCode?: string;
  citySlug?: string;
  query?: string;
  category?: AffiliateProduct["category"] | "all";
}): AffiliateProduct[] {
  const theme = filters.theme || "all";
  const stateCode = filters.stateCode || "all";
  const citySlug = filters.citySlug || "all";
  const query = (filters.query || "").trim().toLowerCase();
  const category = filters.category || "all";

  return affiliateProducts.filter((item) => {
    if (stateCode !== "all" && item.stateCode !== stateCode) return false;
    if (citySlug !== "all" && item.citySlug !== citySlug) return false;
    if (theme !== "all" && !item.themes.includes(theme as TourTheme))
      return false;
    if (category !== "all" && item.category !== category) return false;
    // Soft match: any query word can hit (better recall for stop-node searches)
  if (query) {
    const hay =
      `${item.title} ${item.summary} ${item.cityName} ${item.themes.join(" ")} ${item.partner}`.toLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    if (!words.some((word) => hay.includes(word))) {
      return false;
    }
  }
    return true;
  });
}

/** Trip upsell slabs shown under tour / request success. */
export function tripUpsellsForCity(citySlug: string): AffiliateProduct[] {
  const stay =
    affiliateProducts.find(
      (p) => p.category === "hotel" && p.citySlug === citySlug,
    ) || affiliateProducts.find((p) => p.category === "hotel");
  const esim = affiliateProducts.find((p) => p.category === "esim");
  const car =
    affiliateProducts.find(
      (p) => p.category === "car" && p.citySlug === citySlug,
    ) || affiliateProducts.find((p) => p.category === "car");
  const tickets = affiliateProducts
    .filter(
      (p) =>
        (p.category === "ticket" || p.category === "experience") &&
        p.citySlug === citySlug,
    )
    .slice(0, 2);

  return [stay, esim, car, ...tickets].filter(
    (item): item is AffiliateProduct => Boolean(item),
  );
}
