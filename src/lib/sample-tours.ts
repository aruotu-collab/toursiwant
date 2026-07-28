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
  time: string;
  timeLabel: string;
  schedule: "fixed" | "flexible" | "rolling";
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
  {
    slug: "met-museum-highlights",
    title: "The Met Museum highlights tour",
    time: "10:00",
    timeLabel: "10:00 a.m.",
    duration: "2.5 hours",
    meetup: "Met Fifth Avenue steps",
    priceFrom: "$55",
    joinable: true,
    interest: "Museums & culture",
    summary: "Guided Met highlights without the overwhelm.",
    schedule: "fixed",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    spacesDefault: 14,
  },
  {
    slug: "soho-nolita-food",
    title: "SoHo & Nolita tasting walk",
    time: "12:00",
    timeLabel: "12:00 p.m.",
    duration: "3 hours",
    meetup: "Spring Street subway",
    priceFrom: "$79",
    joinable: true,
    interest: "Food & markets",
    summary: "Boutique bites and street food across SoHo and Nolita.",
    schedule: "fixed",
    weekdays: [3, 4, 5, 6],
    spacesDefault: 8,
  },
  {
    slug: "broadway-night-lights",
    title: "Broadway lights & Times Square evening",
    time: "18:30",
    timeLabel: "6:30 p.m.",
    duration: "2.5 hours",
    meetup: "TKTS Times Square",
    priceFrom: "$49",
    joinable: true,
    interest: "Nightlife",
    summary: "Evening walk through Theatre District and Times Square.",
    schedule: "fixed",
    weekdays: [1, 2, 3, 4, 5, 6],
    spacesDefault: 16,
  },
  {
    slug: "chinatown-little-italy",
    title: "Chinatown & Little Italy evening food",
    time: "17:00",
    timeLabel: "5:00 p.m.",
    duration: "3 hours",
    meetup: "Canal Street",
    priceFrom: "$72",
    joinable: true,
    interest: "Food & markets",
    summary: "Dumplings, espresso, and street markets after dark.",
    schedule: "fixed",
    weekdays: [4, 5, 6],
    spacesDefault: 10,
  },
  {
    slug: "williamsburg-street-art",
    title: "Williamsburg street art & coffee",
    time: "11:00",
    timeLabel: "11:00 a.m.",
    duration: "3 hours",
    meetup: "Bedford L train",
    priceFrom: "$58",
    joinable: true,
    interest: "Neighborhood walk",
    summary: "Murals, indie coffee, and East River views.",
    schedule: "fixed",
    weekdays: [0, 5, 6],
    spacesDefault: 9,
  },
  {
    slug: "nyc-night-photography",
    title: "NYC night photography walk",
    time: "19:30",
    timeLabel: "7:30 p.m.",
    duration: "3 hours",
    meetup: "Brooklyn Bridge walkway",
    priceFrom: "$85",
    joinable: true,
    interest: "Nightlife",
    summary: "Skyline shots with a photographer-guide after sunset.",
    schedule: "fixed",
    weekdays: [5, 6],
    spacesDefault: 7,
  },
  {
    slug: "cruise-shore-lower-manhattan",
    title: "Cruise shore: Lower Manhattan express",
    time: "09:30",
    timeLabel: "9:30 a.m.",
    duration: "4 hours",
    meetup: "Manhattan cruise terminals",
    priceFrom: "$110",
    joinable: true,
    interest: "Cruise shore excursion",
    summary:
      "Shore-safe highlights with guaranteed return buffer before all-aboard.",
    schedule: "fixed",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    spacesDefault: 12,
  },
  {
    slug: "lga-manhattan-transfer",
    title: "LaGuardia → Manhattan shared transfer",
    time: "",
    timeLabel: "Rolling",
    duration: "~55 min",
    meetup: "LGA arrivals",
    priceFrom: "$40",
    joinable: true,
    interest: "Airport / hotel transfer",
    summary: "Shared transfer from LaGuardia into Manhattan hotels.",
    schedule: "rolling",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    spacesDefault: 6,
  },
  {
    slug: "ewr-manhattan-transfer",
    title: "Newark → Manhattan shared transfer",
    time: "",
    timeLabel: "Rolling",
    duration: "~70 min",
    meetup: "EWR arrivals",
    priceFrom: "$48",
    joinable: true,
    interest: "Airport / hotel transfer",
    summary: "Shared transfer from Newark into Manhattan.",
    schedule: "rolling",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    spacesDefault: 6,
  },
  {
    slug: "private-brooklyn-day",
    title: "Private Brooklyn day with driver",
    time: "",
    timeLabel: "Flexible",
    duration: "4–8 hours",
    meetup: "Your hotel",
    priceFrom: "$220",
    joinable: false,
    interest: "Private driver",
    summary: "Custom Brooklyn route with private vehicle and local driver.",
    schedule: "flexible",
    weekdays: [],
    spacesDefault: 4,
  },
  {
    slug: "high-line-chelsea",
    title: "High Line & Chelsea galleries",
    time: "14:00",
    timeLabel: "2:00 p.m.",
    duration: "2.5 hours",
    meetup: "Gansevoort Street",
    priceFrom: "$52",
    joinable: true,
    interest: "Museums & culture",
    summary: "Elevated park walk plus Chelsea gallery hopping.",
    schedule: "fixed",
    weekdays: [1, 2, 3, 4, 5, 6],
    spacesDefault: 11,
  },
  {
    slug: "queens-night-market",
    title: "Queens Night Market tasting",
    time: "18:00",
    timeLabel: "6:00 p.m.",
    duration: "3 hours",
    meetup: "Flushing Meadows Corona Park",
    priceFrom: "$45",
    joinable: true,
    interest: "Food & markets",
    summary: "Seasonal night market food crawl in Queens.",
    schedule: "fixed",
    weekdays: [6],
    spacesDefault: 15,
  },
  {
    slug: "yacht-sunset-harbor",
    title: "Sunset harbor yacht cruise",
    time: "17:45",
    timeLabel: "5:45 p.m.",
    duration: "2 hours",
    meetup: "Pier 15 / South Street Seaport",
    priceFrom: "$99",
    joinable: true,
    interest: "City highlights",
    summary: "Skyline sunset cruise around lower New York Harbor.",
    schedule: "fixed",
    weekdays: [4, 5, 6],
    spacesDefault: 20,
  },
  {
    slug: "custom-nyc-request",
    title: "Build-your-own NYC day",
    time: "",
    timeLabel: "On request",
    duration: "Custom",
    meetup: "Your pickup point",
    priceFrom: "Quote",
    joinable: true,
    interest: "Something custom",
    summary:
      "Describe the day you want — operators send personalised quotes.",
    schedule: "flexible",
    weekdays: [],
    spacesDefault: 8,
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

export const BROWSE_MONTHS_AHEAD = 6;
