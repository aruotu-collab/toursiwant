import type { PulseZoneId } from "@/lib/tour-pulse";

export type NearMePlace = {
  id: string;
  name: string;
  aliases: string[];
  zoneId: PulseZoneId;
  /** 0–1 along the corridor spine */
  t: number;
  blurb: string;
};

export type BoardingKind =
  | "hop_on_bus"
  | "walking_meetup"
  | "hotel_pickup"
  | "cruise_terminal";

export type BoardingStop = {
  id: string;
  name: string;
  kind: BoardingKind;
  zoneId: PulseZoneId;
  t: number;
  addressHint: string;
  howToBoard: string;
  operatorsHint?: string;
  /** Approximate walk minutes from place id → minutes */
  walkFrom: Record<string, number>;
};

export const boardingKindLabel: Record<BoardingKind, string> = {
  hop_on_bus: "Hop-on bus",
  walking_meetup: "Walking meetup",
  hotel_pickup: "Hotel pickup",
  cruise_terminal: "Cruise terminal",
};

/** Hotels & landmarks travellers actually type. */
export const nearMePlaces: NearMePlace[] = [
  {
    id: "aliz-hotel",
    name: "Aliz Hotel Times Square",
    aliases: ["aliz", "aliz hotel", "aliz times square", "320 w 40"],
    zoneId: "midtown",
    t: 0.4,
    blurb: "Midtown West · near Port Authority & Times Square bus belt",
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
    blurb: "Midtown East edge · short walk to many tour pickups",
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

/**
 * Public boarding / meetup points — not exact GPS pins.
 * Walk times are approximate for “where do I enter the bus?” clarity.
 */
export const boardingStops: BoardingStop[] = [
  {
    id: "bus-port-authority",
    name: "Port Authority / 8th Ave hop-on",
    kind: "hop_on_bus",
    zoneId: "midtown",
    t: 0.395,
    addressHint: "8th Avenue near W 40–42nd (Port Authority belt)",
    howToBoard:
      "Look for double-decker hop-on buses on 8th Ave. Staff usually board at marked stop flags — bring ticket QR or join on-site if seats remain.",
    operatorsHint: "Top View · Big Bus style routes",
    walkFrom: {
      "aliz-hotel": 4,
      "times-square": 8,
      "bryant-park": 12,
    },
  },
  {
    id: "bus-times-square",
    name: "Times Square hop-on stop",
    kind: "hop_on_bus",
    zoneId: "midtown",
    t: 0.42,
    addressHint: "Times Square / Broadway & 7th Ave visitor belt",
    howToBoard:
      "Follow hop-on / hop-off stop signs near the square. Buses loop Midtown — confirm your route colour before boarding.",
    operatorsHint: "Top View · CitySightseeing style loops",
    walkFrom: {
      "aliz-hotel": 9,
      "times-square": 2,
      "bryant-park": 10,
    },
  },
  {
    id: "bus-bryant",
    name: "Bryant Park / 42nd St hop-on",
    kind: "hop_on_bus",
    zoneId: "midtown",
    t: 0.445,
    addressHint: "W 42nd Street near Bryant Park / 5th–6th Ave",
    howToBoard:
      "East-side Midtown stop for red/blue style hop-on loops. Check the next bus board time on the stop totem.",
    operatorsHint: "Hop-on Midtown loop",
    walkFrom: {
      "aliz-hotel": 14,
      "times-square": 11,
      "bryant-park": 3,
    },
  },
  {
    id: "bus-battery",
    name: "Battery Park hop-on / harbor loop",
    kind: "hop_on_bus",
    zoneId: "lower-manhattan",
    t: 0.24,
    addressHint: "Battery Park / State Street visitor approaches",
    howToBoard:
      "Downtown hop-on for harbor & Lower Manhattan loops. Good if you’re already near Liberty / Wall Street walks.",
    operatorsHint: "Downtown hop-on loop",
    walkFrom: {
      "battery-park": 3,
      "manhattan-cruise": 25,
    },
  },
  {
    id: "walk-battery",
    name: "Battery Park walking meetup",
    kind: "walking_meetup",
    zoneId: "lower-manhattan",
    t: 0.25,
    addressHint: "Battery Park · Castle Clinton area",
    howToBoard:
      "Meet your walking guide at the park edge — look for ToursIWant / operator signage at the published meetup time.",
    walkFrom: {
      "battery-park": 1,
      "manhattan-cruise": 22,
    },
  },
  {
    id: "pickup-midtown-hotels",
    name: "Midtown hotel lobby pickup belt",
    kind: "hotel_pickup",
    zoneId: "midtown",
    t: 0.41,
    addressHint: "Hotel lobbies Times Square → Bryant Park",
    howToBoard:
      "Private and shared drivers stage at hotel lobbies. Tell the operator your hotel name when you request.",
    walkFrom: {
      "aliz-hotel": 0,
      "times-square": 5,
      "bryant-park": 8,
    },
  },
  {
    id: "cruise-manhattan",
    name: "Manhattan Cruise Terminal pickup",
    kind: "cruise_terminal",
    zoneId: "harbor",
    t: 0.08,
    addressHint: "Piers 88–92 · 12th Ave / W 46–54th",
    howToBoard:
      "Shore operators meet outside the terminal doors with name boards. Keep your all-aboard time visible.",
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
    zoneId: "brooklyn",
    t: 0.76,
    addressHint: "Brooklyn Bridge Park / Washington St area",
    howToBoard:
      "Food and street-art groups meet on the waterfront path — confirm the exact corner in your quote.",
    walkFrom: {
      dumbo: 2,
    },
  },
  {
    id: "walk-met",
    name: "The Met front steps meetup",
    kind: "walking_meetup",
    zoneId: "central-park",
    t: 0.58,
    addressHint: "5th Avenue museum entrance",
    howToBoard:
      "Museum tours usually meet on the front steps before ticket line — arrive 10 minutes early.",
    walkFrom: {
      "met-museum": 1,
    },
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
  kind?: BoardingKind | "all",
): Array<BoardingStop & { walkMinutes: number }> {
  return boardingStops
    .map((stop) => {
      const walkMinutes = stop.walkFrom[placeId];
      if (walkMinutes === undefined) return null;
      if (kind && kind !== "all" && stop.kind !== kind) return null;
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
