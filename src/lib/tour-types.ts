export const tourInterests = [
  "City highlights",
  "Food & markets",
  "Museums & culture",
  "Nightlife",
  "Neighborhood walk",
  "Private driver",
  "Cruise shore excursion",
  "Airport / hotel transfer",
  "Something custom",
] as const;

export type TourInterest = (typeof tourInterests)[number];

export type TourRequestDraft = {
  citySlug: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  groupSize: number;
  hoursAvailable: number;
  returnBy: string;
  interests: TourInterest[];
  pickup: string;
  details: string;
  joinGroup: boolean;
};
