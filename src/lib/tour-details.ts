import { getListingTourBySlug } from "@/lib/listings-store";
import { getSampleTour, type SampleTour } from "@/lib/sample-tours";
import { tourRushLots } from "@/lib/tour-rush";
import type { CatalogTour } from "@/lib/us-tour-catalog";

export type TourDetails = SampleTour & {
  image: string;
  imageAlt: string;
  longDescription: string;
  highlights: string[];
  includes: string[];
  goodToKnow: string[];
  languages: string[];
  cancellation: string;
};

const detailExtras: Record<
  string,
  Omit<TourDetails, keyof SampleTour | "image" | "imageAlt"> & {
    image?: string;
    imageAlt?: string;
  }
> = {
  "lower-manhattan-highlights": {
    longDescription:
      "Walk the historic core of Lower Manhattan with a local guide. Cover Wall Street, the Charging Bull, Battery Park views of the harbour, and the story of early New York — paced for travellers who want context, not just photo stops.",
    highlights: [
      "Wall Street and the Financial District",
      "Battery Park harbour views",
      "Charging Bull and Bowling Green",
      "Optional 9/11 Memorial plaza stop",
    ],
    includes: [
      "Local walking guide",
      "Shared group departure",
      "Route map and meeting point briefing",
    ],
    goodToKnow: [
      "Mostly flat walking · comfortable shoes recommended",
      "Not wheelchair-accessible on every block",
      "Runs rain or shine unless cancelled for safety",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Lower Manhattan skyline",
  },
  "brooklyn-food-crawl": {
    longDescription:
      "A guided tasting walk through Brooklyn’s DUMBO and nearby streets. Sample several stops — sweet, savoury, and local favourites — while learning the neighbourhood’s waterfront story.",
    highlights: [
      "Multiple included tastings",
      "DUMBO waterfront views",
      "Local bakery and market stops",
      "Shared group friendly for solo travellers",
    ],
    includes: [
      "Guide-led tasting route",
      "Food samples at featured stops",
      "Meeting point orientation",
    ],
    goodToKnow: [
      "Tell us about allergies when you send interest",
      "Not a full meal replacement for very large appetites",
      "Some standing and short walks between stops",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Food tasting spread",
  },
  "midtown-central-park-driver": {
    longDescription:
      "Private driver for Midtown and Central Park on your schedule. Ideal for hotel pickup, photo stops, and flexible timing when you don’t want a fixed group departure.",
    highlights: [
      "Private vehicle for your party",
      "Hotel or address pickup",
      "Custom Midtown + Central Park routing",
      "Flexible duration from 2 to 6 hours",
    ],
    includes: ["Private chauffeur", "Fuel for city routing", "Door-to-door pickup"],
    goodToKnow: [
      "Child seats available on request",
      "Traffic can affect timing in peak hours",
      "Not a hop-on sightseeing bus",
    ],
    languages: ["English", "Spanish on request"],
    cancellation: "Free cancellation up to 12 hours before pickup.",
    image:
      "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Central Park pathway",
  },
  "jfk-manhattan-transfer": {
    longDescription:
      "Shared transfer from JFK arrivals into Manhattan. Meet at the arrivals area, confirm your hotel or drop-off zone, and ride with other travellers heading into the city.",
    highlights: [
      "Rolling departures through the day",
      "Shared pricing vs private car",
      "Luggage-friendly vans",
      "Manhattan hotel drop-offs",
    ],
    includes: ["Shared vehicle", "Driver meet-and-greet guidance", "One suitcase per traveller baseline"],
    goodToKnow: [
      "Flight delays may shift your window — include flight number in notes",
      "Extra oversized luggage may need a private option",
      "Travel time varies with traffic",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 6 hours before pickup window.",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Airplane wing above clouds",
  },
  "harlem-gospel-afternoon": {
    longDescription:
      "An afternoon in Harlem focused on gospel culture, neighbourhood history, and soul food. Designed as a shared group experience with a clear meeting point on 125th Street.",
    highlights: [
      "Gospel service or performance window when scheduled",
      "Harlem neighbourhood orientation",
      "Soul food tasting stop",
      "Weekend-friendly shared group",
    ],
    includes: ["Local guide", "Cultural programme access where listed", "Food stop contribution"],
    goodToKnow: [
      "Dress respectfully for worship venues",
      "Programme details can vary by Sunday",
      "Walking between nearby stops",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Live music atmosphere",
  },
  "statue-ellis-half-day": {
    longDescription:
      "Half-day experience covering the Statue of Liberty and Ellis Island ferry corridor. Meet at Battery Park, board with timed guidance, and see New York Harbour from the water.",
    highlights: [
      "Battery Park ferry meeting point",
      "Statue of Liberty views",
      "Ellis Island immigration museum time",
      "Guided orientation before boarding",
    ],
    includes: [
      "Ferry ticket coordination",
      "Guided briefing",
      "Shared group timing",
    ],
    goodToKnow: [
      "Security screening applies — arrive early",
      "Wear layers for harbour wind",
      "Cruise travellers: confirm your return buffer",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 48 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Statue of Liberty",
  },
  "met-museum-highlights": {
    longDescription:
      "A focused highlights tour of The Met so you see the essentials without getting lost in the galleries. Ideal for first-timers and travellers with limited museum hours.",
    highlights: [
      "Must-see gallery route",
      "Smaller shared group pacing",
      "Context from a museum-focused guide",
      "Meet at the Fifth Avenue steps",
    ],
    includes: ["Guided highlights route", "Skip-the-wander planning", "Entry timing advice"],
    goodToKnow: [
      "Museum admission may be separate depending on operator package",
      "Large bags may need cloakroom",
      "Lots of standing and indoor walking",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1572966357789-85d3b5fad62e?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Museum gallery interior",
  },
  "soho-nolita-food": {
    longDescription:
      "Boutique bites across SoHo and Nolita — coffee, sweets, and savory stops with a guide who knows which counters are worth the line.",
    highlights: [
      "Curated tasting stops",
      "SoHo streets and Nolita corners",
      "Local bakery and café culture",
      "Good for couples and small groups",
    ],
    includes: ["Guide", "Tasting samples", "Neighbourhood tips sheet"],
    goodToKnow: [
      "Share dietary needs in your request",
      "Some stops are standing-room only",
      "Afternoon start avoids the worst lunch rush",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Restaurant table with food",
  },
  "broadway-night-lights": {
    longDescription:
      "An evening walk through the Theatre District and Times Square energy — marquees, side streets, and the neon rush without needing show tickets.",
    highlights: [
      "Times Square at night",
      "Broadway marquee corridor",
      "Photo stops with a guide",
      "Easy after-dinner timing",
    ],
    includes: ["Evening walking guide", "Best photo angle tips", "Meeting near TKTS"],
    goodToKnow: [
      "Crowded pavement — keep valuables close",
      "Not a Broadway show ticket product",
      "Runs most evenings",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 12 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Times Square at night",
  },
  "chinatown-little-italy": {
    longDescription:
      "Evening food walk linking Chinatown and Little Italy — dumplings, espresso culture, and the streets that still feel like old New York.",
    highlights: [
      "Canal Street energy",
      "Dumpling and bakery stops",
      "Little Italy dessert finish",
      "Shared group evening outing",
    ],
    includes: ["Guide", "Selected tastings", "Route with backup indoor stops"],
    goodToKnow: [
      "Spicy options available — tell us your heat level",
      "Some stairs and narrow sidewalks",
      "Great for first-night arrivals",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Asian street food",
  },
  "williamsburg-street-art": {
    longDescription:
      "Murals, indie coffee, and East River glances in Williamsburg. A lighter neighbourhood walk for travellers who want Brooklyn beyond the bridge photo.",
    highlights: [
      "Street art blocks",
      "Specialty coffee stop",
      "Bedford Avenue pulse",
      "East River viewpoint",
    ],
    includes: ["Local guide", "Coffee stop orientation", "Art walk map"],
    goodToKnow: [
      "Coffee purchase usually separate",
      "Murals change — route adapts",
      "Moderate walking",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1499781350541-7783f73ce6a5?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Colorful street mural",
  },
  "nyc-night-photography": {
    longDescription:
      "After-dark photography walk with a photographer-guide. Learn framing and exposure basics while capturing skyline and bridge light.",
    highlights: [
      "Brooklyn Bridge walkway start",
      "Skyline composition coaching",
      "Night exposure tips",
      "Small group size",
    ],
    includes: ["Photographer-guide", "Shot list suggestions", "Editing tip sheet"],
    goodToKnow: [
      "Bring a charged phone or camera",
      "Tripods may be limited on busy paths",
      "Wear warm layers for wind",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "City lights at night",
  },
  "cruise-shore-lower-manhattan": {
    longDescription:
      "Shore excursion built around cruise timing: Lower Manhattan highlights with a return buffer before all-aboard. Independent local operators — not a cruise-line product.",
    highlights: [
      "Pickup near Manhattan cruise terminals",
      "Lower Manhattan express highlights",
      "Return-time safety buffer",
      "Shared group pricing",
    ],
    includes: [
      "Shore-timed itinerary",
      "Guide or driver depending on package",
      "Return-to-terminal planning",
    ],
    goodToKnow: [
      "Enter your ship’s all-aboard time in the request",
      "Not officially affiliated with cruise lines",
      "Weather and traffic can tighten windows",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Cruise ship at port",
  },
  "lga-manhattan-transfer": {
    longDescription:
      "Shared transfer from LaGuardia arrivals into Manhattan hotels. A practical option when you want fixed pricing without booking a private car.",
    highlights: [
      "LGA arrivals meet point",
      "Shared van or shuttle style",
      "Manhattan drop-offs",
      "Rolling windows",
    ],
    includes: ["Shared vehicle", "Driver coordination", "Standard luggage allowance"],
    goodToKnow: [
      "Include flight number and terminal",
      "Peak traffic evenings run longer",
      "Private upgrade available on request",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 6 hours before pickup window.",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Airport transfer",
  },
  "ewr-manhattan-transfer": {
    longDescription:
      "Shared transfer from Newark (EWR) into Manhattan. Built for arrivals who want a clear price and a seat without arranging a private car.",
    highlights: [
      "EWR arrivals meet guidance",
      "Shared pricing",
      "Manhattan hotel drops",
      "Luggage-friendly vehicle",
    ],
    includes: ["Shared vehicle", "Driver meet instructions", "Standard bag allowance"],
    goodToKnow: [
      "Bridge and tunnel traffic varies",
      "Add flight details in your notes",
      "Child seats on request",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 6 hours before pickup window.",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Airport arrival transfer",
  },
  "private-brooklyn-day": {
    longDescription:
      "Private Brooklyn day with your own driver. Build a custom route — DUMBO, Williamsburg, Prospect Park, food stops — on your timeline.",
    highlights: [
      "Fully private vehicle",
      "Custom Brooklyn itinerary",
      "Hotel pickup",
      "4–8 hour flexibility",
    ],
    includes: ["Private driver", "Custom routing", "Wait time between stops"],
    goodToKnow: [
      "Tell us neighbourhoods you care about",
      "Food purchases usually separate",
      "Great for families and small groups",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before pickup.",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Brooklyn and Manhattan views",
  },
  "high-line-chelsea": {
    longDescription:
      "Walk the High Line then dip into Chelsea galleries. A culture-forward afternoon that stays scenic without needing museum-ticket chaos.",
    highlights: [
      "High Line elevated park",
      "Chelsea gallery hopping",
      "Photo-friendly skyline peeks",
      "Moderate walking pace",
    ],
    includes: ["Walking guide", "Gallery orientation", "Route timed for light crowds when possible"],
    goodToKnow: [
      "Some galleries have limited hours",
      "Elevators available at key High Line access points",
      "Wear comfortable shoes",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Elevated urban park path",
  },
  "queens-night-market": {
    longDescription:
      "Seasonal Queens Night Market tasting experience — global stalls, casual bites, and a local guide to help you choose without wasting the evening in lines.",
    highlights: [
      "Night market stall hopping",
      "International street food",
      "Flushing Meadows setting",
      "Shared group energy",
    ],
    includes: ["Guide", "Market orientation", "Suggested stall shortlist"],
    goodToKnow: [
      "Food purchases usually separate from the tour fee",
      "Seasonal schedule — confirm your date",
      "Cash and cards both useful",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 24 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Night market food",
  },
  "yacht-sunset-harbor": {
    longDescription:
      "Sunset harbour cruise from the Seaport area — skyline light, open water, and a social shared departure for travellers who want New York from the water.",
    highlights: [
      "Sunset timing",
      "Lower New York Harbour views",
      "Skyline photo opportunities",
      "Shared yacht / boat departure",
    ],
    includes: ["Boat boarding", "Crew briefing", "Scenic loop orientation"],
    goodToKnow: [
      "Weather can move sailings",
      "Arrive early for check-in",
      "Not a dinner-cruise by default",
    ],
    languages: ["English"],
    cancellation: "Free cancellation up to 48 hours before departure.",
    image:
      "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Yacht on the water at sunset",
  },
  "custom-nyc-request": {
    longDescription:
      "Describe the New York day you actually want — museums, food, drivers, shore timing, or something unusual. Local operators send personalised quotes.",
    highlights: [
      "Fully custom itinerary",
      "Multiple operator quotes",
      "Works for groups and private parties",
      "Advance planning friendly",
    ],
    includes: ["Request matching", "Operator quotes", "Follow-up on logistics"],
    goodToKnow: [
      "The more detail you give, the better the quotes",
      "Pricing varies by date and group size",
      "No obligation until you accept a quote",
    ],
    languages: ["English"],
    cancellation: "No charge to submit a request.",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "New York City skyline",
  },
};

const fallbackImage =
  "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80";

function detailsFromTour(tour: CatalogTour | SampleTour): TourDetails {
  const extras = detailExtras[tour.slug];
  const rush = tourRushLots.find((lot) => lot.tourSlug === tour.slug);

  return {
    ...tour,
    image: extras?.image || rush?.image || fallbackImage,
    imageAlt: extras?.imageAlt || rush?.imageAlt || tour.title,
    longDescription:
      extras?.longDescription ||
      `${tour.summary} Send interest to claim a seat or request a quote from local ${tour.cityName} operators.`,
    highlights: extras?.highlights || [
      tour.meetup,
      `${tour.duration} experience`,
      tour.joinable ? "Shared group available" : "Private experience",
      `From ${tour.priceFrom}`,
      tour.source === "operator" ? "Operator-published listing" : "Starter catalog",
    ],
    includes: extras?.includes || [
      tour.source === "operator" ? "Published by a ToursIWant operator" : "Local operator",
      "Listed departure timing",
      "Meeting point guidance",
    ],
    goodToKnow: extras?.goodToKnow || [
      "Availability changes by date — pick your travel day when you request",
      "Confirm return times for cruise or flight connections",
      "Message the operator with accessibility needs",
    ],
    languages: extras?.languages || ["English"],
    cancellation:
      extras?.cancellation ||
      "Cancellation terms confirmed with the operator when you enquire.",
  };
}

/** Sync lookup for starter catalog only. */
export function getTourDetails(slug: string): TourDetails | undefined {
  const tour = getSampleTour(slug);
  if (!tour) return undefined;
  return detailsFromTour(tour);
}

/** Starter + operator-published listings. */
export async function getTourDetailsAsync(
  slug: string,
): Promise<TourDetails | undefined> {
  const starter = getSampleTour(slug);
  if (starter) return detailsFromTour(starter);
  const operatorTour = await getListingTourBySlug(slug);
  if (!operatorTour) return undefined;
  return detailsFromTour(operatorTour);
}

export function weekdayLabels(weekdays: number[]) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (!weekdays.length) return "Flexible / on request";
  if (weekdays.length === 7) return "Daily";
  return weekdays.map((day) => names[day]).join(", ");
}
