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

export function getSql() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!sqlClient) {
    sqlClient = neon(url);
  }
  return sqlClient;
}

export async function ensureAppSchema() {
  if (!hasDatabase()) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'traveller',
          business_name TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS magic_tokens (
          token TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'traveller',
          name TEXT,
          next_path TEXT,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

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
          source TEXT NOT NULL DEFAULT 'live',
          user_id TEXT,
          need_accommodation BOOLEAN,
          accommodation_notes TEXT,
          event_slug TEXT,
          event_name TEXT,
          return_address TEXT,
          event_start TEXT,
          event_end TEXT
        )
      `;

      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS user_id TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS need_accommodation BOOLEAN`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS accommodation_notes TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS event_slug TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS event_name TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS return_address TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS event_start TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS event_end TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS operator_reply TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS operator_quote TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS operator_reply_at TIMESTAMPTZ`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS operator_name TEXT`;
      await sql`ALTER TABLE tour_requests ADD COLUMN IF NOT EXISTS operator_business_name TEXT`;

      await sql`
        CREATE INDEX IF NOT EXISTS tour_requests_created_at_idx
        ON tour_requests (created_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS tour_requests_email_idx
        ON tour_requests (email)
      `;
    })();
  }
  await schemaReady;
}

/** @deprecated use ensureAppSchema */
export async function ensureRequestsSchema() {
  await ensureAppSchema();
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
  user_id?: string | null;
  need_accommodation?: boolean | null;
  accommodation_notes?: string | null;
  event_slug?: string | null;
  event_name?: string | null;
  return_address?: string | null;
  event_start?: string | null;
  event_end?: string | null;
  status?: string | null;
  operator_reply?: string | null;
  operator_quote?: string | null;
  operator_reply_at?: string | Date | null;
  operator_name?: string | null;
  operator_business_name?: string | null;
};

function rowToRequest(row: RequestRow): CapturedRequest {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();

  const replyAt = row.operator_reply_at
    ? row.operator_reply_at instanceof Date
      ? row.operator_reply_at.toISOString()
      : new Date(row.operator_reply_at).toISOString()
    : undefined;

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
    userId: row.user_id || undefined,
    needAccommodation: row.need_accommodation ?? undefined,
    accommodationNotes: row.accommodation_notes || undefined,
    eventSlug: row.event_slug || undefined,
    eventName: row.event_name || undefined,
    returnAddress: row.return_address || undefined,
    eventStart: row.event_start || undefined,
    eventEnd: row.event_end || undefined,
    status: row.status === "responded" ? "responded" : "open",
    operatorReply: row.operator_reply || undefined,
    operatorQuote: row.operator_quote || undefined,
    operatorReplyAt: replyAt,
    operatorName: row.operator_name || undefined,
    operatorBusinessName: row.operator_business_name || undefined,
  };
}

export async function dbListLiveRequests(): Promise<CapturedRequest[]> {
  await ensureAppSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT *
    FROM tour_requests
    ORDER BY created_at DESC
    LIMIT 500
  `) as RequestRow[];

  return rows.map(rowToRequest);
}

export async function dbInsertRequest(
  request: CapturedRequest,
): Promise<CapturedRequest> {
  await ensureAppSchema();
  const sql = getSql();

  await sql`
    INSERT INTO tour_requests (
      id, type, created_at, city_slug, name, email, phone,
      travel_date, tour_slug, tour_title, group_size, pickup,
      details, join_group, business_name, source,
      user_id, need_accommodation, accommodation_notes,
      event_slug, event_name, return_address, event_start, event_end,
      status
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
      ${request.source},
      ${request.userId ?? null},
      ${request.needAccommodation ?? null},
      ${request.accommodationNotes ?? null},
      ${request.eventSlug ?? null},
      ${request.eventName ?? null},
      ${request.returnAddress ?? null},
      ${request.eventStart ?? null},
      ${request.eventEnd ?? null},
      ${request.status ?? "open"}
    )
  `;

  return request;
}

export async function dbUpdateRequestReply(input: {
  id: string;
  operatorReply: string;
  operatorQuote?: string;
  operatorName?: string;
  operatorBusinessName?: string;
}): Promise<CapturedRequest | null> {
  await ensureAppSchema();
  const sql = getSql();
  const repliedAt = new Date().toISOString();

  await sql`
    UPDATE tour_requests
    SET
      status = 'responded',
      operator_reply = ${input.operatorReply},
      operator_quote = ${input.operatorQuote ?? null},
      operator_reply_at = ${repliedAt},
      operator_name = ${input.operatorName ?? null},
      operator_business_name = ${input.operatorBusinessName ?? null}
    WHERE id = ${input.id} AND source = 'live'
  `;

  const rows = (await sql`
    SELECT * FROM tour_requests WHERE id = ${input.id} LIMIT 1
  `) as RequestRow[];

  return rows[0] ? rowToRequest(rows[0]) : null;
}
