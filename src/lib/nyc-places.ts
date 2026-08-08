import {
  computeTiwScore,
  scoreExplanation,
  type ScoreFactors,
  type ScoreboardLens,
} from "@/lib/tiw-score";
import {
  experienceCategoryLabel,
  type ExperienceCategory,
} from "@/lib/trip-templates";
import { nycExtraPlaces } from "@/lib/places/data/nyc-extra";
import type { CityPlace } from "@/lib/places/types";

export type PlaceTag =
  | "first-time"
  | "family"
  | "couples"
  | "free"
  | "views"
  | "food"
  | "culture"
  | "history"
  | "walking"
  | "photography"
  | "evening"
  | "rainy-day"
  | "nightlife"
  | "shopping"
  | "music";

export type NycPlace = CityPlace;

function place(
  partial: Omit<NycPlace, "id"> & { id?: string },
): NycPlace {
  const id = partial.id || partial.slug;
  return { ...partial, id };
}

/** Curated New York places for the TIW Scoreboard. */
const nycCorePlaces: NycPlace[] = [
  place({
    slug: "statue-of-liberty-ellis-island",
    name: "Statue of Liberty & Ellis Island",
    summary:
      "The defining New York harbor icon — plan ferry timing; worth the logistics for a first visit.",
    neighborhood: "Harbor / Battery",
    cost: "paid",
    typicalCostLabel: "Ferry + grounds from ~$25",
    durationLabel: "3–5 hours",
    bestFor: ["First-time visitors", "History", "Families"],
    tags: ["first-time", "family", "history", "views", "photography"],
    factors: {
      travellerSatisfaction: 96,
      popularity: 98,
      value: 87,
      uniqueness: 98,
      convenience: 82,
      familyAppeal: 90,
      firstTimerValue: 99,
      walkingDemand: 70,
    },
    viatorQuery: "Statue of Liberty",
    whyHigh:
      "Iconic New York experience with very high traveller interest and unmatched first-visit value. Extra time and planning lower convenience.",
  }),
  place({
    slug: "central-park",
    name: "Central Park",
    summary:
      "New York’s great green stage — free, flexible, and excellent for almost every traveller type.",
    neighborhood: "Midtown / UWS / UES",
    cost: "free",
    typicalCostLabel: "Free (rentals extra)",
    durationLabel: "2–4 hours",
    bestFor: ["Everyone", "Families", "Couples"],
    tags: ["first-time", "family", "couples", "free", "walking", "photography"],
    factors: {
      travellerSatisfaction: 95,
      popularity: 97,
      value: 99,
      uniqueness: 90,
      convenience: 92,
      familyAppeal: 96,
      firstTimerValue: 94,
      walkingDemand: 75,
    },
    viatorQuery: "Central Park",
    whyHigh:
      "Free, flexible, and endlessly useful. Near-perfect value and family appeal with room to go deep or keep it light.",
  }),
  place({
    slug: "top-of-the-rock",
    name: "Top of the Rock",
    summary:
      "Clean Midtown skyline views with the Empire State in the frame — often preferred for photos.",
    neighborhood: "Midtown",
    cost: "paid",
    typicalCostLabel: "From ~$40",
    durationLabel: "1–2 hours",
    bestFor: ["Views", "Couples", "First-time visitors"],
    tags: ["first-time", "couples", "views", "photography", "evening"],
    factors: {
      travellerSatisfaction: 93,
      popularity: 94,
      value: 84,
      uniqueness: 88,
      convenience: 88,
      familyAppeal: 86,
      firstTimerValue: 95,
      walkingDemand: 35,
    },
    viatorQuery: "Top of the Rock",
  }),
  place({
    slug: "911-memorial-museum",
    name: "9/11 Memorial & Museum",
    summary:
      "Essential, solemn, and powerfully done — budget emotional energy and time.",
    neighborhood: "Financial District",
    cost: "paid",
    typicalCostLabel: "Memorial free; museum ticketed",
    durationLabel: "2–4 hours",
    bestFor: ["History", "First-time visitors"],
    tags: ["first-time", "history", "culture", "rainy-day"],
    factors: {
      travellerSatisfaction: 94,
      popularity: 92,
      value: 86,
      uniqueness: 96,
      convenience: 84,
      familyAppeal: 72,
      firstTimerValue: 97,
      walkingDemand: 45,
    },
    viatorQuery: "9/11 Memorial",
  }),
  place({
    slug: "brooklyn-bridge",
    name: "Brooklyn Bridge",
    summary:
      "The free skyline walk everyone remembers — go early to beat the selfie scrum.",
    neighborhood: "Lower Manhattan / DUMBO",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "1–2 hours",
    bestFor: ["Free", "Photography", "Walking"],
    tags: [
      "first-time",
      "free",
      "walking",
      "photography",
      "views",
      "couples",
      "history",
    ],
    factors: {
      travellerSatisfaction: 94,
      popularity: 96,
      value: 99,
      uniqueness: 93,
      convenience: 86,
      familyAppeal: 84,
      firstTimerValue: 96,
      walkingDemand: 80,
    },
    viatorQuery: "Brooklyn Bridge",
  }),
  place({
    slug: "broadway-show",
    name: "Broadway show",
    summary:
      "Still the gold-standard New York night — book early for the titles you want.",
    neighborhood: "Theater District",
    cost: "paid",
    typicalCostLabel: "Tickets vary widely",
    durationLabel: "Evening",
    bestFor: ["Evening", "Couples", "Groups"],
    tags: ["first-time", "couples", "evening", "culture", "rainy-day"],
    factors: {
      travellerSatisfaction: 95,
      popularity: 93,
      value: 78,
      uniqueness: 94,
      convenience: 80,
      familyAppeal: 82,
      firstTimerValue: 96,
      walkingDemand: 30,
    },
    viatorQuery: "Broadway",
  }),
  place({
    slug: "the-met",
    name: "The Metropolitan Museum of Art",
    summary:
      "One of the world’s great museums — pick a wing and don’t try to “finish” it.",
    neighborhood: "Upper East Side",
    cost: "paid",
    typicalCostLabel: "Suggested / timed entry",
    durationLabel: "2–4 hours",
    bestFor: ["Art & culture", "Rainy day"],
    tags: ["culture", "rainy-day", "first-time", "family"],
    factors: {
      travellerSatisfaction: 94,
      popularity: 91,
      value: 88,
      uniqueness: 95,
      convenience: 82,
      familyAppeal: 80,
      firstTimerValue: 90,
      walkingDemand: 70,
    },
    viatorQuery: "Metropolitan Museum",
  }),
  place({
    slug: "summit-one-vanderbilt",
    name: "SUMMIT One Vanderbilt",
    summary:
      "Immersive glass-and-mirror observation with serious Midtown drama.",
    neighborhood: "Midtown",
    cost: "paid",
    typicalCostLabel: "From ~$40+",
    durationLabel: "1–2 hours",
    bestFor: ["Views", "Couples", "Photography"],
    tags: ["views", "couples", "photography", "evening", "first-time"],
    factors: {
      travellerSatisfaction: 91,
      popularity: 90,
      value: 80,
      uniqueness: 89,
      convenience: 86,
      familyAppeal: 84,
      firstTimerValue: 88,
      walkingDemand: 30,
    },
    viatorQuery: "SUMMIT One Vanderbilt",
  }),
  place({
    slug: "chelsea-market-high-line",
    name: "Chelsea Market & High Line",
    summary:
      "Food hall fuel plus an elevated park walk — a perfect half-day combo.",
    neighborhood: "Chelsea / Meatpacking",
    cost: "under_50",
    typicalCostLabel: "Park free; food extra",
    durationLabel: "2–3 hours",
    bestFor: ["Food", "Walking", "Couples"],
    tags: ["food", "walking", "couples", "free", "photography"],
    factors: {
      travellerSatisfaction: 92,
      popularity: 93,
      value: 90,
      uniqueness: 86,
      convenience: 88,
      familyAppeal: 85,
      firstTimerValue: 87,
      walkingDemand: 65,
    },
    viatorQuery: "High Line",
  }),
  place({
    slug: "circle-line-cruise",
    name: "Circle Line / harbor cruise",
    summary:
      "Sit-down sightseeing with skyline payoff — strong for tired legs and first visits.",
    neighborhood: "Harbor",
    cost: "paid",
    typicalCostLabel: "From ~$35",
    durationLabel: "1–3 hours",
    bestFor: ["Relaxed sightseeing", "Families", "Low walking"],
    tags: ["first-time", "family", "views", "low-walking" as PlaceTag, "evening"],
    factors: {
      travellerSatisfaction: 90,
      popularity: 88,
      value: 86,
      uniqueness: 84,
      convenience: 94,
      familyAppeal: 92,
      firstTimerValue: 91,
      walkingDemand: 15,
    },
    viatorQuery: "harbor cruise",
  }),
  place({
    slug: "empire-state-building",
    name: "Empire State Building",
    summary:
      "The classic deck — still thrilling, still busy; book timed entry.",
    neighborhood: "Midtown",
    cost: "paid",
    typicalCostLabel: "From ~$45",
    durationLabel: "1–2 hours",
    bestFor: ["Views", "First-time visitors"],
    tags: ["first-time", "views", "evening", "photography", "rainy-day"],
    factors: {
      travellerSatisfaction: 90,
      popularity: 95,
      value: 78,
      uniqueness: 92,
      convenience: 84,
      familyAppeal: 88,
      firstTimerValue: 93,
      walkingDemand: 40,
    },
    viatorQuery: "Empire State Building",
  }),
  place({
    slug: "moma",
    name: "Museum of Modern Art (MoMA)",
    summary: "Modern masters in a Midtown package — excellent rainy-day culture.",
    neighborhood: "Midtown",
    cost: "paid",
    typicalCostLabel: "Ticketed",
    durationLabel: "2–3 hours",
    bestFor: ["Art & culture", "Rainy day"],
    tags: ["culture", "rainy-day", "couples"],
    factors: {
      travellerSatisfaction: 92,
      popularity: 89,
      value: 84,
      uniqueness: 91,
      convenience: 86,
      familyAppeal: 78,
      firstTimerValue: 85,
      walkingDemand: 50,
    },
    viatorQuery: "MoMA",
  }),
  place({
    slug: "american-museum-natural-history",
    name: "American Museum of Natural History",
    summary:
      "Dinosaurs, planetarium magic, and kid-pacing — a family MVP next to the park.",
    neighborhood: "Upper West Side",
    cost: "paid",
    typicalCostLabel: "Ticketed / pay-what-you-wish options vary",
    durationLabel: "2–4 hours",
    bestFor: ["Families", "Rainy day", "Science"],
    tags: ["family", "culture", "rainy-day", "first-time"],
    factors: {
      travellerSatisfaction: 93,
      popularity: 90,
      value: 88,
      uniqueness: 90,
      convenience: 85,
      familyAppeal: 98,
      firstTimerValue: 86,
      walkingDemand: 55,
    },
    viatorQuery: "Natural History Museum",
  }),
  place({
    slug: "high-line",
    name: "The High Line",
    summary: "Elevated park on old rail beds — best at golden hour, not peak noon.",
    neighborhood: "Chelsea",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "1–2 hours",
    bestFor: ["Free", "Walking", "Photography"],
    tags: ["free", "walking", "photography", "couples", "views"],
    factors: {
      travellerSatisfaction: 91,
      popularity: 92,
      value: 98,
      uniqueness: 87,
      convenience: 90,
      familyAppeal: 82,
      firstTimerValue: 84,
      walkingDemand: 60,
    },
    viatorQuery: "High Line",
  }),
  place({
    slug: "times-square",
    name: "Times Square",
    summary:
      "Chaotic, neon, and necessary once — then leave. Score stays high for first-timers only.",
    neighborhood: "Midtown",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "30–60 min",
    bestFor: ["First-time visitors", "Evening"],
    tags: ["first-time", "free", "evening", "photography"],
    factors: {
      travellerSatisfaction: 78,
      popularity: 99,
      value: 95,
      uniqueness: 88,
      convenience: 90,
      familyAppeal: 80,
      firstTimerValue: 92,
      walkingDemand: 40,
    },
    viatorQuery: "Times Square",
  }),
  place({
    slug: "grand-central-terminal",
    name: "Grand Central Terminal",
    summary: "Celestial ceiling, whispered gallery, and architecture you can visit for free.",
    neighborhood: "Midtown",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "45–90 min",
    bestFor: ["Free", "Architecture", "Rainy day"],
    tags: ["free", "culture", "history", "rainy-day", "first-time", "photography"],
    factors: {
      travellerSatisfaction: 90,
      popularity: 88,
      value: 99,
      uniqueness: 89,
      convenience: 94,
      familyAppeal: 86,
      firstTimerValue: 88,
      walkingDemand: 25,
    },
    viatorQuery: "Grand Central",
  }),
  place({
    slug: "one-world-observatory",
    name: "One World Observatory",
    summary: "Downtown’s tallest viewpoint — pair with the Memorial plaza below.",
    neighborhood: "Financial District",
    cost: "paid",
    typicalCostLabel: "From ~$45",
    durationLabel: "1–2 hours",
    bestFor: ["Views", "First-time visitors"],
    tags: ["views", "first-time", "photography", "evening"],
    factors: {
      travellerSatisfaction: 90,
      popularity: 89,
      value: 80,
      uniqueness: 87,
      convenience: 85,
      familyAppeal: 86,
      firstTimerValue: 90,
      walkingDemand: 35,
    },
    viatorQuery: "One World Observatory",
  }),
  place({
    slug: "edge-hudson-yards",
    name: "Edge at Hudson Yards",
    summary: "Angled outdoor deck with a stomach-drop glass floor option.",
    neighborhood: "Hudson Yards",
    cost: "paid",
    typicalCostLabel: "From ~$40+",
    durationLabel: "1–2 hours",
    bestFor: ["Views", "Couples"],
    tags: ["views", "couples", "photography", "evening"],
    factors: {
      travellerSatisfaction: 89,
      popularity: 87,
      value: 79,
      uniqueness: 90,
      convenience: 84,
      familyAppeal: 80,
      firstTimerValue: 85,
      walkingDemand: 30,
    },
    viatorQuery: "Edge Hudson Yards",
  }),
  place({
    slug: "statue-ferry-only",
    name: "Staten Island Ferry",
    summary: "Free harbor views past Lady Liberty — still one of NYC’s best tricks.",
    neighborhood: "Battery Park",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "1–2 hours round trip",
    bestFor: ["Free", "Views", "Budget"],
    tags: ["free", "views", "first-time", "photography"],
    factors: {
      travellerSatisfaction: 91,
      popularity: 90,
      value: 100,
      uniqueness: 85,
      convenience: 92,
      familyAppeal: 90,
      firstTimerValue: 89,
      walkingDemand: 25,
    },
    viatorQuery: "Statue of Liberty ferry",
  }),
  place({
    slug: "little-island",
    name: "Little Island",
    summary: "Pier park on tulip pots — playful, photogenic, and free to wander.",
    neighborhood: "Hudson River Park",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "1 hour",
    bestFor: ["Free", "Couples", "Photography"],
    tags: ["free", "couples", "photography", "views", "walking"],
    factors: {
      travellerSatisfaction: 88,
      popularity: 84,
      value: 97,
      uniqueness: 86,
      convenience: 88,
      familyAppeal: 85,
      firstTimerValue: 78,
      walkingDemand: 40,
    },
    viatorQuery: "Little Island",
  }),
  place({
    slug: "tenement-museum",
    name: "Tenement Museum",
    summary: "Immigrant stories told inside preserved apartments — book tours ahead.",
    neighborhood: "Lower East Side",
    cost: "paid",
    typicalCostLabel: "Tour ticketed",
    durationLabel: "1–2 hours",
    bestFor: ["History", "Culture"],
    tags: ["history", "culture", "rainy-day"],
    factors: {
      travellerSatisfaction: 93,
      popularity: 82,
      value: 85,
      uniqueness: 94,
      convenience: 80,
      familyAppeal: 76,
      firstTimerValue: 84,
      walkingDemand: 35,
    },
    viatorQuery: "Tenement Museum",
  }),
  place({
    slug: "guggenheim",
    name: "Solomon R. Guggenheim Museum",
    summary: "Wright’s spiral is half the reason to go — the art is the other half.",
    neighborhood: "Upper East Side",
    cost: "paid",
    typicalCostLabel: "Ticketed",
    durationLabel: "1.5–3 hours",
    bestFor: ["Art & culture", "Architecture"],
    tags: ["culture", "rainy-day", "couples"],
    factors: {
      travellerSatisfaction: 90,
      popularity: 86,
      value: 82,
      uniqueness: 96,
      convenience: 82,
      familyAppeal: 74,
      firstTimerValue: 83,
      walkingDemand: 55,
    },
    viatorQuery: "Guggenheim",
  }),
  place({
    slug: "brooklyn-bridge-park",
    name: "Brooklyn Bridge Park / DUMBO",
    summary: "Manhattan skyline lawns, pizza, and the famous Washington St shot.",
    neighborhood: "DUMBO",
    cost: "free",
    typicalCostLabel: "Free (food extra)",
    durationLabel: "2–3 hours",
    bestFor: ["Views", "Photography", "Families"],
    tags: ["free", "views", "photography", "family", "couples", "food"],
    factors: {
      travellerSatisfaction: 93,
      popularity: 91,
      value: 96,
      uniqueness: 88,
      convenience: 84,
      familyAppeal: 90,
      firstTimerValue: 90,
      walkingDemand: 60,
    },
    viatorQuery: "DUMBO",
  }),
  place({
    slug: "west-village",
    name: "West Village wander",
    summary: "Crooked streets, brownstones, and date-night energy without a ticket.",
    neighborhood: "West Village",
    cost: "free",
    typicalCostLabel: "Free to walk",
    durationLabel: "2–3 hours",
    bestFor: ["Couples", "Walking", "Food"],
    tags: ["couples", "free", "walking", "food", "photography"],
    factors: {
      travellerSatisfaction: 92,
      popularity: 88,
      value: 94,
      uniqueness: 85,
      convenience: 86,
      familyAppeal: 70,
      firstTimerValue: 82,
      walkingDemand: 65,
    },
    viatorQuery: "Greenwich Village",
  }),
  place({
    slug: "chelsea-market",
    name: "Chelsea Market",
    summary: "Indoor graze heaven — lobster rolls, spices, and people-watching.",
    neighborhood: "Chelsea",
    cost: "under_50",
    typicalCostLabel: "Pay for what you eat",
    durationLabel: "1–2 hours",
    bestFor: ["Food", "Rainy day"],
    tags: ["food", "rainy-day", "couples", "family"],
    factors: {
      travellerSatisfaction: 90,
      popularity: 91,
      value: 86,
      uniqueness: 80,
      convenience: 92,
      familyAppeal: 88,
      firstTimerValue: 82,
      walkingDemand: 30,
    },
    viatorQuery: "Chelsea Market",
  }),
  place({
    slug: "rockefeller-center",
    name: "Rockefeller Center",
    summary: "Plaza energy year-round; winter lights push the scoreboard higher.",
    neighborhood: "Midtown",
    cost: "free",
    typicalCostLabel: "Plaza free; attractions ticketed",
    durationLabel: "1–2 hours",
    bestFor: ["First-time visitors", "Evening", "Families"],
    tags: ["first-time", "free", "family", "evening", "photography"],
    factors: {
      travellerSatisfaction: 88,
      popularity: 93,
      value: 90,
      uniqueness: 84,
      convenience: 90,
      familyAppeal: 90,
      firstTimerValue: 91,
      walkingDemand: 35,
    },
    viatorQuery: "Rockefeller Center",
  }),
  place({
    slug: "new-york-public-library",
    name: "New York Public Library (Stephen A. Schwarzman Building)",
    summary: "Lions, marble, and the Rose Main Reading Room — free civic grandeur.",
    neighborhood: "Midtown",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "45–90 min",
    bestFor: ["Free", "Culture", "Rainy day"],
    tags: ["free", "culture", "rainy-day", "photography"],
    factors: {
      travellerSatisfaction: 89,
      popularity: 84,
      value: 99,
      uniqueness: 86,
      convenience: 93,
      familyAppeal: 82,
      firstTimerValue: 80,
      walkingDemand: 25,
    },
    viatorQuery: "New York Public Library",
  }),
  place({
    slug: "bryant-park",
    name: "Bryant Park",
    summary: "Midtown’s pocket of calm — skating in winter, lawn chairs in summer.",
    neighborhood: "Midtown",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "30–90 min",
    bestFor: ["Free", "Low walking", "Families"],
    tags: ["free", "family", "couples"],
    factors: {
      travellerSatisfaction: 87,
      popularity: 86,
      value: 98,
      uniqueness: 72,
      convenience: 96,
      familyAppeal: 88,
      firstTimerValue: 75,
      walkingDemand: 20,
    },
    viatorQuery: "Bryant Park",
  }),
  place({
    slug: "chinatown-food",
    name: "Chinatown food crawl",
    summary: "Dumplings, buns, and bakery cases — one of NYC’s best cheap thrills.",
    neighborhood: "Chinatown",
    cost: "under_50",
    typicalCostLabel: "Usually under $30/person",
    durationLabel: "2–3 hours",
    bestFor: ["Food", "Budget", "Couples"],
    tags: ["food", "walking", "couples", "under_50" as PlaceTag],
    factors: {
      travellerSatisfaction: 93,
      popularity: 89,
      value: 95,
      uniqueness: 88,
      convenience: 80,
      familyAppeal: 84,
      firstTimerValue: 86,
      walkingDemand: 70,
    },
    viatorQuery: "Chinatown food tour",
  }),
  place({
    slug: "lower-east-side-food",
    name: "Lower East Side food & streets",
    summary: "Markets, pickle lore, and night energy a few blocks wide.",
    neighborhood: "Lower East Side",
    cost: "under_50",
    typicalCostLabel: "Pay as you graze",
    durationLabel: "2–4 hours",
    bestFor: ["Food", "Nightlife adjacent"],
    tags: ["food", "walking", "nightlife", "history"],
    factors: {
      travellerSatisfaction: 91,
      popularity: 86,
      value: 90,
      uniqueness: 87,
      convenience: 82,
      familyAppeal: 70,
      firstTimerValue: 80,
      walkingDemand: 65,
    },
    viatorQuery: "Lower East Side food",
  }),
  place({
    slug: "harlem-soul-food",
    name: "Harlem soul food & heritage",
    summary: "Institutions, brownstones, and music history — go for the meal and the stories.",
    neighborhood: "Harlem",
    cost: "under_50",
    typicalCostLabel: "Meal ~$20–40",
    durationLabel: "Half day",
    bestFor: ["Food", "Culture", "History"],
    tags: ["food", "culture", "history", "first-time"],
    factors: {
      travellerSatisfaction: 92,
      popularity: 84,
      value: 88,
      uniqueness: 91,
      convenience: 78,
      familyAppeal: 86,
      firstTimerValue: 85,
      walkingDemand: 55,
    },
    viatorQuery: "Harlem food tour",
  }),
  place({
    slug: "apollo-theater",
    name: "Apollo Theater",
    summary: "Harlem’s legendary stage — catch a show if the calendar aligns.",
    neighborhood: "Harlem",
    cost: "paid",
    typicalCostLabel: "Show tickets vary",
    durationLabel: "Evening",
    bestFor: ["Evening", "Culture", "Music"],
    tags: ["evening", "culture", "history"],
    factors: {
      travellerSatisfaction: 90,
      popularity: 80,
      value: 82,
      uniqueness: 93,
      convenience: 76,
      familyAppeal: 78,
      firstTimerValue: 80,
      walkingDemand: 30,
    },
    viatorQuery: "Apollo Theater",
  }),
  place({
    slug: "vessel-hudson-yards",
    name: "Vessel / Hudson Yards (exterior)",
    summary: "Climb access varies — the yards + sheds still deliver a modern skyline pocket.",
    neighborhood: "Hudson Yards",
    cost: "under_50",
    typicalCostLabel: "Area free; Vessel tickets if open",
    durationLabel: "1–2 hours",
    bestFor: ["Architecture", "Shopping adjacent"],
    tags: ["photography", "shopping", "views"],
    factors: {
      travellerSatisfaction: 76,
      popularity: 85,
      value: 80,
      uniqueness: 82,
      convenience: 88,
      familyAppeal: 80,
      firstTimerValue: 74,
      walkingDemand: 40,
    },
    viatorQuery: "Hudson Yards",
  }),
  place({
    slug: "soho-shopping",
    name: "SoHo cast-iron stroll & shopping",
    summary: "Architecture first, shopping second — still a classic afternoon.",
    neighborhood: "SoHo",
    cost: "free",
    typicalCostLabel: "Free to walk",
    durationLabel: "2–3 hours",
    bestFor: ["Shopping", "Photography", "Couples"],
    tags: ["shopping", "free", "couples", "photography", "walking"],
    factors: {
      travellerSatisfaction: 86,
      popularity: 88,
      value: 88,
      uniqueness: 80,
      convenience: 85,
      familyAppeal: 68,
      firstTimerValue: 78,
      walkingDemand: 60,
    },
    viatorQuery: "SoHo",
  }),
  place({
    slug: "whitney-museum",
    name: "Whitney Museum of American Art",
    summary: "Strong American art with High Line / Meatpacking adjacency.",
    neighborhood: "Meatpacking",
    cost: "paid",
    typicalCostLabel: "Ticketed",
    durationLabel: "2–3 hours",
    bestFor: ["Art & culture", "Couples"],
    tags: ["culture", "rainy-day", "couples"],
    factors: {
      travellerSatisfaction: 90,
      popularity: 83,
      value: 82,
      uniqueness: 88,
      convenience: 84,
      familyAppeal: 72,
      firstTimerValue: 78,
      walkingDemand: 45,
    },
    viatorQuery: "Whitney Museum",
  }),
  place({
    slug: "clinton-street-baking",
    name: "Iconic NYC brunch stop (LES / Village style)",
    summary:
      "Placeholder for the brunch pilgrimage — pancakes, lines, and weekend energy.",
    neighborhood: "Lower East Side / Village",
    cost: "under_50",
    typicalCostLabel: "Usually under $40/person",
    durationLabel: "1–2 hours",
    bestFor: ["Food", "Couples"],
    tags: ["food", "couples"],
    factors: {
      travellerSatisfaction: 88,
      popularity: 86,
      value: 80,
      uniqueness: 74,
      convenience: 70,
      familyAppeal: 82,
      firstTimerValue: 70,
      walkingDemand: 25,
    },
    viatorQuery: "New York food tour",
  }),
  place({
    slug: "radio-city",
    name: "Radio City Music Hall",
    summary: "Art Deco landmark — Rockettes season is peak tourist theater.",
    neighborhood: "Midtown",
    cost: "paid",
    typicalCostLabel: "Show tickets vary",
    durationLabel: "Evening / tour",
    bestFor: ["Evening", "Families", "History"],
    tags: ["evening", "family", "culture", "rainy-day"],
    factors: {
      travellerSatisfaction: 89,
      popularity: 87,
      value: 78,
      uniqueness: 86,
      convenience: 86,
      familyAppeal: 90,
      firstTimerValue: 84,
      walkingDemand: 25,
    },
    viatorQuery: "Radio City",
  }),
  place({
    slug: "ferry-east-river",
    name: "East River Ferry hop",
    summary: "Skyline commuting as entertainment — cheap, breezy, photogenic.",
    neighborhood: "East River waterfront",
    cost: "under_50",
    typicalCostLabel: "Ferry fare",
    durationLabel: "1–2 hours",
    bestFor: ["Views", "Low walking", "Photography"],
    tags: ["views", "photography", "couples"],
    factors: {
      travellerSatisfaction: 89,
      popularity: 80,
      value: 92,
      uniqueness: 82,
      convenience: 90,
      familyAppeal: 86,
      firstTimerValue: 80,
      walkingDemand: 20,
    },
    viatorQuery: "NYC ferry",
  }),
  place({
    slug: "prospect-park",
    name: "Prospect Park",
    summary: "Brooklyn’s answer to Central Park — locals’ favorite green sprawl.",
    neighborhood: "Park Slope / Prospect Heights",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "2–4 hours",
    bestFor: ["Free", "Families", "Nature"],
    tags: ["free", "family", "walking"],
    factors: {
      travellerSatisfaction: 90,
      popularity: 78,
      value: 98,
      uniqueness: 80,
      convenience: 74,
      familyAppeal: 92,
      firstTimerValue: 70,
      walkingDemand: 70,
    },
    viatorQuery: "Prospect Park",
  }),
  place({
    slug: "brooklyn-museum",
    name: "Brooklyn Museum",
    summary: "Serious collection without Midtown crush — pair with Prospect Park.",
    neighborhood: "Prospect Heights",
    cost: "paid",
    typicalCostLabel: "Ticketed",
    durationLabel: "2–3 hours",
    bestFor: ["Culture", "Rainy day"],
    tags: ["culture", "rainy-day"],
    factors: {
      travellerSatisfaction: 88,
      popularity: 76,
      value: 86,
      uniqueness: 84,
      convenience: 78,
      familyAppeal: 80,
      firstTimerValue: 72,
      walkingDemand: 45,
    },
    viatorQuery: "Brooklyn Museum",
  }),
  place({
    slug: "museum-of-the-moving-image",
    name: "Museum of the Moving Image",
    summary: "Film-geek heaven in Astoria — interactive and highly visitable.",
    neighborhood: "Astoria, Queens",
    cost: "paid",
    typicalCostLabel: "Ticketed",
    durationLabel: "2–3 hours",
    bestFor: ["Culture", "Families", "Rainy day"],
    tags: ["culture", "family", "rainy-day"],
    factors: {
      travellerSatisfaction: 91,
      popularity: 74,
      value: 88,
      uniqueness: 90,
      convenience: 72,
      familyAppeal: 90,
      firstTimerValue: 68,
      walkingDemand: 35,
    },
    viatorQuery: "Museum of the Moving Image",
  }),
  place({
    slug: "flushing-food",
    name: "Flushing food courts",
    summary: "Queens-level Chinese and pan-Asian depth — go hungry, order boldly.",
    neighborhood: "Flushing, Queens",
    cost: "under_50",
    typicalCostLabel: "Usually under $25/person",
    durationLabel: "2–4 hours",
    bestFor: ["Food", "Value"],
    tags: ["food"],
    factors: {
      travellerSatisfaction: 94,
      popularity: 82,
      value: 96,
      uniqueness: 92,
      convenience: 70,
      familyAppeal: 86,
      firstTimerValue: 74,
      walkingDemand: 50,
    },
    viatorQuery: "Flushing food",
  }),
  place({
    slug: "jackson-heights-food",
    name: "Jackson Heights global eats",
    summary: "South Asian, Latin, and everything between — serious foodie day.",
    neighborhood: "Jackson Heights, Queens",
    cost: "under_50",
    typicalCostLabel: "Usually under $30/person",
    durationLabel: "Half day",
    bestFor: ["Food", "Value"],
    tags: ["food", "walking"],
    factors: {
      travellerSatisfaction: 93,
      popularity: 78,
      value: 95,
      uniqueness: 91,
      convenience: 68,
      familyAppeal: 84,
      firstTimerValue: 72,
      walkingDemand: 60,
    },
    viatorQuery: "Queens food tour",
  }),
  place({
    slug: "roosevelt-island-tram",
    name: "Roosevelt Island Tram",
    summary: "MetroCard skyline ride — short, cheap, surprisingly great photos.",
    neighborhood: "Roosevelt Island",
    cost: "under_50",
    typicalCostLabel: "Transit fare",
    durationLabel: "1–2 hours",
    bestFor: ["Views", "Photography", "Value"],
    tags: ["views", "photography", "couples"],
    factors: {
      travellerSatisfaction: 88,
      popularity: 80,
      value: 94,
      uniqueness: 86,
      convenience: 82,
      familyAppeal: 88,
      firstTimerValue: 78,
      walkingDemand: 30,
    },
    viatorQuery: "Roosevelt Island",
  }),
  place({
    slug: "st-patricks-cathedral",
    name: "St. Patrick’s Cathedral",
    summary: "Gothic Midtown calm amid Fifth Avenue rush — free to visit respectfully.",
    neighborhood: "Midtown",
    cost: "free",
    typicalCostLabel: "Free",
    durationLabel: "30–60 min",
    bestFor: ["Free", "Culture", "Low walking"],
    tags: ["free", "culture", "history", "rainy-day"],
    factors: {
      travellerSatisfaction: 88,
      popularity: 86,
      value: 97,
      uniqueness: 82,
      convenience: 94,
      familyAppeal: 84,
      firstTimerValue: 82,
      walkingDemand: 20,
    },
    viatorQuery: "St Patrick's Cathedral",
  }),
  place({
    slug: "the-vessel-shed",
    name: "The Shed (Hudson Yards)",
    summary: "Performance and exhibition space — check what’s on before you go.",
    neighborhood: "Hudson Yards",
    cost: "paid",
    typicalCostLabel: "Event pricing varies",
    durationLabel: "1–3 hours",
    bestFor: ["Culture", "Evening"],
    tags: ["culture", "evening", "rainy-day"],
    factors: {
      travellerSatisfaction: 84,
      popularity: 78,
      value: 76,
      uniqueness: 84,
      convenience: 86,
      familyAppeal: 74,
      firstTimerValue: 70,
      walkingDemand: 30,
    },
    viatorQuery: "The Shed New York",
  }),
  place({
    slug: "coney-island",
    name: "Coney Island",
    summary: "Boardwalk nostalgia, Cyclone thrills, and summer chaos — seasonal magic.",
    neighborhood: "Coney Island, Brooklyn",
    cost: "under_50",
    typicalCostLabel: "Boardwalk free; rides extra",
    durationLabel: "Half day",
    bestFor: ["Families", "Summer", "Photography"],
    tags: ["family", "food", "photography"],
    factors: {
      travellerSatisfaction: 86,
      popularity: 84,
      value: 88,
      uniqueness: 90,
      convenience: 68,
      familyAppeal: 94,
      firstTimerValue: 76,
      walkingDemand: 55,
    },
    viatorQuery: "Coney Island",
  }),
  place({
    slug: "lincoln-center",
    name: "Lincoln Center",
    summary: "Plaza fountain evenings and world-class performance when timed right.",
    neighborhood: "Upper West Side",
    cost: "free",
    typicalCostLabel: "Plaza free; shows ticketed",
    durationLabel: "1 hour+ / evening",
    bestFor: ["Culture", "Evening", "Couples"],
    tags: ["culture", "evening", "couples", "free"],
    factors: {
      travellerSatisfaction: 87,
      popularity: 82,
      value: 90,
      uniqueness: 84,
      convenience: 86,
      familyAppeal: 78,
      firstTimerValue: 76,
      walkingDemand: 30,
    },
    viatorQuery: "Lincoln Center",
  }),
];

