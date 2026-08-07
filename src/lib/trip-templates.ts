/**
 * ToursIWant — proven US trip templates with flexible experience blocks.
 * Structure stays; activities swap. Viator fills paid optional blocks.
 */

export type ExperienceCategory =
  | "RELIGIOUS"
  | "THEME_PARK"
  | "WATER_ACTIVITY"
  | "FOOD"
  | "SHOPPING"
  | "NATURE"
  | "NIGHTLIFE"
  | "LIVE_ENTERTAINMENT"
  | "PRIVATE_GROUP_EVENT"
  | "CULTURE"
  | "FAMILY"
  | "FREE_TIME"
  | "SIGHTS"
  | "RELAX";

export type ComfortLevel = "relaxed" | "balanced" | "active";

/** multi_city = combine several US cities / regions into one spine */
export type TemplateScale =
  | "multi_city"
  | "country"
  | "city"
  | "hotel_area"
  | "here_now";

export type BlockKind = "anchor" | "flexible" | "special";

export type TripBlock = {
  id: string;
  kind: BlockKind;
  dayLabel: string;
  title: string;
  summary: string;
  durationHours?: number;
  walking?: "low" | "moderate" | "high";
  free?: boolean;
  fromHotelMinutes?: number;
  category?: ExperienceCategory;
  alternatives?: ExperienceOption[];
  viatorQuery?: string;
  viatorCitySlug?: string;
  specialProviderRequired?: boolean;
};

export type ExperienceOption = {
  id: string;
  category: ExperienceCategory;
  title: string;
  summary: string;
  replaces?: string;
  tradeOff?: string;
  viatorQuery?: string;
  specialProviderRequired?: boolean;
};

export type TripTemplate = {
  id: string;
  slug: string;
  scale: TemplateScale;
  title: string;
  countries: string[];
  countryCodes: string[];
  /** US city codes for combine (NYC, LA, CHI, …) */
  cityCodes: string[];
  region?: string;
  days: number;
  nightsHint?: string;
  route: string;
  bestFor: string[];
  comfort: ComfortLevel;
  blurb: string;
  savedCount: number;
  groupsUsed: number;
  recommendPercent: number;
  keptOrderPercent: number;
  travelledRating?: number;
  travelledReviews?: number;
  hotelAnchor?: {
    id: string;
    name: string;
    area: string;
    lat: number;
    lng: number;
  };
  timeBuckets?: Array<"2h" | "4h" | "rest_today" | "full_day" | "morning">;
  moods?: string[];
  blocks: TripBlock[];
  addDestinationHints?: Array<{
    label: string;
    code: string;
    recommendedExtraDays: [number, number];
    suggestedRoute: string;
  }>;
};

export const experienceCategoryLabel: Record<ExperienceCategory, string> = {
  RELIGIOUS: "Religious / spiritual",
  THEME_PARK: "Theme park",
  WATER_ACTIVITY: "Waterpark / water",
  FOOD: "Food",
  SHOPPING: "Shopping",
  NATURE: "Nature",
  NIGHTLIFE: "Nightlife",
  LIVE_ENTERTAINMENT: "Live entertainment",
  PRIVATE_GROUP_EVENT: "Private group event",
  CULTURE: "Culture",
  FAMILY: "Family fun",
  FREE_TIME: "Free time",
  SIGHTS: "Famous sights",
  RELAX: "Relax",
};

export const personalizeOptions: Array<{
  id: ExperienceCategory;
  label: string;
}> = [
  { id: "RELIGIOUS", label: "Religious / spiritual sites" },
  { id: "WATER_ACTIVITY", label: "Waterpark / theme park" },
  { id: "LIVE_ENTERTAINMENT", label: "Live entertainment / show" },
  { id: "PRIVATE_GROUP_EVENT", label: "Private group dinner" },
  { id: "NIGHTLIFE", label: "Nightlife" },
  { id: "SHOPPING", label: "Shopping day" },
  { id: "NATURE", label: "Nature / parks day" },
  { id: "FOOD", label: "Food tour" },
  { id: "FAMILY", label: "Children’s activities" },
  { id: "RELAX", label: "Relaxation / spa" },
];

export const usCityOptions = [
  { code: "NYC", label: "New York" },
  { code: "DC", label: "Washington, D.C." },
  { code: "BOS", label: "Boston" },
  { code: "PHL", label: "Philadelphia" },
  { code: "CHI", label: "Chicago" },
  { code: "NOLA", label: "New Orleans" },
  { code: "MIA", label: "Miami" },
  { code: "ORL", label: "Orlando" },
  { code: "LAS", label: "Las Vegas" },
  { code: "LA", label: "Los Angeles" },
  { code: "SF", label: "San Francisco" },
  { code: "SD", label: "San Diego" },
  { code: "NASH", label: "Nashville" },
  { code: "NIA", label: "Niagara Falls" },
] as const;

function flexDay(
  id: string,
  dayLabel: string,
  title: string,
  summary: string,
  alternatives: ExperienceOption[],
  extra?: Partial<TripBlock>,
): TripBlock {
  return {
    id,
    kind: "flexible",
    dayLabel,
    title,
    summary,
    alternatives,
    ...extra,
  };
}

function anchor(
  id: string,
  dayLabel: string,
  title: string,
  summary: string,
  extra?: Partial<TripBlock>,
): TripBlock {
  return { id, kind: "anchor", dayLabel, title, summary, ...extra };
}

