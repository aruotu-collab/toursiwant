import { promises as fs } from "fs";
import path from "path";
import {
  dbGetListingBySlug,
  dbInsertListing,
  dbListListingsForOperator,
  dbListPublishedListings,
  dbUpdateListingStatus,
  hasDatabase,
  type OperatorListingRecord,
} from "@/lib/db";
import type { CatalogTour } from "@/lib/us-tour-catalog";
import type { TourInterest } from "@/lib/tour-types";
import type { TourTheme } from "@/lib/tour-themes";
import { tourMetros } from "@/lib/us-tour-catalog";

const STORE_FILE =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "toursiwant-operator-listings.json")
    : path.join(process.cwd(), "data", "operator-listings.json");

export type NewListingInput = {
  operatorUserId: string;
  operatorEmail: string;
  operatorName?: string;
  businessName?: string;
  citySlug: string;
  title: string;
  duration: string;
  meetup: string;
  priceFrom: string;
  joinable?: boolean;
  interest: TourInterest;
  summary: string;
  timeLabel?: string;
  schedule?: "fixed" | "flexible" | "rolling";
  weekdays?: number[];
  spacesDefault?: number;
  themes: TourTheme[];
  status?: "published" | "draft";
};

async function readFileListings(): Promise<OperatorListingRecord[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as OperatorListingRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFileListings(listings: OperatorListingRecord[]) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(listings, null, 2), "utf8");
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function listingToCatalogTour(
  listing: OperatorListingRecord,
): CatalogTour {
  return {
    slug: listing.slug,
    citySlug: listing.citySlug,
    cityName: listing.cityName,
    stateCode: listing.stateCode,
    title: listing.title,
    duration: listing.duration,
    meetup: listing.meetup,
    priceFrom: listing.priceFrom,
    joinable: listing.joinable,
    interest: listing.interest as TourInterest,
    summary: listing.summary,
    time: "",
    timeLabel: listing.timeLabel || "On request",
    schedule: listing.schedule,
    weekdays: listing.weekdays,
    spacesDefault: listing.spacesDefault,
    source: "operator",
    themes: listing.themes as TourTheme[],
  };
}

export async function listPublishedCatalogTours(): Promise<CatalogTour[]> {
  const listings = hasDatabase()
    ? await dbListPublishedListings()
    : (await readFileListings()).filter((item) => item.status === "published");
  return listings.map(listingToCatalogTour);
}

export async function listOperatorListings(
  userId: string,
): Promise<OperatorListingRecord[]> {
  if (hasDatabase()) return dbListListingsForOperator(userId);
  return (await readFileListings()).filter(
    (item) => item.operatorUserId === userId,
  );
}

export async function getListingTourBySlug(
  slug: string,
): Promise<CatalogTour | null> {
  const listing = hasDatabase()
    ? await dbGetListingBySlug(slug)
    : (await readFileListings()).find((item) => item.slug === slug) || null;
  if (!listing || listing.status !== "published") return null;
  return listingToCatalogTour(listing);
}

export async function createOperatorListing(
  input: NewListingInput,
): Promise<OperatorListingRecord> {
  const metro = tourMetros.find((item) => item.slug === input.citySlug);
  if (!metro) {
    throw new Error("Choose a supported US city for this listing.");
  }
  if (!input.themes.length) {
    throw new Error("Pick at least one theme (e.g. Religious).");
  }

  const base = slugify(input.title) || "tour";
  const listing: OperatorListingRecord = {
    id: `listing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    slug: `op-${base}-${Math.random().toString(36).slice(2, 6)}`,
    operatorUserId: input.operatorUserId,
    operatorEmail: input.operatorEmail.trim().toLowerCase(),
    operatorName: input.operatorName?.trim() || undefined,
    businessName: input.businessName?.trim() || undefined,
    citySlug: metro.slug,
    cityName: metro.name,
    stateCode: metro.stateCode,
    title: input.title.trim(),
    duration: input.duration.trim(),
    meetup: input.meetup.trim(),
    priceFrom: input.priceFrom.trim(),
    joinable: input.joinable ?? true,
    interest: input.interest,
    summary: input.summary.trim(),
    timeLabel: input.timeLabel?.trim() || "On request",
    schedule: input.schedule || "flexible",
    weekdays: input.weekdays ?? [],
    spacesDefault: input.spacesDefault ?? 8,
    themes: input.themes,
    status: input.status || "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (hasDatabase()) {
    return dbInsertListing(listing);
  }

  const all = await readFileListings();
  all.unshift(listing);
  await writeFileListings(all);
  return listing;
}

export async function setListingStatus(
  id: string,
  operatorUserId: string,
  status: OperatorListingRecord["status"],
): Promise<OperatorListingRecord | null> {
  if (hasDatabase()) {
    return dbUpdateListingStatus(id, operatorUserId, status);
  }
  const all = await readFileListings();
  const index = all.findIndex(
    (item) => item.id === id && item.operatorUserId === operatorUserId,
  );
  if (index < 0) return null;
  all[index] = {
    ...all[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  await writeFileListings(all);
  return all[index];
}

/** Map discovery themes to the closest request-form interest. */
export function interestFromThemes(themes: TourTheme[]): TourInterest {
  if (themes.includes("food")) return "Food & markets";
  if (themes.includes("museum") || themes.includes("religious") || themes.includes("history")) {
    return "Museums & culture";
  }
  if (themes.includes("nightlife")) return "Nightlife";
  if (themes.includes("transfer")) return "Airport / hotel transfer";
  if (themes.includes("beach") || themes.includes("nature") || themes.includes("family")) {
    return "City highlights";
  }
  return "City highlights";
}
