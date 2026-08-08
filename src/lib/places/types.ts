import type { ScoreFactors } from "@/lib/tiw-score";

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

export type CityPlace = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  neighborhood: string;
  cost: "free" | "under_50" | "paid";
  typicalCostLabel: string;
  durationLabel: string;
  bestFor: string[];
  tags: PlaceTag[];
  factors: ScoreFactors;
  viatorQuery: string;
  whyHigh?: string;
};

export function place(
  partial: Omit<CityPlace, "id"> & { id?: string },
): CityPlace {
  const id = partial.id || partial.slug;
  return { ...partial, id };
}
