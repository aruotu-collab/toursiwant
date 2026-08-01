import type { PulseCategory, PulseZoneId } from "@/lib/tour-pulse";

export type NearMePlace = {
  id: string;
  name: string;
  aliases: string[];
  zoneId: PulseZoneId;
  /** 0–1 along the corridor spine */
  t: number;
  blurb: string;
};

/** What travellers pick after saying where they stay. */
export type ExperienceType =
  | "all"
  | "bus"
  | "museum"
  | "pizza"
  | "chinese"
  | "food"
  | "walking"
  | "pickup"
  | "cruise";

export const experienceTypeTabs: {
  id: ExperienceType;
  label: string;
  /** Maps to pulse activity categories (and soft title matching). */
  categories?: PulseCategory[];
  titleHints?: string[];
}[] = [
  { id: "all", label: "All nearby" },
  { id: "bus", label: "Bus tours", categories: ["bus"] },
  {
    id: "museum",
    label: "Museums",
    categories: ["museum", "tour"],
    titleHints: ["museum", "met", "gallery"],
  },
  {
    id: "pizza",
    label: "Pizza",
    categories: ["food"],
    titleHints: ["pizza", "slice"],
  },
  {
    id: "chinese",
    label: "Chinese food",
    categories: ["food", "tour"],
    titleHints: ["chinese", "chinatown", "dumpling"],
  },
  {
    id: "food",
    label: "Food tours",
    categories: ["food", "tour"],
    titleHints: ["food", "taste", "crawl", "eat"],
  },
  {
    id: "walking",
    label: "Walking",
    categories: ["tour", "joinable"],
    titleHints: ["walk", "highlights", "street"],
  },
  { id: "pickup", label: "Pickups", categories: ["pickup"] },
  { id: "cruise", label: "Cruise", categories: ["cruise"] },
];

export const experienceTypeColor: Record<ExperienceType, string> = {
  all: "#d4a017",
  bus: "#f97316",
  museum: "#5b9bd5",
  pizza: "#ef4444",
  chinese: "#f59e0b",
  food: "#fb7185",
  walking: "#86efac",
  pickup: "#d4a017",
  cruise: "#7dd3c0",
};

export type BoardingKind =
  | "hop_on_bus"
  | "walking_meetup"
  | "hotel_pickup"
  | "cruise_terminal"
  | "food_spot"
  | "museum_spot";

export type BoardingStop = {
  id: string;
  name: string;
  kind: BoardingKind;
  experienceTypes: ExperienceType[];
  zoneId: PulseZoneId;
  t: number;
  addressHint: string;
  howToBoard: string;
  operatorsHint?: string;
  walkFrom: Record<string, number>;
};

export const boardingKindLabel: Record<BoardingKind, string> = {
  hop_on_bus: "Hop-on bus",
  walking_meetup: "Walking meetup",
  hotel_pickup: "Hotel pickup",
  cruise_terminal: "Cruise terminal",
  food_spot: "Food nearby",
  museum_spot: "Museum",
};

/** Hotels & stays travellers actually type. */
export const nearMePlaces: NearMePlace[] = [
  {
    id: "aliz-hotel",
    name: "Aliz Hotel Times Square",
    aliases: ["aliz", "aliz hotel", "aliz times square", "320 w 40"],
    zoneId: "midtown",
    t: 0.4,
    blurb: "Midtown West · bus belt, pizza slices, and theater walks",
  },
  {
    id: "times-square",
    name: "Times Square",
    aliases: ["times sq", "42nd", "broadway midtown"],
    zoneId: "midtown",
    t: 0.42,
    blurb: "Core Midtown hub for hop-on buses and evening walks",
  },
  {
    id: "bryant-park",
    name: "Bryant Park",
    aliases: ["bryant", "library", "5th ave midtown"],
    zoneId: "midtown",
    t: 0.44,
    blurb: "Midtown East edge · museums a short hop north",
  },
  {
    id: "battery-park",
    name: "Battery Park",
    aliases: ["battery", "harbor park", "castle clinton"],
    zoneId: "lower-manhattan",
    t: 0.24,
    blurb: "Classic meetup for Lower Manhattan & Liberty views",
  },
  {
    id: "dumbo",
    name: "DUMBO / Brooklyn Bridge Park",
    aliases: ["dumbo", "brooklyn bridge park", "brooklyn waterfront"],
    zoneId: "brooklyn",
    t: 0.76,
    blurb: "Brooklyn waterfront · food crawls and street-art starts",
  },
  {
    id: "met-museum",
    name: "The Met / Upper East Side",
    aliases: ["met", "metropolitan museum", "upper east", "5th avenue museum"],
    zoneId: "central-park",
    t: 0.58,
    blurb: "Museum mile · Central Park belt meetups",
  },
  {
    id: "chinatown-stay",
    name: "Chinatown / Little Italy",
    aliases: ["chinatown", "little italy", "canal street"],
    zoneId: "lower-manhattan",
    t: 0.28,
    blurb: "Downtown food belt · Chinese restaurants and walking tours",
  },
  {
    id: "jfk",
    name: "JFK Airport",
    aliases: ["jfk", "kennedy", "terminal 4"],
    zoneId: "airports",
    t: 0.92,
    blurb: "Shared Manhattan transfers stage from the terminals",
  },
  {
    id: "manhattan-cruise",
    name: "Manhattan Cruise Terminal",
    aliases: ["cruise terminal", "pier 88", "pier 90", "passenger ship"],
    zoneId: "harbor",
    t: 0.08,
    blurb: "Shore excursion pickups with return-to-ship buffers",
  },
];

