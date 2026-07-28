import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { CapturedRequest } from "@/lib/seed-requests";

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.NEON_DATABASE_URL?.trim() ||
    ""
  );
}

function getSql() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!sqlClient) {
    sqlClient = neon(url);
  }
  return sqlClient;
}

export async function ensureRequestsSchema() {
  if (!hasDatabase()) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS tour_requests (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          city_slug TEXT NOT NULL DEFAULT 'new-york',
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          travel_date TEXT,
          tour_slug TEXT,
          tour_title TEXT,
          group_size INTEGER,
          pickup TEXT,
          details TEXT,
          join_group BOOLEAN,
          business_name TEXT,
          source TEXT NOT NULL DEFAULT 'live'
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS tour_requests_created_at_idx
        ON tour_requests (created_at DESC)
      `;
    })();
  }
  await schemaReady;
}

type RequestRow = {
  id: string;
  type: CapturedRequest["type"];
  created_at: string | Date;
  city_slug: string;
  name: string;
  email: string;
  phone: string | null;
  travel_date: string | null;
  tour_slug: string | null;
  tour_title: string | null;
  group_size: number | null;
  pickup: string | null;
  details: string | null;
  join_group: boolean | null;
  business_name: string | null;
  source: "mock" | "live";
};

function rowToRequest(row: RequestRow): CapturedRequest {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();

  return {
    id: row.id,
    type: row.type,
    createdAt,
    citySlug: row.city_slug,
    name: row.name,
    email: row.email,
    phone: row.phone || undefined,
    travelDate: row.travel_date || undefined,
    tourSlug: row.tour_slug || undefined,
    tourTitle: row.tour_title || undefined,
    groupSize: row.group_size ?? undefined,
    pickup: row.pickup || undefined,
    details: row.details || undefined,
    joinGroup: row.join_group ?? undefined,
    businessName: row.business_name || undefined,
    source: row.source,
  };
}

export async function dbListLiveRequests(): Promise<CapturedRequest[]> {
  await ensureRequestsSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id, type, created_at, city_slug, name, email, phone,
      travel_date, tour_slug, tour_title, group_size, pickup,
      details, join_group, business_name, source
    FROM tour_requests
    ORDER BY created_at DESC
    LIMIT 500
  `) as RequestRow[];

  return rows.map(rowToRequest);
}

export async function dbInsertRequest(
  request: CapturedRequest,
): Promise<CapturedRequest> {
  await ensureRequestsSchema();
  const sql = getSql();

  await sql`
    INSERT INTO tour_requests (
      id, type, created_at, city_slug, name, email, phone,
      travel_date, tour_slug, tour_title, group_size, pickup,
      details, join_group, business_name, source
    ) VALUES (
      ${request.id},
      ${request.type},
      ${request.createdAt},
      ${request.citySlug},
      ${request.name},
      ${request.email},
      ${request.phone ?? null},
      ${request.travelDate ?? null},
      ${request.tourSlug ?? null},
      ${request.tourTitle ?? null},
      ${request.groupSize ?? null},
      ${request.pickup ?? null},
      ${request.details ?? null},
      ${request.joinGroup ?? null},
      ${request.businessName ?? null},
      ${request.source}
    )
  `;

  return request;
}