export const tripTemplates: TripTemplate[] = [
  // —— USA overview ——
  {
    id: "usa-east-coast-first",
    slug: "usa-east-coast-first-timer",
    scale: "country",
    title: "USA East Coast First Timer",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NYC", "DC", "BOS"],
    region: "Northeast",
    days: 12,
    route: "Boston → New York → Washington, D.C.",
    bestFor: ["First USA trip", "Cities", "History"],
    comfort: "balanced",
    blurb:
      "A proven Northeast spine — history, skyline, and museums without coast-to-coast jet lag.",
    savedCount: 1840,
    groupsUsed: 312,
    recommendPercent: 92,
    keptOrderPercent: 70,
    travelledRating: 4.8,
    travelledReviews: 156,
    addDestinationHints: [
      {
        label: "Philadelphia",
        code: "PHL",
        recommendedExtraDays: [1, 2],
        suggestedRoute: "Boston → New York → Philadelphia → Washington, D.C.",
      },
      {
        label: "Niagara Falls",
        code: "NIA",
        recommendedExtraDays: [1, 2],
        suggestedRoute: "Boston → New York → Niagara Falls → Washington, D.C.",
      },
    ],
    blocks: [
      anchor("ee1", "Days 1–3", "Boston", "Freedom Trail energy and harbour."),
      flexDay(
        "ee2",
        "Day 2",
        "Boston flexible day",
        "History, food, or free time.",
        [
          {
            id: "ee2-culture",
            category: "CULTURE",
            title: "Freedom Trail + museums",
            summary: "Classic first-timer day.",
            viatorQuery: "Boston Freedom Trail",
          },
          {
            id: "ee2-food",
            category: "FOOD",
            title: "Boston food day",
            summary: "North End and harbour eats.",
            viatorQuery: "Boston food tour",
          },
          {
            id: "ee2-faith",
            category: "RELIGIOUS",
            title: "Historic churches & memorials",
            summary: "Quiet heritage walking.",
          },
        ],
        { viatorCitySlug: "boston" },
      ),
      anchor("ee3", "Days 4–7", "New York", "Manhattan core + one flexible day."),
      flexDay(
        "ee4",
        "Day 6",
        "NYC flexible day",
        "Harbor, Broadway, or family fun.",
        [
          {
            id: "ee4-sights",
            category: "SIGHTS",
            title: "Harbor / Liberty day",
            summary: "Statue & skyline classics.",
            viatorQuery: "Statue of Liberty",
          },
          {
            id: "ee4-show",
            category: "LIVE_ENTERTAINMENT",
            title: "Broadway evening",
            summary: "Show night for the group.",
            viatorQuery: "Broadway",
          },
          {
            id: "ee4-family",
            category: "FAMILY",
            title: "Family-friendly NYC",
            summary: "Lower walking, more breaks.",
          },
        ],
        { viatorCitySlug: "new-york" },
      ),
      anchor(
        "ee5",
        "Days 8–12",
        "Washington, D.C.",
        "Monuments, museums, and a calmer finish.",
      ),
      flexDay(
        "ee6",
        "Day 10",
        "D.C. flexible day",
        "Museums, monuments, or nature.",
        [
          {
            id: "ee6-culture",
            category: "CULTURE",
            title: "Smithsonian deep dive",
            summary: "Pick 1–2 museums max.",
          },
          {
            id: "ee6-nature",
            category: "NATURE",
            title: "Tidal Basin / parks day",
            summary: "Outdoor monuments loop.",
          },
          {
            id: "ee6-food",
            category: "FOOD",
            title: "D.C. food neighbourhoods",
            summary: "Less monuments, more meals.",
            viatorQuery: "Washington DC food tour",
          },
        ],
        { viatorCitySlug: "washington-dc" },
      ),
    ],
  },
  {
    id: "usa-west-coast-classic",
    slug: "usa-west-coast-classic",
    scale: "country",
    title: "USA West Coast Classic",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["SF", "LA", "SD"],
    region: "West Coast",
    days: 12,
    route: "San Francisco → Los Angeles → San Diego",
    bestFor: ["First West Coast", "Cities + coast"],
    comfort: "balanced",
    blurb:
      "Three California cities with room to breathe — not a frantic road marathon.",
    savedCount: 1320,
    groupsUsed: 210,
    recommendPercent: 90,
    keptOrderPercent: 66,
    travelledRating: 4.7,
    travelledReviews: 98,
    addDestinationHints: [
      {
        label: "Las Vegas",
        code: "LAS",
        recommendedExtraDays: [2, 3],
        suggestedRoute: "San Francisco → Los Angeles → Las Vegas → San Diego",
      },
    ],
    blocks: [
      anchor("wc1", "Days 1–4", "San Francisco", "Hills, bridges, neighbourhoods."),
      flexDay(
        "wc2",
        "Day 3",
        "SF flexible day",
        "Nature, food, or culture.",
        [
          {
            id: "wc2-nature",
            category: "NATURE",
            title: "Golden Gate + parks",
            summary: "Outdoor SF day.",
            viatorQuery: "Golden Gate Bridge",
          },
          {
            id: "wc2-food",
            category: "FOOD",
            title: "SF food neighbourhoods",
            summary: "Ferry Building / Mission energy.",
            viatorQuery: "San Francisco food tour",
          },
          {
            id: "wc2-culture",
            category: "CULTURE",
            title: "Museums + Chinatown",
            summary: "Indoor-friendly day.",
          },
        ],
        { viatorCitySlug: "san-francisco" },
      ),
      anchor("wc3", "Days 5–9", "Los Angeles", "Spread out — group by area."),
      flexDay(
        "wc4",
        "Day 7",
        "LA flexible day",
        "Theme park, beaches, or studios.",
        [
          {
            id: "wc4-park",
            category: "THEME_PARK",
            title: "Theme park day",
            summary: "Full leisure day.",
            tradeOff: "Drops one LA sightseeing day.",
            viatorQuery: "Disneyland",
          },
          {
            id: "wc4-nature",
            category: "NATURE",
            title: "Beach + Pacific coast",
            summary: "Santa Monica / Malibu pace.",
          },
          {
            id: "wc4-ent",
            category: "LIVE_ENTERTAINMENT",
            title: "Studio / entertainment day",
            summary: "Showbiz energy.",
            viatorQuery: "Hollywood",
          },
        ],
        { viatorCitySlug: "los-angeles" },
      ),
      anchor("wc5", "Days 10–12", "San Diego", "Softer landing by the water."),
    ],
  },

  // —— Multi-city combine ——
  {
    id: "east-coast-classics",
    slug: "east-coast-classics",
    scale: "multi_city",
    title: "East Coast Classics",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NYC", "DC", "PHL"],
    region: "Northeast",
    days: 9,
    route: "New York → Philadelphia → Washington, D.C.",
    bestFor: ["Cities", "History", "First timers"],
    comfort: "balanced",
    blurb: "The Northeast corridor done cleanly — train-friendly and proven.",
    savedCount: 2100,
    groupsUsed: 401,
    recommendPercent: 93,
    keptOrderPercent: 72,
    travelledRating: 4.9,
    travelledReviews: 188,
    blocks: [
      anchor("ec1", "Days 1–4", "New York", "Skyline and core Manhattan."),
      flexDay(
        "ec2",
        "Day 3",
        "NYC flexible",
        "Harbor, Broadway, or food.",
        [
          {
            id: "ec2-liberty",
            category: "SIGHTS",
            title: "Harbor classics",
            summary: "Liberty / downtown.",
            viatorQuery: "Statue of Liberty",
          },
          {
            id: "ec2-show",
            category: "LIVE_ENTERTAINMENT",
            title: "Broadway night",
            summary: "Evening show block.",
            viatorQuery: "Broadway",
          },
          {
            id: "ec2-food",
            category: "FOOD",
            title: "Food neighbourhood day",
            summary: "Less landmarks, more meals.",
            viatorQuery: "New York food tour",
          },
        ],
        { viatorCitySlug: "new-york" },
      ),
      anchor("ec3", "Days 5–6", "Philadelphia", "Independence history + food."),
      anchor("ec4", "Days 7–9", "Washington, D.C.", "Monuments and museums."),
    ],
  },
  {
    id: "california-trio",
    slug: "california-trio",
    scale: "multi_city",
    title: "California Trio",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["SF", "LA", "SD"],
    region: "West Coast",
    days: 10,
    route: "San Francisco → Los Angeles → San Diego",
    bestFor: ["California", "Coast"],
    comfort: "active",
    blurb: "Three cities, one state — the combine door’s West Coast answer.",
    savedCount: 980,
    groupsUsed: 144,
    recommendPercent: 89,
    keptOrderPercent: 64,
    blocks: [
      anchor("ct1", "Days 1–3", "San Francisco", "Compact city walking."),
      anchor("ct2", "Days 4–7", "Los Angeles", "Area-based days."),
      flexDay(
        "ct3",
        "Day 6",
        "LA fun slot",
        "Theme park or beach.",
        [
          {
            id: "ct3-park",
            category: "THEME_PARK",
            title: "Theme park day",
            summary: "Full day out.",
            tradeOff: "Skips LA neighbourhood day.",
            viatorQuery: "Universal Studios Hollywood",
          },
          {
            id: "ct3-beach",
            category: "NATURE",
            title: "Beach day",
            summary: "Lower intensity.",
          },
        ],
        { viatorCitySlug: "los-angeles" },
      ),
      anchor("ct4", "Days 8–10", "San Diego", "Waterfront finish."),
    ],
  },
  {
    id: "florida-family",
    slug: "florida-family-loop",
    scale: "multi_city",
    title: "Florida Family Loop",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["ORL", "MIA"],
    region: "Southeast",
    days: 8,
    route: "Orlando → Miami",
    bestFor: ["Families", "Theme parks", "Beach"],
    comfort: "balanced",
    blurb: "Parks first, then a beach reset — flexible fun days built in.",
    savedCount: 1560,
    groupsUsed: 288,
    recommendPercent: 91,
    keptOrderPercent: 68,
    travelledRating: 4.8,
    travelledReviews: 120,
    blocks: [
      anchor("ff1", "Days 1–5", "Orlando", "Theme-park heavy base."),
      flexDay(
        "ff2",
        "Day 3",
        "Orlando flexible",
        "Second park, waterpark, or rest.",
        [
          {
            id: "ff2-park",
            category: "THEME_PARK",
            title: "Another park day",
            summary: "High energy.",
            viatorQuery: "Walt Disney World",
          },
          {
            id: "ff2-water",
            category: "WATER_ACTIVITY",
            title: "Waterpark day",
            summary: "Cooler pace for kids.",
            viatorQuery: "Orlando water park",
          },
          {
            id: "ff2-relax",
            category: "RELAX",
            title: "Pool / rest day",
            summary: "Recover between parks.",
          },
        ],
        { viatorCitySlug: "orlando" },
      ),
      anchor("ff3", "Days 6–8", "Miami", "Beach and easy evenings."),
    ],
  },
  {
    id: "southwest-highlights",
    slug: "southwest-highlights",
    scale: "multi_city",
    title: "Southwest Highlights",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["LAS", "LA"],
    region: "Southwest",
    days: 7,
    route: "Las Vegas → Grand Canyon day → Los Angeles",
    bestFor: ["Adventure", "First Southwest"],
    comfort: "active",
    blurb: "Strip energy, one big nature day, then LA — keep the driving honest.",
    savedCount: 870,
    groupsUsed: 96,
    recommendPercent: 88,
    keptOrderPercent: 61,
    blocks: [
      anchor("sw1", "Days 1–3", "Las Vegas", "Strip base + one flexible night."),
      flexDay(
        "sw2",
        "Day 2 evening",
        "Vegas night slot",
        "Show, dinner, or free time.",
        [
          {
            id: "sw2-show",
            category: "LIVE_ENTERTAINMENT",
            title: "Show night",
            summary: "Reserve the evening.",
            viatorQuery: "Las Vegas show",
          },
          {
            id: "sw2-food",
            category: "FOOD",
            title: "Group dinner night",
            summary: "Celebration meal.",
            specialProviderRequired: true,
          },
          {
            id: "sw2-free",
            category: "FREE_TIME",
            title: "Free evening on the Strip",
            summary: "No tickets required.",
          },
        ],
        { viatorCitySlug: "las-vegas" },
      ),
      anchor(
        "sw3",
        "Day 4",
        "Grand Canyon / nature day",
        "Big outdoors day from Vegas.",
        { viatorQuery: "Grand Canyon", viatorCitySlug: "las-vegas", category: "NATURE" },
      ),
      anchor("sw4", "Days 5–7", "Los Angeles", "Coast finish."),
    ],
  },
  {
    id: "music-cities",
    slug: "music-cities-nashville-nola",
    scale: "multi_city",
    title: "Music Cities — Nashville + New Orleans",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NASH", "NOLA"],
    region: "South",
    days: 7,
    route: "Nashville → New Orleans",
    bestFor: ["Music", "Food", "Nightlife"],
    comfort: "balanced",
    blurb: "Live music spines with food-forward flexible nights.",
    savedCount: 640,
    groupsUsed: 78,
    recommendPercent: 90,
    keptOrderPercent: 69,
    blocks: [
      anchor("mc1", "Days 1–3", "Nashville", "Broadway + neighbourhoods."),
      flexDay(
        "mc2",
        "Day 2 evening",
        "Nashville music night",
        "Show or free Honky Tonk stroll.",
        [
          {
            id: "mc2-live",
            category: "LIVE_ENTERTAINMENT",
            title: "Ticketed live show",
            summary: "Reserve seats.",
            viatorQuery: "Nashville show",
          },
          {
            id: "mc2-free",
            category: "NIGHTLIFE",
            title: "Broadway free music crawl",
            summary: "Walk between venues.",
          },
        ],
        { viatorCitySlug: "nashville" },
      ),
      anchor("mc3", "Days 4–7", "New Orleans", "French Quarter + food."),
      flexDay(
        "mc4",
        "Day 5",
        "NOLA flexible",
        "Culture, food, or nightlife.",
        [
          {
            id: "mc4-food",
            category: "FOOD",
            title: "Food tour day",
            summary: "Classic New Orleans eating.",
            viatorQuery: "New Orleans food tour",
          },
          {
            id: "mc4-culture",
            category: "CULTURE",
            title: "History & neighbourhoods",
            summary: "Garden District / museums.",
          },
          {
            id: "mc4-night",
            category: "NIGHTLIFE",
            title: "Music night focus",
            summary: "Evening-heavy day.",
          },
        ],
        { viatorCitySlug: "new-orleans" },
      ),
    ],
  },
  {
    id: "nyc-niagara-weekend",
    slug: "nyc-niagara-long-weekend",
    scale: "multi_city",
    title: "NYC + Niagara Long Weekend",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NYC", "NIA"],
    region: "Northeast",
    days: 5,
    route: "New York → Niagara Falls → New York",
    bestFor: ["Weekenders", "Nature + city"],
    comfort: "balanced",
    blurb: "City energy plus the Falls — the Seneca use case baked into a longer trip.",
    savedCount: 720,
    groupsUsed: 110,
    recommendPercent: 91,
    keptOrderPercent: 74,
    blocks: [
      anchor("nn1", "Days 1–2", "New York", "Quick Manhattan hits."),
      anchor("nn2", "Days 3–4", "Niagara Falls", "Hotel-anchored Falls days."),
      flexDay(
        "nn3",
        "Day 3",
        "Falls flexible",
        "Paid experience or free viewpoints.",
        [
          {
            id: "nn3-paid",
            category: "SIGHTS",
            title: "Bookable Falls experience",
            summary: "Boat / mist classic.",
            viatorQuery: "Niagara Falls",
          },
          {
            id: "nn3-free",
            category: "FREE_TIME",
            title: "Free viewpoints circuit",
            summary: "Keep it free.",
          },
        ],
        { viatorCitySlug: "new-york" },
      ),
      anchor("nn4", "Day 5", "Return via NYC", "Buffer / departure."),
    ],
  },

  // —— City templates ——
  {
    id: "nyc-4",
    slug: "new-york-4-days",
    scale: "city",
    title: "New York — 4 Days",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NYC"],
    region: "Northeast",
    days: 4,
    route: "Manhattan core",
    bestFor: ["First NYC visit", "Weekenders"],
    comfort: "balanced",
    blurb: "A proven Manhattan skeleton with flexible fun/faith/food days.",
    savedCount: 4100,
    groupsUsed: 820,
    recommendPercent: 94,
    keptOrderPercent: 71,
    travelledRating: 4.8,
    travelledReviews: 340,
    addDestinationHints: [
      {
        label: "Washington, D.C.",
        code: "DC",
        recommendedExtraDays: [2, 3],
        suggestedRoute: "New York → Washington, D.C.",
      },
      {
        label: "Niagara Falls",
        code: "NIA",
        recommendedExtraDays: [1, 2],
        suggestedRoute: "New York → Niagara Falls",
      },
    ],
    blocks: [
      anchor("nyc1", "Day 1", "Midtown icons", "Skyline and core landmarks.", {
        viatorQuery: "Empire State",
        viatorCitySlug: "new-york",
      }),
      flexDay(
        "nyc2",
        "Day 2",
        "Downtown / harbor day",
        "Liberty area or culture swap.",
        [
          {
            id: "nyc2-liberty",
            category: "SIGHTS",
            title: "Statue of Liberty / harbor",
            summary: "Classic first-timer day.",
            viatorQuery: "Statue of Liberty",
          },
          {
            id: "nyc2-faith",
            category: "RELIGIOUS",
            title: "Faith & heritage walking day",
            summary: "Historic churches and memorials.",
          },
          {
            id: "nyc2-family",
            category: "FAMILY",
            title: "Family fun day",
            summary: "Kid-friendly pacing.",
          },
        ],
        { viatorQuery: "Statue of Liberty", viatorCitySlug: "new-york" },
      ),
      flexDay(
        "nyc3",
        "Day 3",
        "Park + museums or free time",
        "Central Park belt.",
        [
          {
            id: "nyc3-culture",
            category: "CULTURE",
            title: "Museum morning + park",
            summary: "Classic culture day.",
            viatorQuery: "Metropolitan Museum",
          },
          {
            id: "nyc3-food",
            category: "FOOD",
            title: "Food tour day",
            summary: "Neighbourhood tasting.",
            viatorQuery: "New York food tour",
          },
          {
            id: "nyc3-ent",
            category: "LIVE_ENTERTAINMENT",
            title: "Broadway / live evening",
            summary: "Show night for the group.",
            viatorQuery: "Broadway",
          },
        ],
        { viatorCitySlug: "new-york" },
      ),
      anchor(
        "nyc4",
        "Day 4",
        "Neighbourhoods + departure buffer",
        "Brooklyn or Upper West — keep it light.",
      ),
    ],
  },
  {
    id: "chicago-3",
    slug: "chicago-3-days",
    scale: "city",
    title: "Chicago — 3 Days",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["CHI"],
    region: "Midwest",
    days: 3,
    route: "Loop + lakefront",
    bestFor: ["Architecture", "Food", "Weekenders"],
    comfort: "balanced",
    blurb: "Architecture, lake air, and one flexible food-or-culture day.",
    savedCount: 1180,
    groupsUsed: 190,
    recommendPercent: 91,
    keptOrderPercent: 73,
    travelledRating: 4.7,
    travelledReviews: 88,
    blocks: [
      anchor("chi1", "Day 1", "Architecture + river", "Loop classics.", {
        viatorQuery: "Chicago architecture",
        viatorCitySlug: "chicago",
      }),
      flexDay(
        "chi2",
        "Day 2",
        "Chicago flexible",
        "Museums, food, or lake.",
        [
          {
            id: "chi2-culture",
            category: "CULTURE",
            title: "Museum campus day",
            summary: "Art / science pick.",
          },
          {
            id: "chi2-food",
            category: "FOOD",
            title: "Food neighbourhood day",
            summary: "Deep dish optional.",
            viatorQuery: "Chicago food tour",
          },
          {
            id: "chi2-nature",
            category: "NATURE",
            title: "Lakefront + parks",
            summary: "Outdoor Chicago.",
          },
        ],
        { viatorCitySlug: "chicago" },
      ),
      anchor("chi3", "Day 3", "Neighbourhoods + buffer", "Keep it lighter."),
    ],
  },
  {
    id: "dc-3",
    slug: "washington-dc-3-days",
    scale: "city",
    title: "Washington, D.C. — 3 Days",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["DC"],
    region: "Northeast",
    days: 3,
    route: "National Mall core",
    bestFor: ["History", "Museums", "Families"],
    comfort: "relaxed",
    blurb: "Monuments and museums with one flexible day — don’t try to do every Smithsonian.",
    savedCount: 1420,
    groupsUsed: 240,
    recommendPercent: 92,
    keptOrderPercent: 76,
    travelledRating: 4.8,
    travelledReviews: 110,
    blocks: [
      anchor("dc1", "Day 1", "Monuments loop", "Mall outdoor classics."),
      flexDay(
        "dc2",
        "Day 2",
        "D.C. flexible",
        "Museums, food, or faith sites.",
        [
          {
            id: "dc2-culture",
            category: "CULTURE",
            title: "Smithsonian focus",
            summary: "One campus, done well.",
          },
          {
            id: "dc2-faith",
            category: "RELIGIOUS",
            title: "National Cathedral / sacred sites",
            summary: "Quiet heritage day.",
          },
          {
            id: "dc2-food",
            category: "FOOD",
            title: "Food neighbourhoods",
            summary: "Less Mall, more meals.",
            viatorQuery: "Washington DC food tour",
          },
        ],
        { viatorCitySlug: "washington-dc" },
      ),
      anchor("dc3", "Day 3", "Neighbourhoods + buffer", "Georgetown or U Street pace."),
    ],
  },
  {
    id: "miami-3",
    slug: "miami-3-days",
    scale: "city",
    title: "Miami — 3 Days",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["MIA"],
    region: "Southeast",
    days: 3,
    route: "Beach + city",
    bestFor: ["Beach", "Nightlife", "Food"],
    comfort: "relaxed",
    blurb: "Beach mornings, neighbourhood afternoons, one flexible night.",
    savedCount: 990,
    groupsUsed: 150,
    recommendPercent: 89,
    keptOrderPercent: 70,
    blocks: [
      anchor("mia1", "Day 1", "South Beach", "Beach + Art Deco."),
      flexDay(
        "mia2",
        "Day 2",
        "Miami flexible",
        "Culture, nature, or nightlife.",
        [
          {
            id: "mia2-culture",
            category: "CULTURE",
            title: "Wynwood / museums",
            summary: "Art-forward day.",
          },
          {
            id: "mia2-nature",
            category: "NATURE",
            title: "Everglades or bay nature",
            summary: "Out of the beach strip.",
            viatorQuery: "Everglades",
          },
          {
            id: "mia2-night",
            category: "NIGHTLIFE",
            title: "Nightlife-focused evening",
            summary: "Late start day.",
          },
        ],
        { viatorCitySlug: "miami" },
      ),
      anchor("mia3", "Day 3", "Easy beach + buffer", "Don’t overpack departure."),
    ],
  },
  {
    id: "orlando-4",
    slug: "orlando-family-4-days",
    scale: "city",
    title: "Orlando Family — 4 Days",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["ORL"],
    region: "Southeast",
    days: 4,
    route: "Theme parks + recovery",
    bestFor: ["Families", "Theme parks"],
    comfort: "active",
    blurb: "Park days with a built-in recovery / waterpark flex — kids will need it.",
    savedCount: 2200,
    groupsUsed: 410,
    recommendPercent: 90,
    keptOrderPercent: 65,
    travelledRating: 4.7,
    travelledReviews: 200,
    blocks: [
      anchor("orl1", "Day 1", "Main park day", "Biggest park first.", {
        viatorQuery: "Walt Disney World",
        viatorCitySlug: "orlando",
      }),
      anchor("orl2", "Day 2", "Second park day", "Keep energy high."),
      flexDay(
        "orl3",
        "Day 3",
        "Recovery / fun flex",
        "Waterpark, another park, or rest.",
        [
          {
            id: "orl3-water",
            category: "WATER_ACTIVITY",
            title: "Waterpark day",
            summary: "Cooler for kids.",
            viatorQuery: "Orlando water park",
          },
          {
            id: "orl3-park",
            category: "THEME_PARK",
            title: "Third park day",
            summary: "For hardcore park families.",
            tradeOff: "No recovery day.",
          },
          {
            id: "orl3-relax",
            category: "RELAX",
            title: "Pool / resort day",
            summary: "Reset.",
          },
        ],
        { viatorCitySlug: "orlando" },
      ),
      anchor("orl4", "Day 4", "Light day + buffer", "Shopping or pool before travel."),
    ],
  },
  {
    id: "vegas-3",
    slug: "las-vegas-3-days",
    scale: "city",
    title: "Las Vegas — 3 Days",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["LAS"],
    region: "Southwest",
    days: 3,
    route: "Strip-centered",
    bestFor: ["Shows", "Nightlife", "Short trips"],
    comfort: "balanced",
    blurb: "Strip days with a nature escape option and a show night flex.",
    savedCount: 1680,
    groupsUsed: 260,
    recommendPercent: 88,
    keptOrderPercent: 67,
    blocks: [
      anchor("las1", "Day 1", "Strip icons", "Walkable highlights."),
      flexDay(
        "las2",
        "Day 2",
        "Vegas flexible",
        "Nature day trip or show focus.",
        [
          {
            id: "las2-nature",
            category: "NATURE",
            title: "Grand Canyon / nature day trip",
            summary: "Leave the Strip.",
            viatorQuery: "Grand Canyon",
          },
          {
            id: "las2-show",
            category: "LIVE_ENTERTAINMENT",
            title: "Show + Strip evening",
            summary: "Stay close to hotels.",
            viatorQuery: "Las Vegas show",
          },
          {
            id: "las2-relax",
            category: "RELAX",
            title: "Pool / spa day",
            summary: "Low walking.",
          },
        ],
        { viatorCitySlug: "las-vegas" },
      ),
      anchor("las3", "Day 3", "Easy Strip + buffer", "Checkout-friendly."),
    ],
  },
  {
    id: "sf-3",
    slug: "san-francisco-3-days",
    scale: "city",
    title: "San Francisco — 3 Days",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["SF"],
    region: "West Coast",
    days: 3,
    route: "City + bay",
    bestFor: ["First SF visit", "Walking"],
    comfort: "active",
    blurb: "Hills and neighbourhoods with one nature-or-food flexible day.",
    savedCount: 1340,
    groupsUsed: 200,
    recommendPercent: 91,
    keptOrderPercent: 72,
    blocks: [
      anchor("sf1", "Day 1", "Iconic viewpoints", "Bridge + waterfront."),
      flexDay(
        "sf2",
        "Day 2",
        "SF flexible",
        "Nature, food, or culture.",
        [
          {
            id: "sf2-nature",
            category: "NATURE",
            title: "Golden Gate + parks",
            summary: "Outdoor day.",
            viatorQuery: "Golden Gate",
          },
          {
            id: "sf2-food",
            category: "FOOD",
            title: "Food neighbourhoods",
            summary: "Mission / Ferry Building.",
            viatorQuery: "San Francisco food tour",
          },
          {
            id: "sf2-culture",
            category: "CULTURE",
            title: "Museums day",
            summary: "Indoor-friendly.",
          },
        ],
        { viatorCitySlug: "san-francisco" },
      ),
      anchor("sf3", "Day 3", "Neighbourhoods + buffer", "Keep hills reasonable."),
    ],
  },
  {
    id: "nola-3",
    slug: "new-orleans-3-days",
    scale: "city",
    title: "New Orleans — 3 Days",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NOLA"],
    region: "South",
    days: 3,
    route: "French Quarter + beyond",
    bestFor: ["Food", "Music", "Culture"],
    comfort: "balanced",
    blurb: "Food and music first — with a flexible culture or nightlife night.",
    savedCount: 1100,
    groupsUsed: 170,
    recommendPercent: 93,
    keptOrderPercent: 74,
    travelledRating: 4.9,
    travelledReviews: 95,
    blocks: [
      anchor("nola1", "Day 1", "French Quarter", "Core streets + cafe pace."),
      flexDay(
        "nola2",
        "Day 2",
        "NOLA flexible",
        "Food tour, culture, or music night.",
        [
          {
            id: "nola2-food",
            category: "FOOD",
            title: "Food tour day",
            summary: "Classic tasting route.",
            viatorQuery: "New Orleans food tour",
          },
          {
            id: "nola2-culture",
            category: "CULTURE",
            title: "History & Garden District",
            summary: "Beyond Bourbon.",
          },
          {
            id: "nola2-live",
            category: "LIVE_ENTERTAINMENT",
            title: "Live music night",
            summary: "Reserve the evening.",
            viatorQuery: "New Orleans jazz",
          },
        ],
        { viatorCitySlug: "new-orleans" },
      ),
      anchor("nola3", "Day 3", "Easy morning + buffer", "Beignets, then go."),
    ],
  },

  // —— Hotel area ——
  {
    id: "midtown-hotel-3",
    slug: "midtown-hotel-3-days",
    scale: "hotel_area",
    title: "3 Days in NYC from Midtown",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NYC"],
    region: "Northeast",
    days: 3,
    route: "Midtown hotel anchor",
    bestFor: ["Hotel-based stays", "First timers"],
    comfort: "balanced",
    blurb: "Built around a Midtown stay — less cross-town zigzagging.",
    savedCount: 890,
    groupsUsed: 140,
    recommendPercent: 87,
    keptOrderPercent: 69,
    hotelAnchor: {
      id: "midtown-generic",
      name: "Midtown Manhattan hotel",
      area: "Times Square / Midtown",
      lat: 40.758,
      lng: -73.9855,
    },
    blocks: [
      anchor("mh1", "Day 1", "Walkable Midtown", "Icons near the hotel.", {
        fromHotelMinutes: 15,
      }),
      flexDay(
        "mh2",
        "Day 2",
        "Choose downtown or leisure",
        "Harbor sights or a fun day.",
        [
          {
            id: "mh2-sights",
            category: "SIGHTS",
            title: "Harbor / Liberty day",
            summary: "One transit hop downtown.",
            viatorQuery: "Statue of Liberty",
          },
          {
            id: "mh2-fun",
            category: "FAMILY",
            title: "Family leisure day",
            summary: "Lower-stress pacing.",
          },
        ],
        { fromHotelMinutes: 35, viatorCitySlug: "new-york" },
      ),
      anchor("mh3", "Day 3", "Park morning + buffer", "Finish near the hotel.", {
        fromHotelMinutes: 20,
      }),
    ],
  },

  // —— I'm Here Now ——
  {
    id: "niagara-essentials-4h",
    slug: "niagara-essentials-from-seneca",
    scale: "here_now",
    title: "Niagara Falls Essentials",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NIA"],
    region: "Northeast",
    days: 1,
    route: "From Seneca Niagara Resort",
    bestFor: ["First-time visitors", "Half day"],
    comfort: "balanced",
    blurb:
      "A sensible 4–6 hour loop from the resort — viewpoints first, optional paid experience.",
    savedCount: 420,
    groupsUsed: 95,
    recommendPercent: 94,
    keptOrderPercent: 82,
    travelledRating: 4.9,
    travelledReviews: 61,
    timeBuckets: ["4h", "rest_today"],
    moods: ["famous", "free", "family"],
    hotelAnchor: {
      id: "seneca-niagara",
      name: "Seneca Niagara Resort & Casino",
      area: "Niagara Falls, NY",
      lat: 43.0851,
      lng: -79.0686,
    },
    blocks: [
      anchor("nf1", "Start", "Leave the resort", "Short hop to the state park.", {
        fromHotelMinutes: 8,
        free: true,
      }),
      anchor(
        "nf2",
        "Morning",
        "Niagara Falls State Park viewpoints",
        "Free views — the main reason you're here.",
        {
          fromHotelMinutes: 10,
          durationHours: 1.5,
          walking: "moderate",
          free: true,
          category: "SIGHTS",
        },
      ),
      flexDay(
        "nf3",
        "Midday",
        "Optional Falls experience",
        "Paid boat/deck experience if season and budget allow.",
        [
          {
            id: "nf3-paid",
            category: "SIGHTS",
            title: "Bookable Falls experience",
            summary: "Classic paid highlight.",
            viatorQuery: "Niagara Falls tour",
          },
          {
            id: "nf3-free",
            category: "FREE_TIME",
            title: "Keep it free — more viewpoints",
            summary: "Skip paid tickets; extend park walking.",
          },
        ],
        {
          fromHotelMinutes: 12,
          free: false,
          viatorQuery: "Niagara Falls",
          viatorCitySlug: "new-york",
        },
      ),
      anchor("nf4", "Afternoon", "Goat Island", "Grouped stops — no zigzagging.", {
        fromHotelMinutes: 15,
        free: true,
      }),
      anchor("nf5", "Return", "Back toward the resort", "Finish mid-afternoon.", {
        fromHotelMinutes: 10,
        free: true,
      }),
    ],
  },
  {
    id: "niagara-evening",
    slug: "niagara-first-evening-from-seneca",
    scale: "here_now",
    title: "Niagara First Evening",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NIA"],
    region: "Northeast",
    days: 1,
    route: "From Seneca Niagara Resort",
    bestFor: ["Check-in afternoon", "Rest of today"],
    comfort: "relaxed",
    blurb:
      "Checked in at 3–4 p.m.? Viewpoints, dinner, illuminated falls — back at the resort.",
    savedCount: 510,
    groupsUsed: 120,
    recommendPercent: 95,
    keptOrderPercent: 88,
    travelledRating: 4.9,
    travelledReviews: 88,
    timeBuckets: ["rest_today", "2h", "4h"],
    moods: ["famous", "relax", "food", "free"],
    hotelAnchor: {
      id: "seneca-niagara",
      name: "Seneca Niagara Resort & Casino",
      area: "Niagara Falls, NY",
      lat: 43.0851,
      lng: -79.0686,
    },
    blocks: [
      anchor("ne1", "4:30", "Falls viewpoints", "Short walk from the resort.", {
        fromHotelMinutes: 10,
        free: true,
        walking: "low",
      }),
      anchor("ne2", "5:30", "Goat Island stroll", "Easy pacing after travel.", {
        fromHotelMinutes: 15,
        free: true,
      }),
      flexDay(
        "ne3",
        "7:00",
        "Dinner",
        "Near hotel or falls strip.",
        [
          {
            id: "ne3-hotel",
            category: "FOOD",
            title: "Dinner near / at resort",
            summary: "Minimal travel.",
          },
          {
            id: "ne3-strip",
            category: "FOOD",
            title: "Falls-area dinner",
            summary: "More atmosphere.",
          },
        ],
        { fromHotelMinutes: 8, category: "FOOD" },
      ),
      anchor("ne4", "8:30", "Illuminated Falls", "Night views — free.", {
        fromHotelMinutes: 10,
        free: true,
      }),
      anchor("ne5", "10:00", "Back at resort", "Casino / rest.", {
        fromHotelMinutes: 5,
        free: true,
      }),
    ],
  },
  {
    id: "niagara-easy-evening",
    slug: "niagara-easy-evening-from-seneca",
    scale: "here_now",
    title: "Easy Evening",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NIA"],
    days: 1,
    route: "From Seneca Niagara Resort",
    bestFor: ["Low energy", "Short walks"],
    comfort: "relaxed",
    blurb: "Short walk, dinner, viewpoints, resort — no marathon.",
    savedCount: 290,
    groupsUsed: 55,
    recommendPercent: 92,
    keptOrderPercent: 90,
    timeBuckets: ["2h", "rest_today"],
    moods: ["relax", "free", "food"],
    hotelAnchor: {
      id: "seneca-niagara",
      name: "Seneca Niagara Resort & Casino",
      area: "Niagara Falls, NY",
      lat: 43.0851,
      lng: -79.0686,
    },
    blocks: [
      anchor("nee1", "Now", "Short falls viewpoint walk", "~10 minutes from hotel.", {
        fromHotelMinutes: 10,
        free: true,
        walking: "low",
      }),
      anchor("nee2", "Dinner", "Dinner", "Keep it close.", {
        fromHotelMinutes: 5,
        category: "FOOD",
      }),
      anchor("nee3", "Night", "Viewpoints + resort", "Optional illuminated falls.", {
        fromHotelMinutes: 10,
        free: true,
      }),
    ],
  },
  {
    id: "niagara-adventure-evening",
    slug: "niagara-adventure-evening-from-seneca",
    scale: "here_now",
    title: "Adventure Evening",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NIA"],
    days: 1,
    route: "From Seneca Niagara Resort",
    bestFor: ["Something exciting"],
    comfort: "active",
    blurb: "Falls experience + dinner + night views when time allows.",
    savedCount: 210,
    groupsUsed: 40,
    recommendPercent: 88,
    keptOrderPercent: 72,
    timeBuckets: ["4h", "rest_today"],
    moods: ["exciting", "famous"],
    hotelAnchor: {
      id: "seneca-niagara",
      name: "Seneca Niagara Resort & Casino",
      area: "Niagara Falls, NY",
      lat: 43.0851,
      lng: -79.0686,
    },
    blocks: [
      flexDay(
        "nae1",
        "Late afternoon",
        "Falls experience",
        "Bookable adventure if available.",
        [
          {
            id: "nae1-paid",
            category: "WATER_ACTIVITY",
            title: "Paid Falls experience",
            summary: "High energy.",
            viatorQuery: "Niagara Falls tour",
          },
          {
            id: "nae1-view",
            category: "SIGHTS",
            title: "Intense viewpoint circuit",
            summary: "Free alternative.",
          },
        ],
        { viatorQuery: "Niagara Falls", viatorCitySlug: "new-york" },
      ),
      anchor("nae2", "Dinner", "Dinner", "Refuel.", {
        category: "FOOD",
        fromHotelMinutes: 10,
      }),
      anchor("nae3", "Night", "Night views", "Illuminated falls, return.", {
        free: true,
        fromHotelMinutes: 10,
      }),
    ],
  },
  {
    id: "niagara-tomorrow-morning",
    slug: "niagara-morning-before-checkout",
    scale: "here_now",
    title: "Tomorrow Morning Before Checkout",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["NIA"],
    days: 1,
    route: "From Seneca Niagara Resort",
    bestFor: ["Morning", "Checkout day"],
    comfort: "relaxed",
    blurb: "2–3 hours of viewpoints before you leave — no overpacking.",
    savedCount: 180,
    groupsUsed: 44,
    recommendPercent: 93,
    keptOrderPercent: 91,
    timeBuckets: ["morning", "2h"],
    moods: ["famous", "free", "relax"],
    hotelAnchor: {
      id: "seneca-niagara",
      name: "Seneca Niagara Resort & Casino",
      area: "Niagara Falls, NY",
      lat: 43.0851,
      lng: -79.0686,
    },
    blocks: [
      anchor("nm1", "Morning", "Falls viewpoints", "Best light, short walk.", {
        fromHotelMinutes: 10,
        free: true,
        walking: "low",
      }),
      anchor("nm2", "Return", "Back for checkout", "Buffer for luggage.", {
        fromHotelMinutes: 8,
        free: true,
      }),
    ],
  },
  {
    id: "vegas-strip-evening",
    slug: "vegas-strip-first-evening",
    scale: "here_now",
    title: "Vegas Strip First Evening",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["LAS"],
    days: 1,
    route: "From a Strip hotel",
    bestFor: ["Check-in day", "Rest of today"],
    comfort: "relaxed",
    blurb: "Checked into the Strip? Walk, dinner, lights — no day-trip yet.",
    savedCount: 340,
    groupsUsed: 70,
    recommendPercent: 90,
    keptOrderPercent: 85,
    timeBuckets: ["rest_today", "2h", "4h"],
    moods: ["famous", "food", "exciting", "relax"],
    hotelAnchor: {
      id: "vegas-strip",
      name: "Las Vegas Strip hotel",
      area: "Las Vegas Strip, NV",
      lat: 36.1147,
      lng: -115.1728,
    },
    blocks: [
      anchor("vse1", "Now", "Strip walk", "Fountains / icons near your hotel.", {
        fromHotelMinutes: 10,
        free: true,
      }),
      flexDay(
        "vse2",
        "Evening",
        "Dinner or show",
        "Keep it close tonight.",
        [
          {
            id: "vse2-food",
            category: "FOOD",
            title: "Dinner near hotel",
            summary: "No long cab rides.",
          },
          {
            id: "vse2-show",
            category: "LIVE_ENTERTAINMENT",
            title: "Show if tickets available",
            summary: "Optional paid night.",
            viatorQuery: "Las Vegas show",
          },
        ],
        { viatorCitySlug: "las-vegas" },
      ),
      anchor("vse3", "Night", "Lights + return", "Back to the hotel.", {
        fromHotelMinutes: 15,
        free: true,
      }),
    ],
  },
  {
    id: "orlando-park-tomorrow",
    slug: "orlando-full-park-day-from-hotel",
    scale: "here_now",
    title: "Orlando Full Park Day",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["ORL"],
    days: 1,
    route: "From International Drive / park-area hotel",
    bestFor: ["Full day", "Families"],
    comfort: "active",
    blurb: "One clear park day from your hotel — tickets optional via Viator.",
    savedCount: 280,
    groupsUsed: 55,
    recommendPercent: 89,
    keptOrderPercent: 80,
    timeBuckets: ["full_day"],
    moods: ["family", "exciting", "famous"],
    hotelAnchor: {
      id: "orlando-idrive",
      name: "Orlando park-area hotel",
      area: "International Drive / Disney area",
      lat: 28.3838,
      lng: -81.4639,
    },
    blocks: [
      anchor("ope1", "Morning", "Park arrival", "Get there early.", {
        fromHotelMinutes: 25,
      }),
      flexDay(
        "ope2",
        "Day",
        "Park or waterpark",
        "Pick the day’s intensity.",
        [
          {
            id: "ope2-park",
            category: "THEME_PARK",
            title: "Theme park day",
            summary: "Main parks.",
            viatorQuery: "Walt Disney World",
          },
          {
            id: "ope2-water",
            category: "WATER_ACTIVITY",
            title: "Waterpark day",
            summary: "Slightly easier on legs.",
            viatorQuery: "Orlando water park",
          },
        ],
        { viatorCitySlug: "orlando" },
      ),
      anchor("ope3", "Evening", "Return to hotel", "Pool / early night.", {
        fromHotelMinutes: 25,
      }),
    ],
  },
  {
    id: "miami-beach-rest-today",
    slug: "miami-beach-rest-of-today",
    scale: "here_now",
    title: "Miami Beach — Rest of Today",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["MIA"],
    days: 1,
    route: "From Miami Beach hotel",
    bestFor: ["Check-in day", "Beach"],
    comfort: "relaxed",
    blurb: "Beach, Art Deco stroll, dinner — stay close to the hotel.",
    savedCount: 190,
    groupsUsed: 40,
    recommendPercent: 91,
    keptOrderPercent: 88,
    timeBuckets: ["rest_today", "4h", "2h"],
    moods: ["relax", "food", "famous", "free"],
    hotelAnchor: {
      id: "miami-beach",
      name: "Miami Beach hotel",
      area: "South Beach, FL",
      lat: 25.7907,
      lng: -80.13,
    },
    blocks: [
      anchor("mbr1", "Afternoon", "Beach time", "The reason you booked here.", {
        fromHotelMinutes: 5,
        free: true,
      }),
      anchor("mbr2", "Late day", "Art Deco walk", "Short stroll.", {
        fromHotelMinutes: 10,
        free: true,
      }),
      flexDay(
        "mbr3",
        "Dinner",
        "Dinner",
        "Near the hotel.",
        [
          {
            id: "mbr3-near",
            category: "FOOD",
            title: "Dinner nearby",
            summary: "Walkable.",
          },
          {
            id: "mbr3-night",
            category: "NIGHTLIFE",
            title: "Later nightlife",
            summary: "If energy allows.",
          },
        ],
      ),
    ],
  },
  {
    id: "chicago-mag-mile-evening",
    slug: "chicago-magnificent-mile-evening",
    scale: "here_now",
    title: "Chicago Magnificent Mile Evening",
    countries: ["United States"],
    countryCodes: ["US"],
    cityCodes: ["CHI"],
    days: 1,
    route: "From Magnificent Mile hotel",
    bestFor: ["Check-in day"],
    comfort: "relaxed",
    blurb: "River views, easy walk, dinner — save architecture cruise for tomorrow.",
    savedCount: 160,
    groupsUsed: 32,
    recommendPercent: 90,
    keptOrderPercent: 86,
    timeBuckets: ["rest_today", "2h", "4h"],
    moods: ["famous", "food", "relax", "free"],
    hotelAnchor: {
      id: "chicago-mag-mile",
      name: "Magnificent Mile hotel",
      area: "Chicago, IL",
      lat: 41.8916,
      lng: -87.6244,
    },
    blocks: [
      anchor("cme1", "Now", "River / Mag Mile walk", "Stay close.", {
        fromHotelMinutes: 10,
        free: true,
      }),
      flexDay(
        "cme2",
        "Evening",
        "Dinner",
        "Nearby or riverfront.",
        [
          {
            id: "cme2-food",
            category: "FOOD",
            title: "Dinner nearby",
            summary: "Low travel.",
          },
          {
            id: "cme2-show",
            category: "LIVE_ENTERTAINMENT",
            title: "Show if available",
            summary: "Optional.",
            viatorQuery: "Chicago show",
          },
        ],
        { viatorCitySlug: "chicago" },
      ),
      anchor("cme3", "Night", "Back to hotel", "Early night after travel.", {
        fromHotelMinutes: 8,
        free: true,
      }),
    ],
  },
];

