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
  endsInMinutes: number;
  urgency: "ending_soon" | "filling_fast" | "hot" | "open";
  badge?: string;
};

export const tourRushLots: TourRushLot[] = [
  {
    id: "rush-liberty",
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
  {
    id: "rush-met",
    tourSlug: "met-museum-highlights",
    title: "The Met Museum highlights tour",
    image:
      "https://images.unsplash.com/photo-1572966357789-85d3b5fad62e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Museum gallery interior",
    meetup: "Met Fifth Avenue steps",
    priceFrom: 55,
    currency: "USD",
    spacesTotal: 14,
    spacesLeft: 4,
    interested: 11,
    watching: 38,
    endsInMinutes: 130,
    urgency: "hot",
    badge: "25 planning this week",
  },
  {
    id: "rush-soho",
    tourSlug: "soho-nolita-food",
    title: "SoHo & Nolita tasting walk",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Restaurant table with food",
    meetup: "Spring Street subway",
    priceFrom: 79,
    currency: "USD",
    spacesTotal: 8,
    spacesLeft: 3,
    interested: 6,
    watching: 24,
    endsInMinutes: 210,
    urgency: "filling_fast",
    badge: "Filling fast",
  },
  {
    id: "rush-broadway",
    tourSlug: "broadway-night-lights",
    title: "Broadway lights & Times Square evening",
    image:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Times Square at night",
    meetup: "TKTS Times Square",
    priceFrom: 49,
    currency: "USD",
    spacesTotal: 16,
    spacesLeft: 7,
    interested: 10,
    watching: 45,
    endsInMinutes: 400,
    urgency: "hot",
    badge: "Popular tonight",
  },
  {
    id: "rush-chinatown",
    tourSlug: "chinatown-little-italy",
    title: "Chinatown & Little Italy evening food",
    image:
      "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Asian street food",
    meetup: "Canal Street",
    priceFrom: 72,
    currency: "USD",
    spacesTotal: 10,
    spacesLeft: 2,
    interested: 8,
    watching: 29,
    endsInMinutes: 160,
    urgency: "ending_soon",
    badge: "2 seats left",
  },
  {
    id: "rush-williamsburg",
    tourSlug: "williamsburg-street-art",
    title: "Williamsburg street art & coffee",
    image:
      "https://images.unsplash.com/photo-1499781350541-7783f73ce6a5?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Colorful street mural",
    meetup: "Bedford L train",
    priceFrom: 58,
    currency: "USD",
    spacesTotal: 9,
    spacesLeft: 5,
    interested: 3,
    watching: 18,
    endsInMinutes: 280,
    urgency: "open",
  },
  {
    id: "rush-photo",
    tourSlug: "nyc-night-photography",
    title: "NYC night photography walk",
    image:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "City lights at night",
    meetup: "Brooklyn Bridge walkway",
    priceFrom: 85,
    currency: "USD",
    spacesTotal: 7,
    spacesLeft: 2,
    interested: 5,
    watching: 31,
    endsInMinutes: 450,
    urgency: "filling_fast",
    badge: "Almost full",
  },
  {
    id: "rush-cruise",
    tourSlug: "cruise-shore-lower-manhattan",
    title: "Cruise shore: Lower Manhattan express",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Cruise ship at port",
    meetup: "Manhattan cruise terminals",
    priceFrom: 110,
    currency: "USD",
    spacesTotal: 12,
    spacesLeft: 4,
    interested: 7,
    watching: 26,
    endsInMinutes: 110,
    urgency: "hot",
    badge: "Shore-safe return",
  },
  {
    id: "rush-highline",
    tourSlug: "high-line-chelsea",
    title: "High Line & Chelsea galleries",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Elevated urban park path",
    meetup: "Gansevoort Street",
    priceFrom: 52,
    currency: "USD",
    spacesTotal: 11,
    spacesLeft: 6,
    interested: 4,
    watching: 16,
    endsInMinutes: 300,
    urgency: "open",
  },
  {
    id: "rush-yacht",
    tourSlug: "yacht-sunset-harbor",
    title: "Sunset harbor yacht cruise",
    image:
      "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Yacht on the water at sunset",
    meetup: "Pier 15 / South Street Seaport",
    priceFrom: 99,
    currency: "USD",
    spacesTotal: 20,
    spacesLeft: 8,
    interested: 12,
    watching: 52,
    endsInMinutes: 360,
    urgency: "hot",
    badge: "Sunset rush",
  },
  {
    id: "rush-lga",
    tourSlug: "lga-manhattan-transfer",
    title: "LaGuardia → Manhattan shared transfer",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Airport transfer",
    meetup: "LGA arrivals",
    priceFrom: 40,
    currency: "USD",
    spacesTotal: 6,
    spacesLeft: 2,
    interested: 5,
    watching: 12,
    endsInMinutes: 40,
    urgency: "ending_soon",
    badge: "Boarding soon",
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
