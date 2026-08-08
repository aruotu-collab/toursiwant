import type { MetadataRoute } from "next";
import { nycPlaces } from "@/lib/nyc-places";
import { tripTemplates } from "@/lib/trip-templates";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.toursiwant.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/scorecard",
    "/new-york",
    "/new-york/plan",
    "/account",
    "/join",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency:
      path === "" || path === "/scorecard" || path === "/new-york"
        ? "daily"
        : "monthly",
    priority:
      path === "" || path === "/scorecard" || path === "/new-york" ? 1 : 0.5,
  }));

  const scoreboardRoutes: MetadataRoute.Sitemap = nycPlaces.map((p) => ({
    url: `${siteUrl}/new-york/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const tripRoutes: MetadataRoute.Sitemap = tripTemplates.map((t) => ({
    url: `${siteUrl}/trips/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...scoreboardRoutes, ...tripRoutes];
}