export const boardingStops: BoardingStop[] = [
  {
    id: "bus-port-authority",
    name: "Port Authority / 8th Ave hop-on",
    kind: "hop_on_bus",
    experienceTypes: ["bus"],
    zoneId: "midtown",
    t: 0.395,
    addressHint: "8th Avenue near W 40–42nd (Port Authority belt)",
    howToBoard:
      "Look for double-decker hop-on buses on 8th Ave. Staff usually board at marked stop flags.",
    operatorsHint: "Top View · Big Bus style routes",
    walkFrom: { "aliz-hotel": 4, "times-square": 8, "bryant-park": 12 },
  },
  {
    id: "bus-times-square",
    name: "Times Square hop-on stop",
    kind: "hop_on_bus",
    experienceTypes: ["bus"],
    zoneId: "midtown",
    t: 0.42,
    addressHint: "Times Square / Broadway & 7th Ave visitor belt",
    howToBoard:
      "Follow hop-on / hop-off stop signs near the square. Confirm your route colour before boarding.",
    operatorsHint: "Top View · CitySightseeing style loops",
    walkFrom: { "aliz-hotel": 9, "times-square": 2, "bryant-park": 10 },
  },
  {
    id: "pizza-joe",
    name: "Joe’s Pizza · Midtown slice run",
    kind: "food_spot",
    experienceTypes: ["pizza", "food"],
    zoneId: "midtown",
    t: 0.415,
    addressHint: "Classic NYC slice shops around Times Square / 8th Ave",
    howToBoard:
      "Not a tour bus — a nearby food stop. Join a pizza crawl or grab a slice on the walk to your bus stop.",
    walkFrom: { "aliz-hotel": 7, "times-square": 5, "bryant-park": 12 },
  },
  {
    id: "pizza-two-boots",
    name: "Midtown pizza crawl meetup",
    kind: "food_spot",
    experienceTypes: ["pizza", "food"],
    zoneId: "midtown",
    t: 0.43,
    addressHint: "Restaurant row near 9th Ave / Hell’s Kitchen edge",
    howToBoard:
      "Food tours often meet outside the first pizzeria — confirm the corner in your quote.",
    walkFrom: { "aliz-hotel": 11, "times-square": 10 },
  },
  {
    id: "chinese-canal",
    name: "Chinatown dumpling / banquet belt",
    kind: "food_spot",
    experienceTypes: ["chinese", "food"],
    zoneId: "lower-manhattan",
    t: 0.28,
    addressHint: "Canal Street / Mott Street restaurant corridor",
    howToBoard:
      "Chinese restaurant and food-tour meetups concentrate here. Short subway or hop-on hop from Midtown hotels.",
    walkFrom: {
      "chinatown-stay": 3,
      "battery-park": 18,
      "aliz-hotel": 28,
      "times-square": 25,
    },
  },
  {
    id: "museum-moma",
    name: "MoMA / Midtown museum hop",
    kind: "museum_spot",
    experienceTypes: ["museum"],
    zoneId: "midtown",
    t: 0.46,
    addressHint: "53rd Street museum belt · MoMA area",
    howToBoard:
      "Museum tours meet at the entrance plaza. From Aliz / Times Square it’s a short Midtown walk or hop-on stop away.",
    walkFrom: { "aliz-hotel": 18, "times-square": 15, "bryant-park": 10 },
  },
  {
    id: "museum-met",
    name: "The Met front steps",
    kind: "museum_spot",
    experienceTypes: ["museum"],
    zoneId: "central-park",
    t: 0.58,
    addressHint: "5th Avenue museum entrance",
    howToBoard:
      "Meet on the front steps before the ticket line — arrive 10 minutes early.",
    walkFrom: { "met-museum": 1, "bryant-park": 25, "aliz-hotel": 35 },
  },
  {
    id: "walk-battery",
    name: "Battery Park walking meetup",
    kind: "walking_meetup",
    experienceTypes: ["walking"],
    zoneId: "lower-manhattan",
    t: 0.25,
    addressHint: "Battery Park · Castle Clinton area",
    howToBoard:
      "Meet your walking guide at the park edge at the published meetup time.",
    walkFrom: { "battery-park": 1, "manhattan-cruise": 22 },
  },
  {
    id: "pickup-midtown-hotels",
    name: "Midtown hotel lobby pickup belt",
    kind: "hotel_pickup",
    experienceTypes: ["pickup"],
    zoneId: "midtown",
    t: 0.41,
    addressHint: "Hotel lobbies Times Square → Bryant Park",
    howToBoard:
      "Private and shared drivers stage at hotel lobbies. Tell the operator your hotel name when you request.",
    walkFrom: { "aliz-hotel": 0, "times-square": 5, "bryant-park": 8 },
  },
  {
    id: "cruise-manhattan",
    name: "Manhattan Cruise Terminal pickup",
    kind: "cruise_terminal",
    experienceTypes: ["cruise"],
    zoneId: "harbor",
    t: 0.08,
    addressHint: "Piers 88–92 · 12th Ave / W 46–54th",
    howToBoard:
      "Shore operators meet outside the terminal doors with name boards.",
    walkFrom: {
      "manhattan-cruise": 0,
      "aliz-hotel": 20,
      "times-square": 18,
    },
  },
  {
    id: "walk-dumbo",
    name: "DUMBO waterfront meetup",
    kind: "walking_meetup",
    experienceTypes: ["walking", "food"],
    zoneId: "brooklyn",
    t: 0.76,
    addressHint: "Brooklyn Bridge Park / Washington St area",
    howToBoard:
      "Food and street-art groups meet on the waterfront path.",
    walkFrom: { dumbo: 2 },
  },
];

