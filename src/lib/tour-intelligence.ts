export type DemandLevel = "hot" | "rising" | "steady" | "open";

export type DestinationSignal = {
  id: string;
  name: string;
  shortName: string;
  planned: number;
  changePct: number;
  seatsFilling: number;
  level: DemandLevel;
  window: string;
};

export type ActivityEvent = {
  id: string;
  kind: "planned" | "enquiry" | "joining" | "quote";
  destination: string;
  detail: string;
  minutesAgo: number;
};

export const nycDestinationSignals: DestinationSignal[] = [
  {
    id: "met",
    name: "The Met Museum",
    shortName: "MET",
    planned: 25,
    changePct: 12,
    seatsFilling: 48,
    level: "hot",
    window: "this week",
  },
  {
    id: "liberty",
    name: "Statue of Liberty & Ellis",
    shortName: "LIBERTY",
    planned: 18,
    changePct: 8,
    seatsFilling: 36,
    level: "rising",
    window: "this week",
  },
  {
    id: "brooklyn",
    name: "Brooklyn food & waterfront",
    shortName: "BKLYN",
    planned: 14,
    changePct: 5,
    seatsFilling: 22,
    level: "rising",
    window: "this week",
  },
  {
    id: "central-park",
    name: "Central Park & Midtown",
    shortName: "PARK",
    planned: 21,
    changePct: -3,
    seatsFilling: 31,
    level: "steady",
    window: "this week",
  },
  {
    id: "harlem",
    name: "Harlem culture afternoon",
    shortName: "HARLEM",
    planned: 9,
    changePct: 16,
    seatsFilling: 17,
    level: "hot",
    window: "this week",
  },
  {
    id: "jfk",
    name: "JFK ↔ Manhattan transfers",
    shortName: "JFK",
    planned: 42,
    changePct: 4,
    seatsFilling: 60,
    level: "open",
    window: "today",
  },
];

export const activityFeedSeed: ActivityEvent[] = [
  {
    id: "1",
    kind: "planned",
    destination: "The Met Museum",
    detail: "Family of 4 planning a guided visit",
    minutesAgo: 2,
  },
  {
    id: "2",
    kind: "joining",
    destination: "Brooklyn food crawl",
    detail: "2 travellers joining a shared group",
    minutesAgo: 5,
  },
  {
    id: "3",
    kind: "enquiry",
    destination: "Statue of Liberty",
    detail: "Cruise passenger requesting shore-safe return",
    minutesAgo: 8,
  },
  {
    id: "4",
    kind: "quote",
    destination: "Private Midtown driver",
    detail: "Operator sent a same-day quote",
    minutesAgo: 11,
  },
  {
    id: "5",
    kind: "planned",
    destination: "Harlem gospel afternoon",
    detail: "Couple planning for next Saturday",
    minutesAgo: 14,
  },
  {
    id: "6",
    kind: "joining",
    destination: "Lower Manhattan highlights",
    detail: "1 seat claimed · 2 spaces left",
    minutesAgo: 18,
  },
  {
    id: "7",
    kind: "planned",
    destination: "JFK → Manhattan",
    detail: "Arrival transfer planned for Friday",
    minutesAgo: 21,
  },
  {
    id: "8",
    kind: "enquiry",
    destination: "Central Park",
    detail: "Custom photography walk requested",
    minutesAgo: 27,
  },
];

export const marketHeadlines = [
  "Met Museum demand up 12% week over week",
  "18 shore-safe Liberty tours currently planned",
  "Brooklyn food crawl filling for the weekend",
  "42 airport transfers on the board today",
  "Harlem afternoons trending · limited Saturday seats",
];

export function demandLabel(level: DemandLevel) {
  switch (level) {
    case "hot":
      return "HOT";
    case "rising":
      return "RISING";
    case "steady":
      return "STEADY";
    case "open":
      return "OPEN";
  }
}

export function activityVerb(kind: ActivityEvent["kind"]) {
  switch (kind) {
    case "planned":
      return "PLANNED";
    case "enquiry":
      return "ENQUIRY";
    case "joining":
      return "JOINING";
    case "quote":
      return "QUOTE";
  }
}
