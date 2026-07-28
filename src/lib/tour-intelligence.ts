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
  source?: "mock" | "live";
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
  {
    id: "broadway",
    name: "Broadway & Times Square",
    shortName: "BWAY",
    planned: 31,
    changePct: 9,
    seatsFilling: 54,
    level: "hot",
    window: "this week",
  },
  {
    id: "soho",
    name: "SoHo & Nolita food walks",
    shortName: "SOHO",
    planned: 16,
    changePct: 7,
    seatsFilling: 28,
    level: "rising",
    window: "this week",
  },
  {
    id: "highline",
    name: "High Line & Chelsea",
    shortName: "HLINE",
    planned: 12,
    changePct: 2,
    seatsFilling: 19,
    level: "steady",
    window: "this week",
  },
  {
    id: "cruise",
    name: "Cruise shore excursions",
    shortName: "SHORE",
    planned: 22,
    changePct: 14,
    seatsFilling: 40,
    level: "hot",
    window: "this week",
  },
  {
    id: "lga",
    name: "LaGuardia transfers",
    shortName: "LGA",
    planned: 19,
    changePct: 3,
    seatsFilling: 27,
    level: "open",
    window: "today",
  },
  {
    id: "harbor",
    name: "Harbor & yacht sunsets",
    shortName: "HARBOR",
    planned: 15,
    changePct: 11,
    seatsFilling: 33,
    level: "rising",
    window: "this week",
  },
];

export const activityFeedSeed: ActivityEvent[] = [
  {
    id: "1",
    kind: "planned",
    destination: "The Met Museum",
    detail: "Family of 4 planning a guided visit",
    minutesAgo: 2,
    source: "mock",
  },
  {
    id: "2",
    kind: "joining",
    destination: "Brooklyn food crawl",
    detail: "2 travellers joining a shared group",
    minutesAgo: 5,
    source: "mock",
  },
  {
    id: "3",
    kind: "enquiry",
    destination: "Statue of Liberty",
    detail: "Cruise passenger requesting shore-safe return",
    minutesAgo: 8,
    source: "mock",
  },
  {
    id: "4",
    kind: "quote",
    destination: "Private Midtown driver",
    detail: "Operator sent a same-day quote",
    minutesAgo: 11,
    source: "mock",
  },
  {
    id: "5",
    kind: "planned",
    destination: "Harlem gospel afternoon",
    detail: "Couple planning for next Saturday",
    minutesAgo: 14,
    source: "mock",
  },
  {
    id: "6",
    kind: "joining",
    destination: "Lower Manhattan highlights",
    detail: "1 seat claimed · 2 spaces left",
    minutesAgo: 18,
    source: "mock",
  },
  {
    id: "7",
    kind: "planned",
    destination: "JFK → Manhattan",
    detail: "Arrival transfer planned for Friday",
    minutesAgo: 21,
    source: "mock",
  },
  {
    id: "8",
    kind: "enquiry",
    destination: "Central Park",
    detail: "Custom photography walk requested",
    minutesAgo: 27,
    source: "mock",
  },
  {
    id: "9",
    kind: "joining",
    destination: "Broadway lights evening",
    detail: "3 seats claimed for tonight",
    minutesAgo: 31,
    source: "mock",
  },
  {
    id: "10",
    kind: "planned",
    destination: "SoHo tasting walk",
    detail: "Solo traveller open to shared group",
    minutesAgo: 36,
    source: "mock",
  },
  {
    id: "11",
    kind: "enquiry",
    destination: "Cruise shore Lower Manhattan",
    detail: "Party of 6 · must return by 3:30 p.m.",
    minutesAgo: 42,
    source: "mock",
  },
  {
    id: "12",
    kind: "quote",
    destination: "Private Brooklyn day",
    detail: "Two operator quotes received",
    minutesAgo: 48,
    source: "mock",
  },
  {
    id: "13",
    kind: "planned",
    destination: "Sunset harbor yacht",
    detail: "Anniversary couple booking sunset slot",
    minutesAgo: 55,
    source: "mock",
  },
  {
    id: "14",
    kind: "joining",
    destination: "High Line & Chelsea",
    detail: "2 travellers joined afternoon walk",
    minutesAgo: 63,
    source: "mock",
  },
  {
    id: "15",
    kind: "enquiry",
    destination: "LaGuardia transfer",
    detail: "Flight lands 9:40 p.m. · 3 bags",
    minutesAgo: 70,
    source: "mock",
  },
  {
    id: "16",
    kind: "planned",
    destination: "Chinatown & Little Italy",
    detail: "Food crawl for 5 · gluten-free notes",
    minutesAgo: 78,
    source: "mock",
  },
];

export const marketHeadlines = [
  "Met Museum demand up 12% week over week",
  "18 shore-safe Liberty tours currently planned",
  "Brooklyn food crawl filling for the weekend",
  "42 airport transfers on the board today",
  "Harlem afternoons trending · limited Saturday seats",
  "Broadway evening walks hot · 31 groups planning",
  "Cruise shore requests rising ahead of weekend ships",
  "SoHo tasting seats down to single digits tonight",
  "Sunset yacht cruise watching count above 50",
  "LaGuardia late arrivals driving transfer demand",
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
