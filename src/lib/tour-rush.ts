export type TourRushLot = {
  id: string;
  tourSlug: string;
  title: string;
  image: string;
  imageAlt: string;
  meetup: string;
  priceFrom: number;
  currency: string;
  spacesTotal: number;
  spacesLeft: number;
  interested: number;
  watching: number;
  /** Minutes from now until departure / interest closes — used for live countdown. */
  endsInMinutes: number;
  urgency: "ending_soon" | "filling_fast" | "hot" | "open";
  badge?: string;
};

export const tourRushLots: TourRushLot[] = [
  {
    id: "rush-met",
    tourSlug: "statue-ellis-half-day",
    title: "Statue of Liberty & Ellis Island half-day",
    image:
      "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Statue of Liberty",
    meetup: "Battery Park ferry",
    priceFrom: 120,
    currency: "USD",
    spacesTotal: 12,
    spacesLeft: 3,
    interested: 9,
    watching: 27,
    endsInMinutes: 95,
    urgency: "ending_soon",
    badge: "Ending soon",
  },
  {
    id: "rush-brooklyn",
    tourSlug: "brooklyn-food-crawl",
    title: "Brooklyn food crawl",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Food spread on a table",
    meetup: "DUMBO waterfront",
    priceFrom: 89,
    currency: "USD",
    spacesTotal: 6,
    spacesLeft: 2,
    interested: 7,
    watching: 41,
    endsInMinutes: 180,
    urgency: "filling_fast",
    badge: "2 seats left",
  },
  {
    id: "rush-manhattan",
    tourSlug: "lower-manhattan-highlights",
    title: "Lower Manhattan highlights",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Lower Manhattan skyline",
    meetup: "Battery Park",
    priceFrom: 65,
    currency: "USD",
    spacesTotal: 8,
    spacesLeft: 4,
    interested: 5,
    watching: 19,
    endsInMinutes: 240,
    urgency: "hot",
    badge: "High interest",
  },
  {
    id: "rush-harlem",
    tourSlug: "harlem-gospel-afternoon",
    title: "Harlem gospel & soul food afternoon",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Live music atmosphere",
    meetup: "125th Street",
    priceFrom: 95,
    currency: "USD",
    spacesTotal: 10,
    spacesLeft: 5,
    interested: 4,
    watching: 22,
    endsInMinutes: 320,
    urgency: "open",
  },
  {
    id: "rush-park",
    tourSlug: "midtown-central-park-driver",
    title: "Private Midtown & Central Park driver",
    image:
      "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Central Park path",
    meetup: "Your hotel",
    priceFrom: 180,
    currency: "USD",
    spacesTotal: 4,
    spacesLeft: 1,
    interested: 6,
    watching: 33,
    endsInMinutes: 70,
    urgency: "ending_soon",
    badge: "Last seat",
  },
  {
    id: "rush-jfk",
    tourSlug: "jfk-manhattan-transfer",
    title: "JFK → Manhattan shared transfer",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Airplane wing above clouds",
    meetup: "JFK arrivals",
    priceFrom: 45,
    currency: "USD",
    spacesTotal: 6,
    spacesLeft: 3,
    interested: 8,
    watching: 15,
    endsInMinutes: 55,
    urgency: "filling_fast",
    badge: "Boarding window",
  },
];

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCountdown(totalSeconds: number) {
  if (totalSeconds <= 0) return "00:00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}
