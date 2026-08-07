import type { MetadataRoute } from "next";
import { tripTemplates } from "@/lib/trip-templates";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.toursiwant.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = ["", "/account", "/join"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? "daily" : "monthly",
      priority: path === "" ? 1 : 0.5,
    }),
  );

  const tripRoutes: MetadataRoute.Sitemap = tripTemplates.map((t) => ({
    url: `${siteUrl}/trips/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...tripRoutes];
}
