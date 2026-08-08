import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { ensureAppSchema, getSql, hasDatabase } from "@/lib/db";
import type { ExperienceCategory } from "@/lib/trip-templates";

export {
  NYC_PLAN_TEMPLATE_SLUG,
  isNycPlanTrip,
  openSavedTripHref,
} from "@/lib/saved-trip-kinds";

/** Serializable nested stop under a day */
export type SavedDayStop = {
  id: string;
  label: string;
};

/** Serializable trip-path node stored with a saved trip (hotel + days) */
export type SavedRouteNode = {
  id: string;
  label: string;
  kind: "hotel" | "day" | "stop";
  blockId?: string;
  dayLabel?: string;
  dayIndex?: number;
  stops?: SavedDayStop[];
};

export type SavedTrip = {
  id: string;
  userId: string;
  userEmail: string;
  templateSlug: string;
  templateTitle: string;
  title: string;
  route?: string;
  region?: string;
  cityCodes?: string[];
  hotelName?: string;
  selections: Record<string, string>;
  wants: ExperienceCategory[];
  /** Editable trip path (node map) */
  routeNodes?: SavedRouteNode[];
  /** NYC scoreboard plan: place slugs from “Want” */
  placeSlugs?: string[];
  /** NYC scoreboard plan: trip length in days */
  planDays?: number;
  /** NYC scoreboard plan: manual day placements (slug → day) */
  dayAssignments?: Record<string, number>;
  /** If forked from a live group room */
  sourceShareCode?: string;
  createdAt: string;
  updatedAt: string;
};

type Store = { trips: SavedTrip[] };

const storePath =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "toursiwant-saved-trips.json")
    : path.join(process.cwd(), "data", "saved-trips.json");

function id() {
  return `trip_${Date.now()}_${randomBytes(3).toString("hex")}`;
}

