/**
 * ToursIWant — proven trip templates with flexible experience blocks.
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

export type TemplateScale =
  | "multi_country"
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
  /** Minutes from hotel when hotel-anchored */
  fromHotelMinutes?: number;
  category?: ExperienceCategory;
  /** Alternate modules for flexible slots */
  alternatives?: ExperienceOption[];
  /** Paid optional experience hint */
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
  days: number;
  nightsHint?: string;
  route: string;
  bestFor: string[];
  comfort: ComfortLevel;
  blurb: string;
  /** Social proof seeds (Release 3 style) */
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
  addCountryHints?: Array<{
    country: string;
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
  { id: "LIVE_ENTERTAINMENT", label: "Live entertainment / band" },
  { id: "PRIVATE_GROUP_EVENT", label: "Private group dinner" },
  { id: "NIGHTLIFE", label: "Nightlife" },
  { id: "SHOPPING", label: "Shopping day" },
  { id: "NATURE", label: "Nature day" },
  { id: "FOOD", label: "Food tour" },
  { id: "FAMILY", label: "Children’s activities" },
  { id: "RELAX", label: "Relaxation / spa" },
];

export const tripTemplates: TripTemplate[] = [
  {
    id: "jp-first-timer",
    slug: "japan-first-timer",
    scale: "country",
    title: "Japan First Timer",
    countries: ["Japan"],
    countryCodes: ["JP"],
    days: 10,
    nightsHint: "Tokyo → Kyoto → Osaka",
    route: "Tokyo → Kyoto → Osaka",
    bestFor: ["First visit", "Culture", "Food", "Cities"],
    comfort: "balanced",
    blurb:
      "A proven first Japan loop: city energy, temples, and food — without overpacking the calendar.",
    savedCount: 2421,
    groupsUsed: 487,
    recommendPercent: 91,
    keptOrderPercent: 68,
    travelledRating: 4.8,
    travelledReviews: 184,
    addCountryHints: [
      {
        country: "South Korea",
        code: "KR",
        recommendedExtraDays: [3, 5],
        suggestedRoute: "Tokyo → Kyoto → Osaka → Seoul",
      },
      {
        country: "Thailand",
        code: "TH",
        recommendedExtraDays: [4, 6],
        suggestedRoute: "Tokyo → Kyoto → Osaka → Bangkok",
      },
    ],
    blocks: [
      {
        id: "jp1",
        kind: "anchor",
        dayLabel: "Days 1–4",
        title: "Tokyo base",
        summary: "Neighbourhoods, food, and one major landmark day.",
        durationHours: 96,
      },
      {
        id: "jp2",
        kind: "flexible",
        dayLabel: "Day 5",
        title: "Tokyo — choose your group experience",
        summary: "Swap this whole day without breaking the trip spine.",
        category: "CULTURE",
        alternatives: [
          {
            id: "jp2-culture",
            category: "CULTURE",
            title: "Culture day — museums + traditional district",
            summary: "Asakusa / Yanaka style pacing.",
          },
          {
            id: "jp2-faith",
            category: "RELIGIOUS",
            title: "Faith & heritage — temples and shrines",
            summary: "Meiji / Senso-ji focused day.",
            tradeOff: "Replaces museum-heavy culture day.",
          },
          {
            id: "jp2-fun",
            category: "THEME_PARK",
            title: "Family fun — theme park day",
            summary: "Full day out for the group.",
            tradeOff: "Removes one Tokyo sightseeing day.",
            viatorQuery: "Tokyo Disney",
          },
          {
            id: "jp2-relax",
            category: "FREE_TIME",
            title: "Relaxed — gardens + food + free time",
            summary: "Lower walking, more meals.",
          },
        ],
      },
      {
        id: "jp3",
        kind: "anchor",
        dayLabel: "Days 6–8",
        title: "Kyoto base",
        summary: "Temples, districts, and evening food.",
      },
      {
        id: "jp4",
        kind: "flexible",
        dayLabel: "Day 7",
        title: "Kyoto — flexible culture / faith day",
        summary: "Best slot for religious sites without rewriting the trip.",
        category: "RELIGIOUS",
        alternatives: [
          {
            id: "jp4-faith",
            category: "RELIGIOUS",
            title: "Temple & shrine day",
            summary: "Fushimi / Kiyomizu style.",
          },
          {
            id: "jp4-food",
            category: "FOOD",
            title: "Kyoto food crawl",
            summary: "Markets and tasting stops.",
            viatorQuery: "Kyoto food tour",
          },
          {
            id: "jp4-nature",
            category: "NATURE",
            title: "Arashiyama & nature",
            summary: "Bamboo and riverside walks.",
          },
        ],
      },
      {
        id: "jp5",
        kind: "anchor",
        dayLabel: "Days 9–10",
        title: "Osaka finish",
        summary: "Food city energy before departure.",
      },
      {
        id: "jp6",
        kind: "flexible",
        dayLabel: "Day 9",
        title: "Osaka — fun or food",
        summary: "Waterpark / theme park often fits here.",
        category: "FOOD",
        alternatives: [
          {
            id: "jp6-food",
            category: "FOOD",
            title: "Osaka food highlights",
            summary: "Dotonbori and street food.",
            viatorQuery: "Osaka food tour",
          },
          {
            id: "jp6-water",
            category: "WATER_ACTIVITY",
            title: "Waterpark / theme-park day",
            summary: "Full leisure day for the group.",
            tradeOff: "Replaces Osaka sightseeing highlights.",
            viatorQuery: "Osaka Universal",
          },
          {
            id: "jp6-band",
            category: "LIVE_ENTERTAINMENT",
            title: "Evening live entertainment",
            summary: "Reserve the evening block for a band or show.",
            specialProviderRequired: true,
            tradeOff: "Evening only — daytime stays free/flexible.",
          },
        ],
      },
    ],
  },
  {
    id: "jp-highlights",
    slug: "japan-highlights",
    scale: "country",
    title: "Japan Highlights",
    countries: ["Japan"],
    countryCodes: ["JP"],
    days: 14,
    route: "Tokyo → Hakone → Kyoto → Osaka → Hiroshima",
    bestFor: ["Seeing more of Japan"],
    comfort: "active",
    blurb: "More cities, more moving — for travellers who want breadth.",
    savedCount: 1802,
    groupsUsed: 312,
    recommendPercent: 88,
    keptOrderPercent: 61,
    travelledRating: 4.7,
    travelledReviews: 96,
    blocks: [
      {
        id: "jh1",
        kind: "anchor",
        dayLabel: "Days 1–4",
        title: "Tokyo",
        summary: "City base and major sights.",
      },
      {
        id: "jh2",
        kind: "anchor",
        dayLabel: "Days 5–6",
        title: "Hakone",
        summary: "Onsen and mountain air.",
      },
      {
        id: "jh3",
        kind: "flexible",
        dayLabel: "Day 8",
        title: "Kyoto flexible day",
        summary: "Faith, culture, or free time.",
        alternatives: [
          {
            id: "jh3-faith",
            category: "RELIGIOUS",
            title: "Temple circuit",
            summary: "Heritage-focused.",
          },
          {
            id: "jh3-family",
            category: "FAMILY",
            title: "Family-friendly Kyoto",
            summary: "Lighter walking, more breaks.",
          },
        ],
      },
      {
        id: "jh4",
        kind: "anchor",
        dayLabel: "Days 10–11",
        title: "Osaka",
        summary: "Food and nightlife energy.",
      },
      {
        id: "jh5",
        kind: "anchor",
        dayLabel: "Days 12–14",
        title: "Hiroshima & return",
        summary: "History day + buffer.",
      },
    ],
  },
  {
    id: "jp-relaxed",
    slug: "relaxed-japan",
    scale: "country",
    title: "Relaxed Japan",
    countries: ["Japan"],
    countryCodes: ["JP"],
    days: 14,
    route: "Tokyo → Kyoto → Osaka",
    bestFor: ["Couples", "Groups", "Less hotel hopping"],
    comfort: "relaxed",
    blurb: "Same classic cities, fewer moves, more breathing room.",
    savedCount: 1560,
    groupsUsed: 401,
    recommendPercent: 93,
    keptOrderPercent: 74,
    travelledRating: 4.9,
    travelledReviews: 210,
    blocks: [
      {
        id: "jr1",
        kind: "anchor",
        dayLabel: "Days 1–5",
        title: "Tokyo slow",
        summary: "Fewer hotels, deeper neighbourhoods.",
      },
      {
        id: "jr2",
        kind: "flexible",
        dayLabel: "Day 4",
        title: "Open experience day",
        summary: "Religious, food, or free time.",
        alternatives: [
          {
            id: "jr2-faith",
            category: "RELIGIOUS",
            title: "Spiritual morning + free afternoon",
            summary: "One shrine district, then rest.",
          },
          {
            id: "jr2-food",
            category: "FOOD",
            title: "Food-focused day",
            summary: "Markets and reservations.",
            viatorQuery: "Tokyo food tour",
          },
          {
            id: "jr2-private",
            category: "PRIVATE_GROUP_EVENT",
            title: "Private group dinner night",
            summary: "Reserve evening for celebration.",
            specialProviderRequired: true,
          },
        ],
      },
      {
        id: "jr3",
        kind: "anchor",
        dayLabel: "Days 6–10",
        title: "Kyoto slow",
        summary: "Temples without rushing.",
      },
      {
        id: "jr4",
        kind: "anchor",
        dayLabel: "Days 11–14",
        title: "Osaka unwind",
        summary: "Food and optional day trip.",
      },
    ],
  },
  {
    id: "jp-kr-essentials",
    slug: "japan-korea-essentials",
    scale: "multi_country",
    title: "Japan + Korea Essentials",
    countries: ["Japan", "South Korea"],
    countryCodes: ["JP", "KR"],
    days: 14,
    route: "Tokyo → Kyoto → Osaka → Seoul",
    bestFor: ["Two countries", "First timers", "Cities + food"],
    comfort: "balanced",
    blurb: "A clean multi-country spine — Japan classics then Seoul.",
    savedCount: 980,
    groupsUsed: 156,
    recommendPercent: 89,
    keptOrderPercent: 70,
    travelledRating: 4.7,
    travelledReviews: 72,
    blocks: [
      {
        id: "jk1",
        kind: "anchor",
        dayLabel: "Days 1–4",
        title: "Tokyo",
        summary: "Japan start.",
      },
      {
        id: "jk2",
        kind: "anchor",
        dayLabel: "Days 5–7",
        title: "Kyoto",
        summary: "Heritage core.",
      },
      {
        id: "jk3",
        kind: "flexible",
        dayLabel: "Day 6",
        title: "Kyoto flexible",
        summary: "Faith or culture.",
        alternatives: [
          {
            id: "jk3-faith",
            category: "RELIGIOUS",
            title: "Temple & shrine day",
            summary: "Heritage focus.",
          },
          {
            id: "jk3-culture",
            category: "CULTURE",
            title: "District walking + crafts",
            summary: "Gion / Nishiki style.",
          },
        ],
      },
      {
        id: "jk4",
        kind: "anchor",
        dayLabel: "Days 8–9",
        title: "Osaka",
        summary: "Food bridge before Korea.",
      },
      {
        id: "jk5",
        kind: "flexible",
        dayLabel: "Day 9",
        title: "Osaka fun slot",
        summary: "Waterpark or food.",
        alternatives: [
          {
            id: "jk5-water",
            category: "WATER_ACTIVITY",
            title: "Theme park / water day",
            summary: "Full leisure day.",
            tradeOff: "Drops Osaka highlights.",
            viatorQuery: "Osaka Universal",
          },
          {
            id: "jk5-food",
            category: "FOOD",
            title: "Osaka food day",
            summary: "Keep the food capital focus.",
          },
        ],
      },
      {
        id: "jk6",
        kind: "anchor",
        dayLabel: "Days 10–14",
        title: "Seoul",
        summary: "Korea finish.",
      },
      {
        id: "jk7",
        kind: "special",
        dayLabel: "Day 14 evening",
        title: "Optional group entertainment",
        summary: "Band / private dinner — provider may be required.",
        specialProviderRequired: true,
        category: "LIVE_ENTERTAINMENT",
        alternatives: [
          {
            id: "jk7-band",
            category: "LIVE_ENTERTAINMENT",
            title: "Private live entertainment evening",
            summary: "Time reserved; supplier confirmed later.",
            specialProviderRequired: true,
          },
          {
            id: "jk7-dinner",
            category: "PRIVATE_GROUP_EVENT",
            title: "Private group dinner",
            summary: "Celebration night.",
            specialProviderRequired: true,
          },
          {
            id: "jk7-skip",
            category: "FREE_TIME",
            title: "Free evening",
            summary: "No special booking.",
          },
        ],
      },
    ],
  },
  {
    id: "jp-kr-food",
    slug: "japan-korea-food",
    scale: "multi_country",
    title: "Japan + Korea Food Trip",
    countries: ["Japan", "South Korea"],
    countryCodes: ["JP", "KR"],
    days: 16,
    route: "Tokyo → Osaka → Kyoto → Seoul → Busan",
    bestFor: ["Food travellers", "Groups"],
    comfort: "balanced",
    blurb: "Built around meals and markets — cities chosen for eating well.",
    savedCount: 640,
    groupsUsed: 88,
    recommendPercent: 90,
    keptOrderPercent: 66,
    blocks: [
      {
        id: "jf1",
        kind: "anchor",
        dayLabel: "Days 1–4",
        title: "Tokyo food base",
        summary: "Neighbourhood eating.",
        viatorQuery: "Tokyo food tour",
        viatorCitySlug: "new-york",
      },
      {
        id: "jf2",
        kind: "anchor",
        dayLabel: "Days 5–7",
        title: "Osaka",
        summary: "Street food capital energy.",
      },
      {
        id: "jf3",
        kind: "anchor",
        dayLabel: "Days 8–10",
        title: "Kyoto",
        summary: "Kaiseki and markets.",
      },
      {
        id: "jf4",
        kind: "anchor",
        dayLabel: "Days 11–14",
        title: "Seoul",
        summary: "BBQ, markets, late nights.",
      },
      {
        id: "jf5",
        kind: "anchor",
        dayLabel: "Days 15–16",
        title: "Busan",
        summary: "Seafood finish.",
      },
    ],
  },
  {
    id: "jp-kr-relaxed",
    slug: "relaxed-japan-korea",
    scale: "multi_country",
    title: "Relaxed Japan + Korea",
    countries: ["Japan", "South Korea"],
    countryCodes: ["JP", "KR"],
    days: 18,
    route: "Tokyo → Kyoto → Seoul",
    bestFor: ["Couples", "Less moving"],
    comfort: "relaxed",
    blurb: "Three cities only — more nights, less luggage stress.",
    savedCount: 520,
    groupsUsed: 74,
    recommendPercent: 92,
    keptOrderPercent: 78,
    blocks: [
      {
        id: "jkr1",
        kind: "anchor",
        dayLabel: "Days 1–6",
        title: "Tokyo",
        summary: "Long Tokyo stay.",
      },
      {
        id: "jkr2",
        kind: "anchor",
        dayLabel: "Days 7–12",
        title: "Kyoto",
        summary: "Slow heritage.",
      },
      {
        id: "jkr3",
        kind: "anchor",
        dayLabel: "Days 13–18",
        title: "Seoul",
        summary: "Korea without rushing.",
      },
    ],
  },
  {
    id: "nyc-4",
    slug: "new-york-4-days",
    scale: "city",
    title: "New York — 4 Days",
    countries: ["United States"],
    countryCodes: ["US"],
    days: 4,
    route: "Manhattan core",
    bestFor: ["First NYC visit", "Weekenders"],
    comfort: "balanced",
    blurb: "A proven Manhattan skeleton with flexible fun/faith/food days.",
    savedCount: 3100,
    groupsUsed: 620,
    recommendPercent: 90,
    keptOrderPercent: 71,
    travelledRating: 4.8,
    travelledReviews: 240,
    blocks: [
      {
        id: "nyc1",
        kind: "anchor",
        dayLabel: "Day 1",
        title: "Midtown icons",
        summary: "Skyline and core landmarks.",
        viatorQuery: "Empire State",
        viatorCitySlug: "new-york",
      },
      {
        id: "nyc2",
        kind: "flexible",
        dayLabel: "Day 2",
        title: "Downtown / harbor day",
        summary: "Liberty area or culture swap.",
        alternatives: [
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
        viatorQuery: "Statue of Liberty",
        viatorCitySlug: "new-york",
      },
      {
        id: "nyc3",
        kind: "flexible",
        dayLabel: "Day 3",
        title: "Park + museums or free time",
        summary: "Central Park belt.",
        alternatives: [
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
      },
      {
        id: "nyc4",
        kind: "anchor",
        dayLabel: "Day 4",
        title: "Neighbourhoods + departure buffer",
        summary: "Brooklyn or Upper West — keep it light.",
      },
    ],
  },
  {
    id: "nyc-shinjuku-style",
    slug: "midtown-hotel-3-days",
    scale: "hotel_area",
    title: "3 Days in NYC from Midtown",
    countries: ["United States"],
    countryCodes: ["US"],
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
      {
        id: "mh1",
        kind: "anchor",
        dayLabel: "Day 1",
        title: "Walkable Midtown",
        summary: "Icons within short transit of the hotel.",
        fromHotelMinutes: 15,
      },
      {
        id: "mh2",
        kind: "flexible",
        dayLabel: "Day 2",
        title: "Choose downtown or leisure",
        summary: "Harbor sights or a fun day.",
        fromHotelMinutes: 35,
        alternatives: [
          {
            id: "mh2-sights",
            category: "SIGHTS",
            title: "Harbor / Liberty day",
            summary: "Plan transit once, stay downtown.",
            viatorQuery: "Statue of Liberty",
          },
          {
            id: "mh2-fun",
            category: "FAMILY",
            title: "Family leisure day",
            summary: "Lower-stress pacing.",
          },
        ],
      },
      {
        id: "mh3",
        kind: "anchor",
        dayLabel: "Day 3",
        title: "Park morning + buffer",
        summary: "Finish near the hotel.",
        fromHotelMinutes: 20,
      },
    ],
  },
  // —— I'm Here Now: Seneca Niagara ——
  {
    id: "niagara-essentials-4h",
    slug: "niagara-essentials-from-seneca",
    scale: "here_now",
    title: "Niagara Falls Essentials",
    countries: ["United States"],
    countryCodes: ["US"],
    days: 1,
    route: "From Seneca Niagara Resort",
    bestFor: ["First-time visitors", "Half day"],
    comfort: "balanced",
    blurb: "A sensible 4–6 hour loop from the resort — viewpoints first, optional paid experience.",
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
      {
        id: "nf1",
        kind: "anchor",
        dayLabel: "Start",
        title: "Leave the resort",
        summary: "Short hop to the state park.",
        fromHotelMinutes: 8,
        durationHours: 0.25,
        free: true,
      },
      {
        id: "nf2",
        kind: "anchor",
        dayLabel: "Morning",
        title: "Niagara Falls State Park viewpoints",
        summary: "Free views — the main reason you're here.",
        fromHotelMinutes: 10,
        durationHours: 1.5,
        walking: "moderate",
        free: true,
        category: "SIGHTS",
      },
      {
        id: "nf3",
        kind: "flexible",
        dayLabel: "Midday",
        title: "Optional Falls experience",
        summary: "Paid boat/deck experience if season and budget allow.",
        fromHotelMinutes: 12,
        durationHours: 1.5,
        free: false,
        viatorQuery: "Niagara Falls",
        viatorCitySlug: "new-york",
        alternatives: [
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
      },
      {
        id: "nf4",
        kind: "anchor",
        dayLabel: "Afternoon",
        title: "Goat Island",
        summary: "Grouped stops so you're not zigzagging.",
        fromHotelMinutes: 15,
        durationHours: 1.5,
        walking: "moderate",
        free: true,
      },
      {
        id: "nf5",
        kind: "anchor",
        dayLabel: "Return",
        title: "Back toward the resort",
        summary: "Aim to finish near the hotel mid-afternoon.",
        fromHotelMinutes: 10,
        free: true,
      },
    ],
  },
  {
    id: "niagara-full-day",
    slug: "niagara-full-day-from-seneca",
    scale: "here_now",
    title: "Full Niagara Falls Day",
    countries: ["United States"],
    countryCodes: ["US"],
    days: 1,
    route: "From Seneca Niagara Resort",
    bestFor: ["Full day", "First timers"],
    comfort: "active",
    blurb: "Eight-hour plan with lunch buffer and optional paid experiences.",
    savedCount: 380,
    groupsUsed: 70,
    recommendPercent: 91,
    keptOrderPercent: 75,
    timeBuckets: ["full_day"],
    moods: ["famous", "family", "exciting"],
    hotelAnchor: {
      id: "seneca-niagara",
      name: "Seneca Niagara Resort & Casino",
      area: "Niagara Falls, NY",
      lat: 43.0851,
      lng: -79.0686,
    },
    blocks: [
      {
        id: "nfd1",
        kind: "anchor",
        dayLabel: "Morning",
        title: "State Park & viewpoints",
        summary: "Free core sights.",
        fromHotelMinutes: 10,
        free: true,
      },
      {
        id: "nfd2",
        kind: "flexible",
        dayLabel: "Late morning",
        title: "Paid adventure block",
        summary: "Boat or cave-style experience when available.",
        viatorQuery: "Niagara Falls",
        viatorCitySlug: "new-york",
        alternatives: [
          {
            id: "nfd2-boat",
            category: "WATER_ACTIVITY",
            title: "Boat / mist experience",
            summary: "High energy.",
            viatorQuery: "Niagara Maid of the Mist",
          },
          {
            id: "nfd2-easy",
            category: "SIGHTS",
            title: "Observation + easy walks",
            summary: "Lower intensity.",
          },
        ],
      },
      {
        id: "nfd3",
        kind: "anchor",
        dayLabel: "Lunch",
        title: "Lunch near the falls",
        summary: "Reset before Goat Island.",
        free: false,
        category: "FOOD",
      },
      {
        id: "nfd4",
        kind: "anchor",
        dayLabel: "Afternoon",
        title: "Goat Island & return",
        summary: "Finish facing the hotel area.",
        fromHotelMinutes: 15,
        free: true,
      },
    ],
  },
  {
    id: "niagara-evening",
    slug: "niagara-first-evening-from-seneca",
    scale: "here_now",
    title: "Niagara First Evening",
    countries: ["United States"],
    countryCodes: ["US"],
    days: 1,
    route: "From Seneca Niagara Resort",
    bestFor: ["Check-in afternoon", "Rest of today"],
    comfort: "relaxed",
    blurb: "Checked in at 3–4 p.m.? Viewpoints, dinner, illuminated falls — back at the resort.",
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
      {
        id: "ne1",
        kind: "anchor",
        dayLabel: "4:30",
        title: "Falls viewpoints",
        summary: "Short walk from the resort.",
        fromHotelMinutes: 10,
        durationHours: 1,
        free: true,
        walking: "low",
      },
      {
        id: "ne2",
        kind: "anchor",
        dayLabel: "5:30",
        title: "Goat Island stroll",
        summary: "Easy pacing after travel day.",
        fromHotelMinutes: 15,
        durationHours: 1,
        free: true,
        walking: "moderate",
      },
      {
        id: "ne3",
        kind: "flexible",
        dayLabel: "7:00",
        title: "Dinner",
        summary: "Near hotel or falls strip.",
        category: "FOOD",
        fromHotelMinutes: 8,
        alternatives: [
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
            summary: "More atmosphere, slightly further.",
          },
        ],
      },
      {
        id: "ne4",
        kind: "anchor",
        dayLabel: "8:30",
        title: "Illuminated Falls",
        summary: "Night views — free.",
        fromHotelMinutes: 10,
        free: true,
      },
      {
        id: "ne5",
        kind: "anchor",
        dayLabel: "10:00",
        title: "Back at resort",
        summary: "Casino / rest.",
        fromHotelMinutes: 5,
        free: true,
      },
    ],
  },
  {
    id: "niagara-easy-evening",
    slug: "niagara-easy-evening-from-seneca",
    scale: "here_now",
    title: "Easy Evening",
    countries: ["United States"],
    countryCodes: ["US"],
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
      {
        id: "nee1",
        kind: "anchor",
        dayLabel: "Now",
        title: "Short falls viewpoint walk",
        summary: "~10 minutes from hotel.",
        fromHotelMinutes: 10,
        free: true,
        walking: "low",
      },
      {
        id: "nee2",
        kind: "anchor",
        dayLabel: "Dinner",
        title: "Dinner",
        summary: "Keep it close.",
        fromHotelMinutes: 5,
        category: "FOOD",
      },
      {
        id: "nee3",
        kind: "anchor",
        dayLabel: "Night",
        title: "Viewpoints + resort",
        summary: "Optional illuminated falls, then casino/rest.",
        fromHotelMinutes: 10,
        free: true,
      },
    ],
  },
  {
    id: "niagara-adventure-evening",
    slug: "niagara-adventure-evening-from-seneca",
    scale: "here_now",
    title: "Adventure Evening",
    countries: ["United States"],
    countryCodes: ["US"],
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
      {
        id: "nae1",
        kind: "flexible",
        dayLabel: "Late afternoon",
        title: "Falls experience",
        summary: "Bookable adventure if available.",
        viatorQuery: "Niagara Falls",
        viatorCitySlug: "new-york",
        alternatives: [
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
      },
      {
        id: "nae2",
        kind: "anchor",
        dayLabel: "Dinner",
        title: "Dinner",
        summary: "Refuel.",
        category: "FOOD",
        fromHotelMinutes: 10,
      },
      {
        id: "nae3",
        kind: "anchor",
        dayLabel: "Night",
        title: "Night views",
        summary: "Illuminated falls, return to resort.",
        free: true,
        fromHotelMinutes: 10,
      },
    ],
  },
  {
    id: "niagara-tomorrow-morning",
    slug: "niagara-morning-before-checkout",
    scale: "here_now",
    title: "Tomorrow Morning Before Checkout",
    countries: ["United States"],
    countryCodes: ["US"],
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
      {
        id: "nm1",
        kind: "anchor",
        dayLabel: "Morning",
        title: "Falls viewpoints",
        summary: "Best light, short walk.",
        fromHotelMinutes: 10,
        free: true,
        walking: "low",
      },
      {
        id: "nm2",
        kind: "anchor",
        dayLabel: "Return",
        title: "Back for checkout",
        summary: "Buffer for luggage.",
        fromHotelMinutes: 8,
        free: true,
      },
    ],
  },
];

