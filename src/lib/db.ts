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

      await sql`
        CREATE TABLE IF NOT EXISTS page_views (
          id TEXT PRIMARY KEY,
          path TEXT NOT NULL,
          referrer TEXT,
          session_key TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS page_views_created_at_idx
        ON page_views (created_at DESC)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS operator_listings (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          operator_user_id TEXT NOT NULL,
          operator_email TEXT NOT NULL,
          operator_name TEXT,
          business_name TEXT,
          city_slug TEXT NOT NULL,
          city_name TEXT NOT NULL,
          state_code TEXT NOT NULL,
          title TEXT NOT NULL,
          duration TEXT NOT NULL,
          meetup TEXT NOT NULL,
          price_from TEXT NOT NULL,
          joinable BOOLEAN NOT NULL DEFAULT TRUE,
          interest TEXT NOT NULL,
          summary TEXT NOT NULL,
          time_label TEXT NOT NULL DEFAULT '',
          schedule TEXT NOT NULL DEFAULT 'flexible',
          weekdays INTEGER[] NOT NULL DEFAULT '{}',
          spaces_default INTEGER NOT NULL DEFAULT 8,
          themes TEXT[] NOT NULL DEFAULT '{}',
          status TEXT NOT NULL DEFAULT 'published',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS operator_listings_status_idx
        ON operator_listings (status, created_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS operator_listings_operator_idx
        ON operator_listings (operator_user_id, created_at DESC)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS revenue_events (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          partner TEXT,
          product_id TEXT,
          city_slug TEXT,
          path TEXT,
          meta TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS revenue_events_created_at_idx
        ON revenue_events (created_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS revenue_events_kind_idx
        ON revenue_events (kind, created_at DESC)
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

export async function dbRecordPageView(input: {
  id: string;
  path: string;
  referrer?: string;
  sessionKey?: string;
}) {
  await ensureAppSchema();
  const sql = getSql();
  await sql`
    INSERT INTO page_views (id, path, referrer, session_key, created_at)
    VALUES (
      ${input.id},
      ${input.path.slice(0, 500)},
      ${input.referrer?.slice(0, 500) ?? null},
      ${input.sessionKey?.slice(0, 120) ?? null},
      ${new Date().toISOString()}
    )
  `;
}

export async function dbPageViewStats() {
  await ensureAppSchema();
  const sql = getSql();

  const [totals] = (await sql`
    SELECT
      COUNT(*)::int AS all_time,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')::int AS last_24h,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS last_7d,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS last_30d,
      COUNT(DISTINCT session_key) FILTER (
        WHERE created_at >= NOW() - INTERVAL '1 day' AND session_key IS NOT NULL
      )::int AS unique_sessions_24h
    FROM page_views
  `) as Array<{
    all_time: number;
    last_24h: number;
    last_7d: number;
    last_30d: number;
    unique_sessions_24h: number;
  }>;

  const topPaths = (await sql`
    SELECT path, COUNT(*)::int AS views
    FROM page_views
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY path
    ORDER BY views DESC
    LIMIT 12
  `) as Array<{ path: string; views: number }>;

  return {
    allTime: totals?.all_time ?? 0,
    last24h: totals?.last_24h ?? 0,
    last7d: totals?.last_7d ?? 0,
    last30d: totals?.last_30d ?? 0,
    uniqueSessions24h: totals?.unique_sessions_24h ?? 0,
    topPaths: topPaths.map((row) => ({ path: row.path, views: row.views })),
  };
}

export type OperatorListingRow = {
  id: string;
  slug: string;
  operator_user_id: string;
  operator_email: string;
  operator_name: string | null;
  business_name: string | null;
  city_slug: string;
  city_name: string;
  state_code: string;
  title: string;
  duration: string;
  meetup: string;
  price_from: string;
  joinable: boolean;
  interest: string;
  summary: string;
  time_label: string;
  schedule: string;
  weekdays: number[] | null;
  spaces_default: number;
  themes: string[] | null;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
};

export type OperatorListingRecord = {
  id: string;
  slug: string;
  operatorUserId: string;
  operatorEmail: string;
  operatorName?: string;
  businessName?: string;
  citySlug: string;
  cityName: string;
  stateCode: string;
  title: string;
  duration: string;
  meetup: string;
  priceFrom: string;
  joinable: boolean;
  interest: string;
  summary: string;
  timeLabel: string;
  schedule: "fixed" | "flexible" | "rolling";
  weekdays: number[];
  spacesDefault: number;
  themes: string[];
  status: "published" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
};

function rowToListing(row: OperatorListingRow): OperatorListingRecord {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : new Date(row.updated_at).toISOString();
  const schedule =
    row.schedule === "fixed" || row.schedule === "rolling"
      ? row.schedule
      : "flexible";
  const status =
    row.status === "draft" || row.status === "archived"
      ? row.status
      : "published";

  return {
    id: row.id,
    slug: row.slug,
    operatorUserId: row.operator_user_id,
    operatorEmail: row.operator_email,
    operatorName: row.operator_name || undefined,
    businessName: row.business_name || undefined,
    citySlug: row.city_slug,
    cityName: row.city_name,
    stateCode: row.state_code,
    title: row.title,
    duration: row.duration,
    meetup: row.meetup,
    priceFrom: row.price_from,
    joinable: Boolean(row.joinable),
    interest: row.interest,
    summary: row.summary,
    timeLabel: row.time_label || "",
    schedule,
    weekdays: Array.isArray(row.weekdays) ? row.weekdays : [],
    spacesDefault: row.spaces_default || 8,
    themes: Array.isArray(row.themes) ? row.themes : [],
    status,
    createdAt,
    updatedAt,
  };
}

export async function dbListPublishedListings(): Promise<OperatorListingRecord[]> {
  await ensureAppSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM operator_listings
    WHERE status = 'published'
    ORDER BY created_at DESC
    LIMIT 500
  `) as OperatorListingRow[];
  return rows.map(rowToListing);
}

