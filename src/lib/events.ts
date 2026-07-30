export type NycEvent = {
  slug: string;
  name: string;
  venue: string;
  neighbourhood: string;
  category: "concert" | "sports" | "theatre" | "festival" | "nightlife";
  startsAt: string;
  endsAt: string;
  image: string;
  imageAlt: string;
  summary: string;
  pickupHint: string;
};

function isoDaysFromNow(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Rolling “this week” sample events for NYC launch. */
export const nycEventsThisWeek: NycEvent[] = [
  {
    slug: "msg-summer-night",
    name: "Summer Night at Madison Square Garden",
    venue: "Madison Square Garden",
    neighbourhood: "Midtown",
    category: "concert",
    startsAt: isoDaysFromNow(1, 20, 0),
    endsAt: isoDaysFromNow(1, 23, 0),
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Concert crowd under stage lights",
    summary:
      "Arena show ending late — door-to-door pickup and return so you skip Midtown traffic and subway chaos.",
    pickupHint: "Hotel or apartment anywhere in Manhattan / Brooklyn",
  },
  {
    slug: "yankees-home-stand",
    name: "Yankees home stand",
    venue: "Yankee Stadium",
    neighbourhood: "The Bronx",
    category: "sports",
    startsAt: isoDaysFromNow(2, 19, 5),
    endsAt: isoDaysFromNow(2, 22, 30),
    image:
      "https://images.unsplash.com/photo-1566577739112-5180d4bf6360?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Baseball stadium at dusk",
    summary:
      "Game-day transport from your stay to the Bronx and back after the last out — no scramble for rides.",
    pickupHint: "Hotel lobby or cruise terminal",
  },
  {
    slug: "broadway-evening",
    name: "Broadway evening — Theatre District",
    venue: "Theatre District",
    neighbourhood: "Midtown West",
    category: "theatre",
    startsAt: isoDaysFromNow(3, 19, 0),
    endsAt: isoDaysFromNow(3, 22, 0),
    image:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Broadway theatre marquee at night",
    summary:
      "Curtain call return included. Operators quote fixed pickup windows so you’re seated before lights down.",
    pickupHint: "Hotel in Midtown, Upper West, or Downtown",
  },
  {
    slug: "brooklyn-waterfront-fest",
    name: "Brooklyn waterfront festival",
    venue: "Brooklyn Bridge Park",
    neighbourhood: "Dumbo / Brooklyn Heights",
    category: "festival",
    startsAt: isoDaysFromNow(4, 14, 0),
    endsAt: isoDaysFromNow(4, 21, 0),
    image:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Brooklyn Bridge and waterfront",
    summary:
      "Afternoon into evening festival — shared vans and private cars with flexible return times.",
    pickupHint: "Manhattan hotels or Brooklyn stay",
  },
  {
    slug: "jazz-village-set",
    name: "Late jazz set — Village",
    venue: "West Village clubs",
    neighbourhood: "Greenwich Village",
    category: "nightlife",
    startsAt: isoDaysFromNow(5, 21, 0),
    endsAt: isoDaysFromNow(6, 0, 30),
    image:
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35beb4?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Jazz club saxophone performance",
    summary:
      "Late-night return after the last set. Ideal when you don’t want to hunt for a cab at 12:30am.",
    pickupHint: "Hotel or apartment — Manhattan preferred",
  },
  {
    slug: "barclays-arena-night",
    name: "Barclays Center arena night",
    venue: "Barclays Center",
    neighbourhood: "Downtown Brooklyn",
    category: "concert",
    startsAt: isoDaysFromNow(6, 19, 30),
    endsAt: isoDaysFromNow(6, 22, 45),
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Arena concert lights",
    summary:
      "Brooklyn arena in and out — pickup before doors, return after encore, shore-safe if you’re on a ship day.",
    pickupHint: "Cruise terminal, hotel, or JFK / LGA meet",
  },
];

export function getEvent(slug: string) {
  return nycEventsThisWeek.find((event) => event.slug === slug);
}

export function formatEventWhen(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
