import type { MetadataRoute } from "next";
import { nycPlaces } from "@/lib/nyc-places";
import { cityCatalogs } from "@/lib/places/registry";
import { tripTemplates } from "@/lib/trip-templates";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.toursiwant.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "/scorecard",
    "/new-york",
    "/new-york/plan",
    "/account",
    "/join",
    ...cityCatalogs
      .filter((c) => c.slug !== "new-york")
      .map((c) => `/city/${c.slug}`),
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency:
      path === "/scorecard" || path.startsWith("/new-york") || path.startsWith("/city/")
        ? "daily"
        : "monthly",
    priority:
      path === "/scorecard" || path === "/new-york" || path.startsWith("/city/")
        ? 1
        : 0.5,
  }));

  const scoreboardRoutes: MetadataRoute.Sitemap = [
    ...nycPlaces.map((p) => ({
      url: `${siteUrl}/new-york/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...cityCatalogs
      .filter((c) => c.slug !== "new-york")
      .flatMap((c) =>
        c.places.map((p) => ({
          url: `${siteUrl}/city/${c.slug}/${p.slug}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })),
      ),
  ];

  const tripRoutes: MetadataRoute.Sitemap = tripTemplates.map((t) => ({
    url: `${siteUrl}/trips/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...scoreboardRoutes, ...tripRoutes];
}