export function getTemplateBySlug(slug: string) {
  return tripTemplates.find((t) => t.slug === slug || t.id === slug) || null;
}

export function listTemplates(filters?: {
  scale?: TemplateScale | "all";
  countries?: string[];
  cityCodes?: string[];
  hotelId?: string;
  timeBucket?: string;
  mood?: string;
  region?: string;
}) {
  return tripTemplates.filter((t) => {
    if (filters?.scale && filters.scale !== "all" && t.scale !== filters.scale)
      return false;
    if (filters?.countries?.length) {
      const codes = filters.countries.map((c) => c.toUpperCase());
      const ok = codes.every((c) => t.countryCodes.includes(c));
      if (!ok) return false;
    }
    if (filters?.cityCodes?.length) {
      const codes = filters.cityCodes.map((c) => c.toUpperCase());
      const ok = codes.every((c) => t.cityCodes.includes(c));
      if (!ok) return false;
    }
    if (filters?.hotelId && t.hotelAnchor?.id !== filters.hotelId) return false;
    if (
      filters?.timeBucket &&
      t.timeBuckets &&
      !t.timeBuckets.includes(filters.timeBucket as never)
    )
      return false;
    if (filters?.mood && t.moods && !t.moods.includes(filters.mood))
      return false;
    if (filters?.region && t.region !== filters.region) return false;
    return true;
  });
}