export function getTemplateBySlug(slug: string) {
  return tripTemplates.find((t) => t.slug === slug || t.id === slug) || null;
}

export function listTemplates(filters?: {
  scale?: TemplateScale | "all";
  countries?: string[];
  hotelId?: string;
  timeBucket?: string;
  mood?: string;
}) {
  return tripTemplates.filter((t) => {
    if (filters?.scale && filters.scale !== "all" && t.scale !== filters.scale)
      return false;
    if (filters?.countries?.length) {
      const codes = filters.countries.map((c) => c.toUpperCase());
      const ok = codes.every((c) => t.countryCodes.includes(c));
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
    return true;
  });
}

export function combineCountryTemplates(codes: string[]) {
  const normalized = [...new Set(codes.map((c) => c.toUpperCase()))];
  if (normalized.length <= 1) {
    return listTemplates({
      scale: "country",
      countries: normalized,
    }).concat(listTemplates({ scale: "multi_country", countries: normalized }));
  }
  return listTemplates({ scale: "multi_country", countries: normalized });
}

export type AppliedSwap = {
  blockId: string;
  optionId: string;
};

export type PersonalizeResult = {
  template: TripTemplate;
  applied: AppliedSwap[];
  messages: string[];
  tradeOffs: string[];
  specialEvents: Array<{ blockId: string; title: string; note: string }>;
};

/** Apply experience categories onto flexible/special blocks. */
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
    applied.push({ blockId: block.id, optionId: match.id });
    if (match.tradeOff) tradeOffs.push(match.tradeOff);
    messages.push(
      `${block.dayLabel}: “${block.title}” becomes “${match.title}”.`,
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
      `Could not auto-fit ${experienceCategoryLabel[left]} without extending the trip — add a day or replace another flexible block.`,
    );
  }

  if (wants.length && !tradeOffs.length && applied.length) {
    messages.unshift("We can fit your selections without extending the trip.");
  }

  return {
    template: { ...template, blocks },
    applied,
    messages,
    tradeOffs,
    specialEvents,
  };
}

export function suggestAddCountry(template: TripTemplate, code: string) {
  const hint = template.addCountryHints?.find(
    (h) => h.code.toUpperCase() === code.toUpperCase(),
  );
  if (hint) {
    return {
      country: hint.country,
      code: hint.code,
      recommendedDays: [
        template.days + hint.recommendedExtraDays[0],
        template.days + hint.recommendedExtraDays[1],
      ] as [number, number],
      suggestedRoute: hint.suggestedRoute,
      relatedTemplates: combineCountryTemplates([
        ...template.countryCodes,
        hint.code,
      ]),
    };
  }
  return {
    country: code,
    code,
    recommendedDays: [template.days + 3, template.days + 5] as [number, number],
    suggestedRoute: `${template.route} → (add ${code})`,
    relatedTemplates: combineCountryTemplates([
      ...template.countryCodes,
      code,
    ]),
  };
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