async function ensureTable() {
  if (!hasDatabase()) return;
  await ensureAppSchema();
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS saved_trips (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      template_slug TEXT NOT NULL,
      template_title TEXT NOT NULL,
      title TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS saved_trips_user_idx
    ON saved_trips (user_id, updated_at DESC)
  `;
}

function toPayload(trip: SavedTrip) {
  return {
    route: trip.route,
    region: trip.region,
    cityCodes: trip.cityCodes,
    hotelName: trip.hotelName,
    selections: trip.selections,
    wants: trip.wants,
    routeNodes: trip.routeNodes || [],
    placeSlugs: trip.placeSlugs || [],
    planDays: trip.planDays,
    dayAssignments: trip.dayAssignments || {},
    sourceShareCode: trip.sourceShareCode,
  };
}

function fromRow(row: {
  id: string;
  user_id: string;
  user_email: string;
  template_slug: string;
  template_title: string;
  title: string;
  payload: unknown;
  created_at: string | Date;
  updated_at: string | Date;
}): SavedTrip {
  const payload =
    typeof row.payload === "string"
      ? (JSON.parse(row.payload || "{}") as Record<string, unknown>)
      : ((row.payload || {}) as Record<string, unknown>);
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : new Date(row.updated_at).toISOString();

  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    templateSlug: row.template_slug,
    templateTitle: row.template_title,
    title: row.title,
    route: payload.route as string | undefined,
    region: payload.region as string | undefined,
    cityCodes: (payload.cityCodes as string[]) || [],
    hotelName: payload.hotelName as string | undefined,
    selections: (payload.selections as Record<string, string>) || {},
    wants: (payload.wants as ExperienceCategory[]) || [],
    routeNodes: (payload.routeNodes as SavedRouteNode[]) || [],
    placeSlugs: Array.isArray(payload.placeSlugs)
      ? (payload.placeSlugs as string[]).filter((s) => typeof s === "string")
      : [],
    planDays:
      typeof payload.planDays === "number" && Number.isFinite(payload.planDays)
        ? payload.planDays
        : undefined,
    dayAssignments:
      payload.dayAssignments &&
      typeof payload.dayAssignments === "object" &&
      !Array.isArray(payload.dayAssignments)
        ? (payload.dayAssignments as Record<string, number>)
        : {},
    sourceShareCode: payload.sourceShareCode as string | undefined,
    createdAt,
    updatedAt,
  };
}

async function readFileStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return { trips: [] };
  }
}

async function writeFileStore(store: Store) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function createSavedTrip(input: {
  userId: string;
  userEmail: string;
  templateSlug: string;
  templateTitle: string;
  title?: string;
  route?: string;
  region?: string;
  cityCodes?: string[];
  hotelName?: string;
  selections?: Record<string, string>;
  wants?: ExperienceCategory[];
  routeNodes?: SavedRouteNode[];
  placeSlugs?: string[];
  planDays?: number;
  dayAssignments?: Record<string, number>;
  sourceShareCode?: string;
}): Promise<SavedTrip> {
  const now = new Date().toISOString();
  const trip: SavedTrip = {
    id: id(),
    userId: input.userId,
    userEmail: input.userEmail,
    templateSlug: input.templateSlug,
    templateTitle: input.templateTitle,
    title: (input.title || input.templateTitle).slice(0, 120),
    route: input.route,
    region: input.region,
    cityCodes: input.cityCodes || [],
    hotelName: input.hotelName,
    selections: input.selections || {},
    wants: input.wants || [],
    routeNodes: input.routeNodes || [],
    placeSlugs: input.placeSlugs || [],
    planDays: input.planDays,
    dayAssignments: input.dayAssignments || {},
    sourceShareCode: input.sourceShareCode,
    createdAt: now,
    updatedAt: now,
  };

  if (hasDatabase()) {
    await ensureTable();
    const sql = getSql();
    await sql`
      INSERT INTO saved_trips (
        id, user_id, user_email, template_slug, template_title, title, payload, created_at, updated_at
      ) VALUES (
        ${trip.id},
        ${trip.userId},
        ${trip.userEmail},
        ${trip.templateSlug},
        ${trip.templateTitle},
        ${trip.title},
        ${JSON.stringify(toPayload(trip))},
        ${trip.createdAt},
        ${trip.updatedAt}
      )
    `;
    return trip;
  }

  const store = await readFileStore();
  store.trips.unshift(trip);
  store.trips = store.trips.slice(0, 500);
  await writeFileStore(store);
  return trip;
}

export async function listSavedTripsForUser(userId: string) {
  if (hasDatabase()) {
    await ensureTable();
    const sql = getSql();
    const rows = (await sql`
      SELECT * FROM saved_trips
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 100
    `) as Array<{
      id: string;
      user_id: string;
      user_email: string;
      template_slug: string;
      template_title: string;
      title: string;
      payload: unknown;
      created_at: string | Date;
      updated_at: string | Date;
    }>;
    return rows.map(fromRow);
  }

  const store = await readFileStore();
  return store.trips
    .filter((t) => t.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export async function getSavedTrip(id: string, userId?: string) {
  if (hasDatabase()) {
    await ensureTable();
    const sql = getSql();
    const rows = (await sql`
      SELECT * FROM saved_trips WHERE id = ${id} LIMIT 1
    `) as Array<{
      id: string;
      user_id: string;
      user_email: string;
      template_slug: string;
      template_title: string;
      title: string;
      payload: unknown;
      created_at: string | Date;
      updated_at: string | Date;
    }>;
    const trip = rows[0] ? fromRow(rows[0]) : null;
    if (!trip) return null;
    if (userId && trip.userId !== userId) return null;
    return trip;
  }

  const store = await readFileStore();
  const trip = store.trips.find((t) => t.id === id) || null;
  if (!trip) return null;
  if (userId && trip.userId !== userId) return null;
  return trip;
}

export async function updateSavedTrip(
  id: string,
  userId: string,
  patch: {
    title?: string;
    route?: string;
    selections?: Record<string, string>;
    wants?: ExperienceCategory[];
    routeNodes?: SavedRouteNode[];
    placeSlugs?: string[];
    planDays?: number;
    dayAssignments?: Record<string, number>;
  },
) {
  const trip = await getSavedTrip(id, userId);
  if (!trip) return null;
  if (patch.title) trip.title = patch.title.slice(0, 120);
  if (patch.route !== undefined) trip.route = patch.route;
  if (patch.selections) trip.selections = patch.selections;
  if (patch.wants) trip.wants = patch.wants;
  if (patch.routeNodes) trip.routeNodes = patch.routeNodes;
  if (patch.placeSlugs) trip.placeSlugs = patch.placeSlugs;
  if (patch.planDays !== undefined) trip.planDays = patch.planDays;
  if (patch.dayAssignments) trip.dayAssignments = patch.dayAssignments;
  trip.updatedAt = new Date().toISOString();

  if (hasDatabase()) {
    await ensureTable();
    const sql = getSql();
    await sql`
      UPDATE saved_trips
      SET
        title = ${trip.title},
        payload = ${JSON.stringify(toPayload(trip))},
        updated_at = ${trip.updatedAt}
      WHERE id = ${id} AND user_id = ${userId}
    `;
    return trip;
  }

  const store = await readFileStore();
  const idx = store.trips.findIndex((t) => t.id === id);
  if (idx >= 0) store.trips[idx] = trip;
  await writeFileStore(store);
  return trip;
}

export async function deleteSavedTrip(id: string, userId: string) {
  if (hasDatabase()) {
    await ensureTable();
    const sql = getSql();
    await sql`
      DELETE FROM saved_trips WHERE id = ${id} AND user_id = ${userId}
    `;
    return true;
  }
  const store = await readFileStore();
  store.trips = store.trips.filter(
    (t) => !(t.id === id && t.userId === userId),
  );
  await writeFileStore(store);
  return true;
}