/** Combine US cities — multi-city spines that include every selected code. */
export function combineUsCities(cityCodes: string[]) {
  const normalized = [...new Set(cityCodes.map((c) => c.toUpperCase()))];
  if (normalized.length === 0) {
    return listTemplates({ scale: "multi_city" });
  }
  if (normalized.length === 1) {
    return listTemplates({ cityCodes: normalized }).filter(
      (t) => t.scale === "city" || t.scale === "multi_city" || t.scale === "country",
    );
  }
  return listTemplates({ scale: "multi_city", cityCodes: normalized });
}

/** @deprecated use combineUsCities */
export function combineCountryTemplates(codes: string[]) {
  return combineUsCities(codes);
}

export type AppliedSwap = {
  blockId: string;
  optionId: string;
  dayLabel: string;
  want: ExperienceCategory;
  fromTitle: string;
  toTitle: string;
  tradeOff?: string;
};

export type PersonalizeResult = {
  template: TripTemplate;
  applied: AppliedSwap[];
  unfit: ExperienceCategory[];
  messages: string[];
  tradeOffs: string[];
  specialEvents: Array<{ blockId: string; title: string; note: string }>;
  canFitWithoutExtend: boolean;
};

export function personalizeTemplate(
  template: TripTemplate,
  wants: ExperienceCategory[],
): PersonalizeResult {
  const applied: AppliedSwap[] = [];
  const messages: string[] = [];
  const tradeOffs: string[] = [];
  const specialEvents: PersonalizeResult["specialEvents"] = [];
  const remaining = [...wants];

  const blocks = template.blocks.map((block) => {
    if (!block.alternatives?.length || !remaining.length) return block;
    const match = block.alternatives.find((alt) =>
      remaining.includes(alt.category),
    );
    if (!match) return block;
    remaining.splice(remaining.indexOf(match.category), 1);
    applied.push({
      blockId: block.id,
      optionId: match.id,
      dayLabel: block.dayLabel,
      want: match.category,
      fromTitle: block.title,
      toTitle: match.title,
      tradeOff: match.tradeOff,
    });
    if (match.tradeOff) tradeOffs.push(match.tradeOff);
    messages.push(
      `${block.dayLabel}: “${block.title}” → “${match.title}”.`,
    );
    if (match.specialProviderRequired) {
      specialEvents.push({
        blockId: block.id,
        title: match.title,
        note: "Special group experience — provider required. Time is reserved.",
      });
    }
    return {
      ...block,
      title: match.title,
      summary: match.summary,
      category: match.category,
      viatorQuery: match.viatorQuery || block.viatorQuery,
      specialProviderRequired: match.specialProviderRequired,
    };
  });

  for (const left of remaining) {
    messages.push(
      `No open flexible day for ${experienceCategoryLabel[left]} — swap a slot manually or add a day.`,
    );
  }

  const canFitWithoutExtend = wants.length > 0 && remaining.length === 0;

  if (canFitWithoutExtend && !tradeOffs.length) {
    messages.unshift("Fits without extending the trip.");
  } else if (canFitWithoutExtend && tradeOffs.length) {
    messages.unshift("Fits without extending — see trade-offs below.");
  }

  return {
    template: { ...template, blocks },
    applied,
    unfit: remaining,
    messages,
    tradeOffs,
    specialEvents,
    canFitWithoutExtend,
  };
}