export function searchNearMePlaces(query: string, limit = 6): NearMePlace[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return nearMePlaces
    .map((place) => {
      const hay = [place.name, ...place.aliases].join(" ").toLowerCase();
      let score = 0;
      if (hay.startsWith(q) || place.name.toLowerCase().startsWith(q)) score += 40;
      if (hay.includes(q)) score += 20;
      for (const alias of place.aliases) {
        if (alias.includes(q)) score += 10;
      }
      return { place, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.place);
}

export function getNearMePlace(id: string) {
  return nearMePlaces.find((p) => p.id === id);
}

export function stopsNearPlace(
  placeId: string,
  experience: ExperienceType = "all",
): Array<BoardingStop & { walkMinutes: number }> {
  return boardingStops
    .map((stop) => {
      const walkMinutes = stop.walkFrom[placeId];
      if (walkMinutes === undefined) return null;
      if (
        experience !== "all" &&
        !stop.experienceTypes.includes(experience)
      ) {
        return null;
      }
      return { ...stop, walkMinutes };
    })
    .filter((row): row is BoardingStop & { walkMinutes: number } => Boolean(row))
    .sort((a, b) => a.walkMinutes - b.walkMinutes);
}

export function adjacentZones(zoneId: PulseZoneId): PulseZoneId[] {
  const order: PulseZoneId[] = [
    "harbor",
    "lower-manhattan",
    "midtown",
    "central-park",
    "brooklyn",
    "airports",
  ];
  const i = order.indexOf(zoneId);
  if (i < 0) return [zoneId];
  const nearby = [zoneId];
  if (order[i - 1]) nearby.push(order[i - 1]);
  if (order[i + 1]) nearby.push(order[i + 1]);
  return nearby;
}

export function matchesExperienceType(
  activity: { category: PulseCategory; title: string; detail: string },
  experience: ExperienceType,
) {
  if (experience === "all") return true;
  const tab = experienceTypeTabs.find((t) => t.id === experience);
  if (!tab) return true;
  const hay = `${activity.title} ${activity.detail}`.toLowerCase();
  if (tab.titleHints?.some((hint) => hay.includes(hint))) return true;
  if (tab.categories?.includes(activity.category)) {
    // Avoid "museum" filter matching every generic tour unless titled like museum
    if (experience === "museum") {
      return (
        activity.category === "museum" ||
        Boolean(tab.titleHints?.some((hint) => hay.includes(hint)))
      );
    }
    if (experience === "pizza" || experience === "chinese") {
      return Boolean(tab.titleHints?.some((hint) => hay.includes(hint)));
    }
    if (experience === "food") {
      return (
        activity.category === "food" ||
        Boolean(tab.titleHints?.some((hint) => hay.includes(hint)))
      );
    }
    if (experience === "walking") {
      return (
        activity.category === "tour" ||
        activity.category === "joinable" ||
        Boolean(tab.titleHints?.some((hint) => hay.includes(hint)))
      );
    }
    return true;
  }
  return false;
}