export const nycPlaces: NycPlace[] = [
  ...nycCorePlaces,
  ...(nycExtraPlaces as NycPlace[]),
];

// Fix invalid tags - I used some cast hacks. Clean the data.
function normalizeTags(tags: PlaceTag[]): PlaceTag[] {
  const allowed = new Set<string>([
    "first-time",
    "family",
    "couples",
    "free",
    "views",
    "food",
    "culture",
    "history",
    "walking",
    "photography",
    "evening",
    "rainy-day",
    "nightlife",
    "shopping",
    "music",
  ]);
  return tags.filter((t) => allowed.has(t)) as PlaceTag[];
}

for (const p of nycPlaces) {
  p.tags = normalizeTags(p.tags);
}

export type RankedPlace = NycPlace & {
  tiwScore: number;
  rank: number;
  explanation: string;
  /** Personalize categories aligned with trip day options */
  categories: ExperienceCategory[];
  primaryCategory: ExperienceCategory;
  primaryCategoryLabel: string;
  /** Who it's for (Families, Couples, …) — never Free/Paid */
  audience: string;
  /** Free / Under $50 / Paid */
  costBand: "Free" | "Under $50" | "Paid";
};

/** Map scoreboard places onto the same personalize categories used in trip templates. */
export function categoriesForPlace(place: NycPlace): ExperienceCategory[] {
  const cats = new Set<ExperienceCategory>();
  const blob = `${place.name} ${place.neighborhood} ${place.summary}`.toLowerCase();

  for (const t of place.tags) {
    if (t === "food") cats.add("FOOD");
    if (t === "culture" || t === "history") cats.add("CULTURE");
    if (t === "family") cats.add("FAMILY");
    if (t === "shopping") cats.add("SHOPPING");
    if (t === "nightlife") cats.add("NIGHTLIFE");
    if (t === "evening") cats.add("LIVE_ENTERTAINMENT");
    if (t === "views" || t === "first-time" || t === "photography")
      cats.add("SIGHTS");
    if (t === "walking" && /park|high line|garden|lawn/.test(blob))
      cats.add("NATURE");
  }

  if (/park|high line|garden|island|lawn|nature/.test(blob)) cats.add("NATURE");
  if (/cathedral|church|memorial|synagogue|temple/.test(blob))
    cats.add("RELIGIOUS");
  if (/cruise|ferry|harbor|boat/.test(blob)) cats.add("WATER_ACTIVITY");
  if (/spa|soft reset|relax/.test(blob)) cats.add("RELAX");
  if (/broadway|apollo|lincoln center|radio city|show|jazz/.test(blob))
    cats.add("LIVE_ENTERTAINMENT");

  if (!cats.size) cats.add("SIGHTS");
  return [...cats];
}