export async function dbListListingsForOperator(
  userId: string,
): Promise<OperatorListingRecord[]> {
  await ensureAppSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM operator_listings
    WHERE operator_user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 200
  `) as OperatorListingRow[];
  return rows.map(rowToListing);
}

export async function dbGetListingBySlug(
  slug: string,
): Promise<OperatorListingRecord | null> {
  await ensureAppSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM operator_listings WHERE slug = ${slug} LIMIT 1
  `) as OperatorListingRow[];
  return rows[0] ? rowToListing(rows[0]) : null;
}

export async function dbInsertListing(
  listing: OperatorListingRecord,
): Promise<OperatorListingRecord> {
  await ensureAppSchema();
  const sql = getSql();
  await sql`
    INSERT INTO operator_listings (
      id, slug, operator_user_id, operator_email, operator_name, business_name,
      city_slug, city_name, state_code, title, duration, meetup, price_from,
      joinable, interest, summary, time_label, schedule, weekdays,
      spaces_default, themes, status, created_at, updated_at
    ) VALUES (
      ${listing.id},
      ${listing.slug},
      ${listing.operatorUserId},
      ${listing.operatorEmail},
      ${listing.operatorName ?? null},
      ${listing.businessName ?? null},
      ${listing.citySlug},
      ${listing.cityName},
      ${listing.stateCode},
      ${listing.title},
      ${listing.duration},
      ${listing.meetup},
      ${listing.priceFrom},
      ${listing.joinable},
      ${listing.interest},
      ${listing.summary},
      ${listing.timeLabel},
      ${listing.schedule},
      ${listing.weekdays},
      ${listing.spacesDefault},
      ${listing.themes},
      ${listing.status},
      ${listing.createdAt},
      ${listing.updatedAt}
    )
  `;
  return listing;
}

export async function dbUpdateListingStatus(
  id: string,
  operatorUserId: string,
  status: OperatorListingRecord["status"],
): Promise<OperatorListingRecord | null> {
  await ensureAppSchema();
  const sql = getSql();
  const updatedAt = new Date().toISOString();
  await sql`
    UPDATE operator_listings
    SET status = ${status}, updated_at = ${updatedAt}
    WHERE id = ${id} AND operator_user_id = ${operatorUserId}
  `;
  const rows = (await sql`
    SELECT * FROM operator_listings WHERE id = ${id} LIMIT 1
  `) as OperatorListingRow[];
  return rows[0] ? rowToListing(rows[0]) : null;
}

export async function dbInsertRevenueEvent(event: {
  id: string;
  kind: string;
  partner?: string;
  productId?: string;
  citySlug?: string;
  path?: string;
  meta?: string;
  createdAt: string;
}) {
  await ensureAppSchema();
  const sql = getSql();
  await sql`
    INSERT INTO revenue_events (
      id, kind, partner, product_id, city_slug, path, meta, created_at
    ) VALUES (
      ${event.id},
      ${event.kind},
      ${event.partner ?? null},
      ${event.productId ?? null},
      ${event.citySlug ?? null},
      ${event.path ?? null},
      ${event.meta ?? null},
      ${event.createdAt}
    )
  `;
}

export async function dbRevenueEventStats() {
  await ensureAppSchema();
  const sql = getSql();

  const [totals] = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE kind = 'affiliate_click')::int AS all_clicks,
      COUNT(*) FILTER (
        WHERE kind = 'affiliate_click'
          AND created_at >= NOW() - INTERVAL '7 days'
      )::int AS clicks_7d
    FROM revenue_events
  `) as Array<{ all_clicks: number; clicks_7d: number }>;

  const byPartner = (await sql`
    SELECT partner, COUNT(*)::int AS clicks
    FROM revenue_events
    WHERE kind = 'affiliate_click'
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY partner
    ORDER BY clicks DESC
    LIMIT 20
  `) as Array<{ partner: string | null; clicks: number }>;

  const byCity = (await sql`
    SELECT city_slug, COUNT(*)::int AS clicks
    FROM revenue_events
    WHERE kind = 'affiliate_click'
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY city_slug
    ORDER BY clicks DESC
    LIMIT 20
  `) as Array<{ city_slug: string | null; clicks: number }>;

  const topProducts = (await sql`
    SELECT product_id, COUNT(*)::int AS clicks
    FROM revenue_events
    WHERE kind = 'affiliate_click'
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY product_id
    ORDER BY clicks DESC
    LIMIT 12
  `) as Array<{ product_id: string | null; clicks: number }>;

  return {
    affiliateClicks7d: totals?.clicks_7d ?? 0,
    affiliateClicksAll: totals?.all_clicks ?? 0,
    byPartner: byPartner.map((row) => ({
      partner: row.partner || "unknown",
      clicks: row.clicks,
    })),
    byCity: byCity.map((row) => ({
      citySlug: row.city_slug || "unknown",
      clicks: row.clicks,
    })),
    topProducts: topProducts.map((row) => ({
      productId: row.product_id || "unknown",
      clicks: row.clicks,
    })),
  };
}