/** Which personalize options can map onto at least one flexible slot. */
export function personalizeAvailability(template: TripTemplate) {
  const available = new Set<ExperienceCategory>();
  for (const block of template.blocks) {
    for (const alt of block.alternatives || []) {
      available.add(alt.category);
    }
  }
  return personalizeOptions.map((opt) => ({
    ...opt,
    available: available.has(opt.id),
    slots: template.blocks
      .filter((b) => b.alternatives?.some((a) => a.category === opt.id))
      .map((b) => b.dayLabel),
  }));
}

export function suggestAddDestination(template: TripTemplate, code: string) {
  const normalized = code.toUpperCase();
  const alreadyOnTrip = template.cityCodes.includes(normalized);
  const hint = template.addDestinationHints?.find(
    (h) => h.code.toUpperCase() === normalized,
  );
  const label =
    hint?.label ||
    usCityOptions.find((c) => c.code === normalized)?.label ||
    code;

  const exactCombine = combineUsCities([...template.cityCodes, normalized]).filter(
    (t) => t.id !== template.id,
  );

  const overlapping = listTemplates({ scale: "multi_city" }).filter(
    (t) =>
      t.id !== template.id &&
      t.cityCodes.includes(normalized) &&
      t.cityCodes.some((c) => template.cityCodes.includes(c)),
  );

  const relatedMap = new Map<string, TripTemplate>();
  for (const t of [...exactCombine, ...overlapping]) {
    relatedMap.set(t.id, t);
  }
  const relatedTemplates = Array.from(relatedMap.values()).sort(
    (a, b) => b.savedCount - a.savedCount,
  );

  const recommendedDays: [number, number] = hint
    ? [
        template.days + hint.recommendedExtraDays[0],
        template.days + hint.recommendedExtraDays[1],
      ]
    : [template.days + 2, template.days + 4];

  const suggestedRoute =
    hint?.suggestedRoute ||
    relatedTemplates[0]?.route ||
    `${template.route} → ${label}`;

  return {
    label,
    code: normalized,
    alreadyOnTrip,
    recommendedDays,
    extraDays: [
      recommendedDays[0] - template.days,
      recommendedDays[1] - template.days,
    ] as [number, number],
    suggestedRoute,
    relatedTemplates,
    currentDays: template.days,
    currentRoute: template.route,
  };
}

