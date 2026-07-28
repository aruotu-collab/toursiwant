import type { TourInterest } from "@/lib/tour-types";

/** A bookable tour product operators publish for New York. */
export type SampleTour = {
  slug: string;
  title: string;
  duration: string;
  meetup: string;
  priceFrom: string;
  joinable: boolean;
  interest: TourInterest;
  summary: string;
  /** Local departure time, e.g. "10:30" — empty for flexible / rolling. */
  time: string;
  timeLabel: string;
  /**
   * fixed = runs on listed weekdays
   * flexible = available most days on request (private driver, etc.)
   * rolling = same-day style inventory (transfers)
   */
  schedule: "fixed" | "flexible" | "rolling";
  /** 0 = Sunday … 6 = Saturday. Empty means any day when schedule allows. */
  weekdays: number[];
  spacesDefault: number;
};

export type TourDeparture = SampleTour & {
  date: string;
  spaces: number;
  departsLabel: string;
};

export const sampleTours: SampleTour[] = [
  {
    slug: "lower-manhattan-highlights",
    title: "Lower Manhattan highlights",
    time: "10:30",
    timeLabel: "10:30 a.m.",
    duration: "3.5 hours",
    meetup: "Battery Park",
    priceFrom: "$65",
    joinable: true,
    interest: "City highlights",
    summary:
      "Shared walking tour of Lower Manhattan landmarks. Meet at Battery Park.",
    schedule: "fixed",
    weekdays: [1, 2, 3, 4, 5, 6],
    spacesDefault: 8,
  },
  {
    slug: "brooklyn-food-crawl",
    title: "Brooklyn food crawl",
    time: "13:00",
    timeLabel: "1:00 p.m.",
    duration: "4 hours",
    meetup: "DUMBO waterfront",
    priceFrom: "$89",
    joinable: true,
    interest: "Food & markets",
    summary:
      "Shared food crawl through Brooklyn. Meet at the DUMBO waterfront.",
    schedule: "fixed",
    weekdays: [2, 4, 6],
    spacesDefault: 6,
  },
  {
    slug: "midtown-central-park-driver",
    title: "Private Midtown & Central Park driver",
    time: "",
    timeLabel: "Flexible",
    duration: "2–6 hours",
    meetup: "Your hotel",
    priceFrom: "$180",
    joinable: false,
    interest: "Private driver",
    summary:
      "Private driver for Midtown and Central Park. Pickup at your hotel.",
    schedule: "flexible",
    weekdays: [],
    spacesDefault: 4,
  },
  {
    slug: "jfk-manhattan-transfer",
    title: "JFK → Manhattan shared transfer",
    time: "",
    timeLabel: "Rolling",
    duration: "~75 min",
    meetup: "JFK arrivals",
    priceFrom: "$45",
    joinable: true,
    interest: "Airport / hotel transfer",
    summary: "Shared transfer from JFK arrivals into Manhattan.",
    schedule: "rolling",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    spacesDefault: 6,
  },
  {
    slug: "harlem-gospel-afternoon",
    title: "Harlem gospel & soul food afternoon",
    time: "11:00",
    timeLabel: "11:00 a.m.",
    duration: "4 hours",
    meetup: "125th Street",
    priceFrom: "$95",
    joinable: true,
    interest: "Neighborhood walk",
    summary: "Harlem cultural afternoon with gospel and soul food stops.",
    schedule: "fixed",
    weekdays: [0, 6],
    spacesDefault: 10,
  },
  {
    slug: "statue-ellis-half-day",
    title: "Statue of Liberty & Ellis Island half-day",
    time: "09:00",
    timeLabel: "9:00 a.m.",
    duration: "5 hours",
    meetup: "Battery Park ferry",
    priceFrom: "$120",
    joinable: true,
    interest: "City highlights",
    summary: "Ferry tickets and guided half-day to Liberty and Ellis Island.",
    schedule: "fixed",
    weekdays: [1, 3, 5, 6],
    spacesDefault: 12,
  },
];

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
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

function spacesFor(tour: SampleTour, dateKey: string) {
  // Deterministic sample inventory so future dates feel real.
  const seed = [...dateKey, ...tour.slug].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  const taken = seed % Math.max(tour.spacesDefault - 1, 1);
  return Math.max(tour.spacesDefault - taken, 1);
}

export function getToursForDate(dateKey: string): TourDeparture[] {
  const date = parseDateKey(dateKey);
  const weekday = date.getDay();
  const todayKey = toDateKey(new Date());
  const isToday = dateKey === todayKey;

  return sampleTours
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
  return sampleTours.find((tour) => tour.slug === slug);
}

export function getTourDeparture(slug: string, dateKey: string) {
  return getToursForDate(dateKey).find((tour) => tour.slug === slug);
}

/** How far ahead travellers can browse scheduled inventory. */
export const BROWSE_MONTHS_AHEAD = 6;
