import type { MetadataRoute } from "next";
import { sampleTours } from "@/lib/sample-tours";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.toursiwant.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/tours",
    "/events",
    "/events/ride",
    "/request",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/tours" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/tours" ? 0.9 : 0.7,
  }));

  const tourRoutes: MetadataRoute.Sitemap = sampleTours.map((tour) => ({
    url: `${siteUrl}/tours/${tour.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...tourRoutes];
}