/** @deprecated use suggestAddDestination */
export function suggestAddCountry(template: TripTemplate, code: string) {
  return suggestAddDestination(template, code);
}

export const hereNowHotels = [
  {
    id: "seneca-niagara",
    name: "Seneca Niagara Resort & Casino",
    area: "Niagara Falls, NY",
    blurb: "Look out the window — here's what to do from the resort.",
  },
  {
    id: "midtown-generic",
    name: "Midtown Manhattan hotel",
    area: "New York, NY",
    blurb: "Hotel-anchored Midtown plans.",
  },
  {
    id: "vegas-strip",
    name: "Las Vegas Strip hotel",
    area: "Las Vegas, NV",
    blurb: "Checked into the Strip — start with tonight.",
  },
  {
    id: "orlando-idrive",
    name: "Orlando park-area hotel",
    area: "Orlando, FL",
    blurb: "Parks tomorrow? Here's a clear full day.",
  },
  {
    id: "miami-beach",
    name: "Miami Beach hotel",
    area: "Miami Beach, FL",
    blurb: "Beach first — keep tonight simple.",
  },
  {
    id: "chicago-mag-mile",
    name: "Magnificent Mile hotel",
    area: "Chicago, IL",
    blurb: "Easy evening from Mag Mile.",
  },
];

export const moodOptions = [
  { id: "famous", label: "See the famous sights" },
  { id: "relax", label: "Relax" },
  { id: "food", label: "Food" },
  { id: "exciting", label: "Something exciting" },
  { id: "family", label: "Family activity" },
  { id: "free", label: "Something free" },
];

export const timeBucketOptions = [
  { id: "2h", label: "2 hours" },
  { id: "4h", label: "4 hours" },
  { id: "rest_today", label: "Rest of today" },
  { id: "full_day", label: "Full day tomorrow" },
  { id: "morning", label: "Tomorrow morning before checkout" },
];
