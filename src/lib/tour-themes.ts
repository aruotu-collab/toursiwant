import type { CatalogTour } from "@/lib/us-tour-catalog";
import { catalogTours, tourMetros } from "@/lib/us-tour-catalog";
import { getToursForDate, type TourDeparture } from "@/lib/sample-tours";

/** Traveller-facing discovery themes (search from anywhere in the world). */
export const tourThemeDefs = [
  { id: "all", label: "All themes", color: "#f5c542" },
  { id: "religious", label: "Religious", color: "#c4b5fd" },
  { id: "museum", label: "Museum", color: "#60a5fa" },
  { id: "beach", label: "Beach & coast", color: "#7dd3c0" },
  { id: "food", label: "Food", color: "#fb7185" },
  { id: "city", label: "City highlights", color: "#5b9bd5" },
  { id: "nightlife", label: "Nightlife", color: "#c084fc" },
  { id: "nature", label: "Nature", color: "#86efac" },
  { id: "history", label: "History", color: "#d4a017" },
  { id: "family", label: "Family", color: "#f97316" },
  { id: "transfer", label: "Transfers", color: "#94a3b8" },
] as const;

export type TourThemeId = (typeof tourThemeDefs)[number]["id"];

const STATE_NAMES: Record<string, string> = {
  NY: "New York",
  CA: "California",
  NV: "Nevada",
  FL: "Florida",
  IL: "Illinois",
  DC: "Washington DC",
  MA: "Massachusetts",
  LA: "Louisiana",
  WA: "Washington",
  TX: "Texas",
  GA: "Georgia",
  PA: "Pennsylvania",
  HI: "Hawaii",
  TN: "Tennessee",
  CO: "Colorado",
  AZ: "Arizona",
};

export type TourTheme = Exclude<TourThemeId, "all">;

/** Infer themes from interest + keywords when not set explicitly on a tour. */
export function deriveThemes(tour: CatalogTour): TourTheme[] {
  if (tour.themes && tour.themes.length > 0) return tour.themes;

  const text =
    `${tour.title} ${tour.summary} ${tour.meetup} ${tour.interest}`.toLowerCase();
  const out = new Set<TourTheme>();

  if (
    /gospel|church|cathedral|temple|mosque|synagogue|bethel|watchtower|jehovah|pilgrim|mission|basilica|religious|spiritual|faith/.test(
      text,
    )
  ) {
    out.add("religious");
  }
  if (
    tour.interest === "Museums & culture" ||
    /museum|gallery|art walk|smithsonian|getty/.test(text)
  ) {
    out.add("museum");
  }
  if (
    /beach|coast|ocean|surf|key west|waikiki|miami beach|harbor cruise|yacht|ferry/.test(
      text,
    ) ||
    tour.interest === "Cruise shore excursion"
  ) {
    out.add("beach");
  }
  if (tour.interest === "Food & markets" || /food|pizza|market|taste|culinary|soul food/.test(text)) {
    out.add("food");
  }
  if (tour.interest === "Nightlife" || /night|jazz|club|bar crawl/.test(text)) {
    out.add("nightlife");
  }
  if (/park|garden|desert|hike|nature|botanical|canyon|trail/.test(text)) {
    out.add("nature");
  }
  if (
    /history|historic|heritage|freedom trail|ellis|statue of liberty|independence/.test(
      text,
    )
  ) {
    out.add("history");
  }
  if (/family|kids|disney|universal|zoo/.test(text)) {
    out.add("family");
  }
  if (
    tour.interest === "Airport / hotel transfer" ||
    /transfer|airport|pickup/.test(text)
  ) {
    out.add("transfer");
  }
  if (
    tour.interest === "City highlights" ||
    tour.interest === "Neighborhood walk" ||
    tour.interest === "Private driver" ||
    /skyline|highlights|hop-on|walk of fame/.test(text)
  ) {
    out.add("city");
  }

  if (out.size === 0) out.add("city");
  return Array.from(out);
}

export function listTourStates() {
  const codes = Array.from(
    new Set(catalogTours.map((tour) => tour.stateCode)),
  ).sort();
  return codes.map((code) => ({
    code,
    name: STATE_NAMES[code] || code,
    count: catalogTours.filter((t) => t.stateCode === code).length,
  }));
}

export function citiesInState(stateCode: string) {
  if (stateCode === "all") return tourMetros;
  return tourMetros.filter((m) => m.stateCode === stateCode);
}

export type TourSearchFilters = {
  dateKey: string;
  theme?: TourThemeId;
  stateCode?: string;
  citySlug?: string;
  query?: string;
  extraTours?: CatalogTour[];
};

/** Theme → state → city → keyword discovery (usable from anywhere). */
export function searchToursForTraveller(
  filters: TourSearchFilters,
): TourDeparture[] {
  const theme = filters.theme || "all";
  const stateCode = filters.stateCode || "all";
  const citySlug = filters.citySlug || "all";
  const query = (filters.query || "").trim().toLowerCase();

  let list = getToursForDate(
    filters.dateKey,
    citySlug,
    filters.extraTours || [],
  );

  if (stateCode !== "all") {
    list = list.filter((tour) => tour.stateCode === stateCode);
  }

  if (theme !== "all") {
    list = list.filter((tour) =>
      deriveThemes(tour).includes(theme as TourTheme),
    );
  }

  if (query) {
    list = list.filter((tour) => {
      const hay =
        `${tour.title} ${tour.summary} ${tour.meetup} ${tour.cityName} ${tour.stateCode} ${deriveThemes(tour).join(" ")}`.toLowerCase();
      return query
        .split(/\s+/)
        .filter(Boolean)
        .every((word) => hay.includes(word));
    });
  }

  return list;
}

export function themeColor(id: string) {
  return tourThemeDefs.find((t) => t.id === id)?.color || "#5b9bd5";
}