export function getPlaceBySlug(slug: string): NycPlace | null {
  return nycPlaces.find((p) => p.slug === slug) || null;
}

export function placeMatchesCategory(
  place: NycPlace,
  category: ExperienceCategory,
): boolean {
  return categoriesForPlace(place).includes(category);
}

/** Who the place is best for — people / traveller types only (not Free/Paid). */
const AUDIENCE_LABELS = new Set([
  "First-time visitors",
  "Families",
  "Couples",
  "Everyone",
  "Groups",
  "Solo travellers",
]);

export function audienceForPlace(place: NycPlace): string {
  for (const b of place.bestFor) {
    if (AUDIENCE_LABELS.has(b)) return b;
  }
  if (place.tags.includes("family")) return "Families";
  if (place.tags.includes("couples")) return "Couples";
  if (place.tags.includes("first-time")) return "First-time visitors";
  return "Everyone";
}

/** Cost band for the Free / Paid column. */
export function costBandLabel(place: NycPlace): "Free" | "Under $50" | "Paid" {
  if (place.cost === "free") return "Free";
  if (place.cost === "under_50") return "Under $50";
  return "Paid";
}

/** Sort key: Free → Under $50 → Paid */
export function costBandSortValue(place: NycPlace): number {
  if (place.cost === "free") return 0;
  if (place.cost === "under_50") return 1;
  return 2;
}

