export type CapturedRequestType =
  | "tour_interest"
  | "custom_request"
  | "operator_interest"
  | "event_ride"
  | "accommodation_request";

export type CapturedRequest = {
  id: string;
  type: CapturedRequestType;
  createdAt: string;
  citySlug: string;
  name: string;
  email: string;
  phone?: string;
  travelDate?: string;
  tourSlug?: string;
  tourTitle?: string;
  groupSize?: number;
  pickup?: string;
  details?: string;
  joinGroup?: boolean;
  businessName?: string;
  source: "mock" | "live";
  userId?: string;
  needAccommodation?: boolean;
  accommodationNotes?: string;
  eventSlug?: string;
  eventName?: string;
  returnAddress?: string;
  eventStart?: string;
  eventEnd?: string;
};

/** Seeded “already happening” demand so the board feels full from day one. */
export const seedCapturedRequests: CapturedRequest[] = [
  {
    id: "seed-001",
    type: "tour_interest",
    createdAt: minutesAgoIso(4),
    citySlug: "new-york",
    name: "Amelia R.",
    email: "amelia@example.com",
    travelDate: "2026-07-28",
    tourSlug: "met-museum-highlights",
    tourTitle: "The Met Museum highlights tour",
    groupSize: 3,
    pickup: "Upper East Side hotel",
    joinGroup: true,
    details: "First time at the Met — prefer morning pace.",
    source: "mock",
  },
  {
    id: "seed-002",
    type: "tour_interest",
    createdAt: minutesAgoIso(9),
    citySlug: "new-york",
    name: "James K.",
    email: "james@example.com",
    travelDate: "2026-07-28",
    tourSlug: "brooklyn-food-crawl",
    tourTitle: "Brooklyn food crawl",
    groupSize: 2,
    pickup: "DUMBO Airbnb",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-003",
    type: "custom_request",
    createdAt: minutesAgoIso(15),
    citySlug: "new-york",
    name: "Priya S.",
    email: "priya@example.com",
    travelDate: "2026-08-12",
    groupSize: 4,
    pickup: "Hudson Yards",
    details: "Private food + street art day in Brooklyn, stroller friendly.",
    joinGroup: false,
    source: "mock",
  },
  {
    id: "seed-004",
    type: "tour_interest",
    createdAt: minutesAgoIso(22),
    citySlug: "new-york",
    name: "Marco L.",
    email: "marco@example.com",
    travelDate: "2026-07-29",
    tourSlug: "statue-ellis-half-day",
    tourTitle: "Statue of Liberty & Ellis Island half-day",
    groupSize: 5,
    pickup: "Cruise terminal",
    joinGroup: true,
    details: "Must be back by 3:00 p.m. all-aboard.",
    source: "mock",
  },
  {
    id: "seed-005",
    type: "tour_interest",
    createdAt: minutesAgoIso(28),
    citySlug: "new-york",
    name: "Nina W.",
    email: "nina@example.com",
    travelDate: "2026-07-28",
    tourSlug: "jfk-manhattan-transfer",
    tourTitle: "JFK → Manhattan shared transfer",
    groupSize: 2,
    pickup: "JFK Terminal 4",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-006",
    type: "custom_request",
    createdAt: minutesAgoIso(35),
    citySlug: "new-york",
    name: "Omar H.",
    email: "omar@example.com",
    travelDate: "2026-09-03",
    groupSize: 6,
    pickup: "Midtown hotel",
    details: "Proposal photography walk + dinner recommendations.",
    joinGroup: false,
    source: "mock",
  },
  {
    id: "seed-007",
    type: "tour_interest",
    createdAt: minutesAgoIso(41),
    citySlug: "new-york",
    name: "Chloe T.",
    email: "chloe@example.com",
    travelDate: "2026-07-30",
    tourSlug: "harlem-gospel-afternoon",
    tourTitle: "Harlem gospel & soul food afternoon",
    groupSize: 2,
    pickup: "Columbia University area",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-008",
    type: "tour_interest",
    createdAt: minutesAgoIso(47),
    citySlug: "new-york",
    name: "Ben A.",
    email: "ben@example.com",
    travelDate: "2026-07-28",
    tourSlug: "broadway-night-lights",
    tourTitle: "Broadway lights & Times Square evening",
    groupSize: 4,
    pickup: "Hotel near Bryant Park",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-009",
    type: "operator_interest",
    createdAt: minutesAgoIso(55),
    citySlug: "new-york",
    name: "Diana F.",
    email: "ops@harborguides.example",
    phone: "+1 212 555 0144",
    businessName: "Harbor Guides NYC",
    details: "Shore excursions + private drivers for cruise days.",
    source: "mock",
  },
  {
    id: "seed-010",
    type: "tour_interest",
    createdAt: minutesAgoIso(62),
    citySlug: "new-york",
    name: "Sofia M.",
    email: "sofia@example.com",
    travelDate: "2026-08-01",
    tourSlug: "yacht-sunset-harbor",
    tourTitle: "Sunset harbor yacht cruise",
    groupSize: 2,
    pickup: "Financial District",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-011",
    type: "custom_request",
    createdAt: minutesAgoIso(70),
    citySlug: "new-york",
    name: "Ethan P.",
    email: "ethan@example.com",
    travelDate: "2026-10-18",
    groupSize: 8,
    pickup: "JFK",
    details: "Corporate team day: museums morning, dinner downtown.",
    joinGroup: false,
    source: "mock",
  },
  {
    id: "seed-012",
    type: "tour_interest",
    createdAt: minutesAgoIso(78),
    citySlug: "new-york",
    name: "Hannah G.",
    email: "hannah@example.com",
    travelDate: "2026-07-31",
    tourSlug: "soho-nolita-food",
    tourTitle: "SoHo & Nolita tasting walk",
    groupSize: 1,
    pickup: "SoHo loft",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-013",
    type: "tour_interest",
    createdAt: minutesAgoIso(86),
    citySlug: "new-york",
    name: "Luis C.",
    email: "luis@example.com",
    travelDate: "2026-07-28",
    tourSlug: "cruise-shore-lower-manhattan",
    tourTitle: "Cruise shore: Lower Manhattan express",
    groupSize: 3,
    pickup: "Manhattan cruise terminal",
    joinGroup: true,
    details: "Return buffer needed before 4 p.m.",
    source: "mock",
  },
  {
    id: "seed-014",
    type: "tour_interest",
    createdAt: minutesAgoIso(95),
    citySlug: "new-york",
    name: "Grace N.",
    email: "grace@example.com",
    travelDate: "2026-08-08",
    tourSlug: "high-line-chelsea",
    tourTitle: "High Line & Chelsea galleries",
    groupSize: 2,
    pickup: "Chelsea hotel",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-015",
    type: "custom_request",
    createdAt: minutesAgoIso(110),
    citySlug: "new-york",
    name: "Tom B.",
    email: "tom@example.com",
    travelDate: "2026-11-22",
    groupSize: 2,
    pickup: "Upper West Side",
    details: "Thanksgiving weekend: quiet museums + early dinner.",
    joinGroup: false,
    source: "mock",
  },
  {
    id: "seed-016",
    type: "tour_interest",
    createdAt: minutesAgoIso(125),
    citySlug: "new-york",
    name: "Ava D.",
    email: "ava@example.com",
    travelDate: "2026-07-29",
    tourSlug: "williamsburg-street-art",
    tourTitle: "Williamsburg street art & coffee",
    groupSize: 3,
    pickup: "Williamsburg",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-017",
    type: "operator_interest",
    createdAt: minutesAgoIso(140),
    citySlug: "new-york",
    name: "Kenji O.",
    email: "bookings@fiveborough.example",
    businessName: "Five Borough Tours",
    details: "Daily Manhattan walks + weekend food crawls.",
    source: "mock",
  },
  {
    id: "seed-018",
    type: "tour_interest",
    createdAt: minutesAgoIso(155),
    citySlug: "new-york",
    name: "Maya I.",
    email: "maya@example.com",
    travelDate: "2026-08-15",
    tourSlug: "nyc-night-photography",
    tourTitle: "NYC night photography walk",
    groupSize: 1,
    pickup: "Brooklyn Bridge area",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-019",
    type: "tour_interest",
    createdAt: minutesAgoIso(170),
    citySlug: "new-york",
    name: "Ryan S.",
    email: "ryan@example.com",
    travelDate: "2026-07-28",
    tourSlug: "lga-manhattan-transfer",
    tourTitle: "LaGuardia → Manhattan shared transfer",
    groupSize: 1,
    pickup: "LGA Terminal B",
    joinGroup: true,
    source: "mock",
  },
  {
    id: "seed-020",
    type: "custom_request",
    createdAt: minutesAgoIso(190),
    citySlug: "new-york",
    name: "Elena V.",
    email: "elena@example.com",
    travelDate: "2026-09-20",
    groupSize: 5,
    pickup: "Hotel near Central Park",
    details: "Accessible vehicle needed · Met + Central Park half day.",
    joinGroup: false,
    source: "mock",
  },
];

