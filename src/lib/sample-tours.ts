import {
  catalogTours,
  getCatalogTour,
  getToursByCity,
  listTourMetros,
  type CatalogTour,
} from "@/lib/us-tour-catalog";

/** @deprecated use CatalogTour — kept as alias for existing imports */
export type SampleTour = CatalogTour;

export type TourDeparture = CatalogTour & {
  date: string;
  spaces: number;
  departsLabel: string;
};

/** Starter catalog only — merge operator listings via getToursForDate extras. */
export const sampleTours: CatalogTour[] = catalogTours;

export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function isSameDay(a: Date, b: Date) {
  return toDateKey(a) === toDateKey(b);
}

function spacesFor(tour: CatalogTour, dateKey: string) {
  const seed = [...dateKey, ...tour.slug].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  const taken = seed % Math.max(tour.spacesDefault - 1, 1);
  return Math.max(tour.spacesDefault - taken, 1);
}

function poolForCity(citySlug: string, extra: CatalogTour[] = []) {
  const base = getToursByCity(citySlug);
  const extras =
    citySlug === "all"
      ? extra
      : extra.filter((tour) => tour.citySlug === citySlug);
  const seen = new Set(base.map((tour) => tour.slug));
  return [...base, ...extras.filter((tour) => !seen.has(tour.slug))];
}

export function getToursForDate(
  dateKey: string,
  citySlug: string = "all",
  extraTours: CatalogTour[] = [],
): TourDeparture[] {
  const date = parseDateKey(dateKey);
  const weekday = date.getDay();
  const todayKey = toDateKey(new Date());
  const isToday = dateKey === todayKey;
  const pool = poolForCity(citySlug, extraTours);

  return pool
    .filter((tour) => {
      if (tour.schedule === "flexible") return true;
      if (tour.schedule === "rolling") return true;
      return tour.weekdays.includes(weekday);
    })
    .map((tour) => {
      const spaces = spacesFor(tour, dateKey);
      const when =
        tour.schedule === "flexible"
          ? isToday
            ? "Flexible today"
            : `Available on ${formatDisplayDate(dateKey)}`
          : tour.schedule === "rolling"
            ? isToday
              ? "Today · rolling"
              : `${formatDisplayDate(dateKey)} · rolling`
            : `${isToday ? "Today" : formatDisplayDate(dateKey)} · ${tour.timeLabel}`;

      return {
        ...tour,
        date: dateKey,
        spaces,
        departsLabel: when,
      };
    });
}

export function getSampleTour(slug: string) {
  return getCatalogTour(slug);
}

export function getTourDeparture(
  slug: string,
  dateKey: string,
  citySlug: string = "all",
  extraTours: CatalogTour[] = [],
) {
  return getToursForDate(dateKey, citySlug, extraTours).find(
    (tour) => tour.slug === slug,
  );
}

export { listTourMetros, catalogTours, getToursByCity };

export const BROWSE_MONTHS_AHEAD = 6;
