export type CityStatus = "live" | "coming_soon";

export type City = {
  slug: string;
  name: string;
  region: string;
  status: CityStatus;
  tagline: string;
  heroImage: string;
  heroImageAlt: string;
};

export const cities: City[] = [
  {
    slug: "new-york",
    name: "New York",
    region: "United States",
    status: "live",
    tagline: "Tell us the tour you want across the five boroughs.",
    heroImage:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=2400&q=80",
    heroImageAlt: "New York City skyline at dusk",
  },
  {
    slug: "london",
    name: "London",
    region: "United Kingdom",
    status: "coming_soon",
    tagline: "Personalised London tours and local operator quotes.",
    heroImage:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2400&q=80",
    heroImageAlt: "London skyline along the Thames",
  },
  {
    slug: "florida",
    name: "Florida",
    region: "United States",
    status: "coming_soon",
    tagline: "Shore excursions, theme-park days, and coastal tours.",
    heroImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80",
    heroImageAlt: "Florida coastline",
  },
  {
    slug: "hong-kong",
    name: "Hong Kong",
    region: "Hong Kong",
    status: "coming_soon",
    tagline: "Harbour views, island hops, and last-minute local tours.",
    heroImage:
      "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=2400&q=80",
    heroImageAlt: "Hong Kong harbour skyline",
  },
];

export const launchCity = cities.find((city) => city.slug === "new-york")!;

export function getCity(slug: string) {
  return cities.find((city) => city.slug === slug);
}

export function getLiveCities() {
  return cities.filter((city) => city.status === "live");
}