function matchesLens(place: NycPlace, lens: ScoreboardLens): boolean {
  switch (lens) {
    case "free":
      return place.cost === "free" || place.tags.includes("free");
    case "under_50":
      return place.cost === "free" || place.cost === "under_50";
    case "views":
      return place.tags.includes("views");
    case "food":
      return place.tags.includes("food");
    case "history":
      return place.tags.includes("history");
    case "culture":
      return place.tags.includes("culture");
    case "families":
      return place.tags.includes("family") || place.factors.familyAppeal >= 85;
    case "couples":
      return place.tags.includes("couples") || place.factors.uniqueness >= 88;
    case "evening":
      return place.tags.includes("evening");
    case "rainy_day":
      return place.tags.includes("rainy-day");
    case "first_visit":
      return (
        place.tags.includes("first-time") || place.factors.firstTimerValue >= 90
      );
    case "low_walking":
      return place.factors.walkingDemand <= 45;
    default:
      return true;
  }
}

export function rankNycPlaces(lens: ScoreboardLens = "overall"): RankedPlace[] {
  const ranked = nycPlaces
    .filter((p) => matchesLens(p, lens))
    .map((p) => {
      const tiwScore = computeTiwScore(p.factors, lens);
      const categories = categoriesForPlace(p);
      const primaryCategory = categories[0]!;
      return {
        ...p,
        tiwScore,
        rank: 0,
        explanation:
          p.whyHigh || scoreExplanation(p.name, p.factors, tiwScore),
        categories,
        primaryCategory,
        primaryCategoryLabel: experienceCategoryLabel[primaryCategory],
        audience: audienceForPlace(p),
        costBand: costBandLabel(p),
      };
    })
    .sort((a, b) => b.tiwScore - a.tiwScore || a.name.localeCompare(b.name));

  return ranked.map((p, i) => ({ ...p, rank: i + 1 }));
}

export function overallRankForSlug(slug: string): number | null {
  const board = rankNycPlaces("overall");
  return board.find((p) => p.slug === slug)?.rank ?? null;
}