function minutesAgoIso(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function requestToActivity(request: CapturedRequest) {
  const created = new Date(request.createdAt).getTime();
  const minutesAgo = Math.max(
    0,
    Math.round((Date.now() - created) / 60_000),
  );

  if (request.type === "operator_interest") {
    return {
      id: request.id,
      kind: "quote" as const,
      destination: request.businessName || "New operator",
      detail: `${request.name} applied to list New York tours`,
      minutesAgo,
      source: request.source,
    };
  }

  if (request.type === "event_ride") {
    return {
      id: request.id,
      kind: "planned" as const,
      destination: request.eventName || "Event pickup & return",
      detail: `${request.groupSize || 1} traveller${(request.groupSize || 1) > 1 ? "s" : ""} booked event transport`,
      minutesAgo,
      source: request.source,
    };
  }

  if (request.type === "accommodation_request" || request.needAccommodation) {
    return {
      id: request.id,
      kind: "enquiry" as const,
      destination: "Stay near your tour",
      detail: request.accommodationNotes?.slice(0, 80) ||
        `${request.name} needs accommodation near a tour`,
      minutesAgo,
      source: request.source,
    };
  }

  if (request.type === "tour_interest") {
    return {
      id: request.id,
      kind: "joining" as const,
      destination: request.tourTitle || "Tour listing",
      detail: `${request.groupSize || 1} traveller${(request.groupSize || 1) > 1 ? "s" : ""} sent interest`,
      minutesAgo,
      source: request.source,
    };
  }

  return {
    id: request.id,
    kind: "enquiry" as const,
    destination: "Custom New York request",
    detail: request.details?.slice(0, 80) || `${request.name} requested a quote`,
    minutesAgo,
    source: request.source,
  };
}
