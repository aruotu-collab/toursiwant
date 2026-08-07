import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { ensureAppSchema, getSql, hasDatabase } from "@/lib/db";
import { getTemplateBySlug } from "@/lib/trip-templates";
import type { ExperienceCategory } from "@/lib/trip-templates";

export type VoteTally = Record<string, Record<string, number>>;

export type TripVoter = {
  key: string;
  name: string;
  /** blockId → optionId */
  votes: Record<string, string>;
  joinedAt: string;
};

export type TripSession = {
  id: string;
  shareCode: string;
  templateSlug: string;
  templateTitle: string;
  createdAt: string;
  hotelName?: string;
  route?: string;
  region?: string;
  cityCodes?: string[];
  /** Listed on the Live trips board for strangers to join */
  openToJoin: boolean;
  /** Short note shown on the board, e.g. meeting point / vibe */
  joinNote?: string;
  selections: Record<string, string>;
  wants: ExperienceCategory[];
  votes: VoteTally;
  voters: TripVoter[];
  voterNames: string[];
  travelledRating?: number;
  travelledNote?: string;
  specialEventRequests: Array<{
    id: string;
    kind: "band" | "private_dinner" | "other";
    note: string;
    status: "requested" | "quoted" | "confirmed";
    createdAt: string;
  }>;
};

type Store = { sessions: TripSession[] };

const storePath =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "toursiwant-trip-sessions.json")
    : path.join(process.cwd(), "data", "trip-sessions.json");

function code() {
  return randomBytes(4).toString("hex");
}

function rebuildTallies(voters: TripVoter[]): VoteTally {
  const votes: VoteTally = {};
  for (const voter of voters) {
    for (const [blockId, optionId] of Object.entries(voter.votes || {})) {
      if (!votes[blockId]) votes[blockId] = {};
      votes[blockId][optionId] = (votes[blockId][optionId] || 0) + 1;
    }
  }
  return votes;
}

function normalizeSession(session: TripSession): TripSession {
  const voters = Array.isArray(session.voters) ? session.voters : [];
  return {
    ...session,
    openToJoin: Boolean(session.openToJoin),
    voters,
    votes: rebuildTallies(voters),
    voterNames: voters.map((v) => v.name),
    selections: session.selections || {},
    wants: session.wants || [],
    cityCodes: session.cityCodes || [],
    specialEventRequests: session.specialEventRequests || [],
  };
}

async function ensureTripSessionsTable() {
  if (!hasDatabase()) return;
  await ensureAppSchema();
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS trip_sessions (
      id TEXT PRIMARY KEY,
      share_code TEXT NOT NULL UNIQUE,
      template_slug TEXT NOT NULL,
      template_title TEXT NOT NULL,
      hotel_name TEXT,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS trip_sessions_share_code_idx
    ON trip_sessions (share_code)
  `;
}

function sessionToPayload(session: TripSession) {
  return {
    hotelName: session.hotelName,
    route: session.route,
    region: session.region,
    cityCodes: session.cityCodes,
    openToJoin: session.openToJoin,
    joinNote: session.joinNote,
    selections: session.selections,
    wants: session.wants,
    voters: session.voters,
    travelledRating: session.travelledRating,
    travelledNote: session.travelledNote,
    specialEventRequests: session.specialEventRequests,
  };
}

function rowToSession(row: {
  id: string;
  share_code: string;
  template_slug: string;
  template_title: string;
  hotel_name: string | null;
  payload: unknown;
  created_at: string | Date;
}): TripSession {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();
  const payload =
    typeof row.payload === "string"
      ? (JSON.parse(row.payload || "{}") as Record<string, unknown>)
      : ((row.payload || {}) as Record<string, unknown>);

  return normalizeSession({
    id: row.id,
    shareCode: row.share_code,
    templateSlug: row.template_slug,
    templateTitle: row.template_title,
    createdAt,
    hotelName: row.hotel_name || (payload.hotelName as string | undefined),
    route: payload.route as string | undefined,
    region: payload.region as string | undefined,
    cityCodes: (payload.cityCodes as string[]) || [],
    openToJoin: Boolean(payload.openToJoin),
    joinNote: payload.joinNote as string | undefined,
    selections: (payload.selections as Record<string, string>) || {},
    wants: (payload.wants as ExperienceCategory[]) || [],
    votes: {},
    voters: (payload.voters as TripVoter[]) || [],
    voterNames: [],
    travelledRating: payload.travelledRating as number | undefined,
    travelledNote: payload.travelledNote as string | undefined,
    specialEventRequests:
      (payload.specialEventRequests as TripSession["specialEventRequests"]) ||
      [],
  });
}

async function readFileStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return { sessions: [] };
  }
}

async function writeFileStore(store: Store) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

async function dbGetByShareCode(shareCode: string) {
  await ensureTripSessionsTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM trip_sessions
    WHERE lower(share_code) = ${shareCode.toLowerCase()}
    LIMIT 1
  `) as Array<{
    id: string;
    share_code: string;
    template_slug: string;
    template_title: string;
    hotel_name: string | null;
    payload: unknown;
    created_at: string | Date;
  }>;
  return rows[0] ? rowToSession(rows[0]) : null;
}

async function dbListRecent(limit = 80) {
  await ensureTripSessionsTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM trip_sessions
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as Array<{
    id: string;
    share_code: string;
    template_slug: string;
    template_title: string;
    hotel_name: string | null;
    payload: unknown;
    created_at: string | Date;
  }>;
  return rows.map(rowToSession);
}

async function dbUpsertSession(session: TripSession) {
  await ensureTripSessionsTable();
  const sql = getSql();
  const payload = JSON.stringify(sessionToPayload(session));
  const updatedAt = new Date().toISOString();
  await sql`
    INSERT INTO trip_sessions (
      id, share_code, template_slug, template_title, hotel_name, payload, created_at, updated_at
    ) VALUES (
      ${session.id},
      ${session.shareCode},
      ${session.templateSlug},
      ${session.templateTitle},
      ${session.hotelName ?? null},
      ${payload},
      ${session.createdAt},
      ${updatedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      hotel_name = EXCLUDED.hotel_name,
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
  `;
}

async function saveSession(session: TripSession): Promise<TripSession> {
  const normalized = normalizeSession(session);
  if (hasDatabase()) {
    await dbUpsertSession(normalized);
    return normalized;
  }
  const store = await readFileStore();
  const idx = store.sessions.findIndex((s) => s.id === normalized.id);
  if (idx >= 0) store.sessions[idx] = normalized;
  else store.sessions.unshift(normalized);
  store.sessions = store.sessions.slice(0, 200);
  await writeFileStore(store);
  return normalized;
}

export async function createTripSession(input: {
  templateSlug: string;
  templateTitle: string;
  hotelName?: string;
  route?: string;
  region?: string;
  cityCodes?: string[];
  openToJoin?: boolean;
  joinNote?: string;
  selections?: Record<string, string>;
  wants?: ExperienceCategory[];
  hostName?: string;
  hostKey?: string;
}): Promise<TripSession> {
  const voters: TripVoter[] = [];
  if (input.hostKey) {
    voters.push({
      key: input.hostKey,
      name: (input.hostName || "Host").slice(0, 40),
      votes: {},
      joinedAt: new Date().toISOString(),
    });
  }

  const template = getTemplateBySlug(input.templateSlug);
  const session: TripSession = {
    id: `sess_${Date.now()}_${code()}`,
    shareCode: code(),
    templateSlug: input.templateSlug,
    templateTitle: input.templateTitle,
    createdAt: new Date().toISOString(),
    hotelName: input.hotelName || template?.hotelAnchor?.name,
    route: input.route || template?.route,
    region: input.region || template?.region,
    cityCodes: input.cityCodes || template?.cityCodes || [],
    openToJoin: Boolean(input.openToJoin),
    joinNote: input.joinNote?.slice(0, 160),
    selections: input.selections || {},
    wants: input.wants || [],
    votes: {},
    voters,
    voterNames: voters.map((v) => v.name),
    specialEventRequests: [],
  };

  return saveSession(session);
}

export async function getSessionByShareCode(shareCode: string) {
  if (hasDatabase()) {
    return dbGetByShareCode(shareCode);
  }
  const store = await readFileStore();
  const session = store.sessions.find(
    (s) => s.shareCode.toLowerCase() === shareCode.toLowerCase(),
  );
  return session ? normalizeSession(session) : null;
}

export async function listOpenTripSessions(filters?: {
  cityCode?: string;
}) {
  let sessions: TripSession[] = [];
  if (hasDatabase()) {
    sessions = await dbListRecent(100);
  } else {
    const store = await readFileStore();
    sessions = store.sessions.map(normalizeSession);
  }

  let open = sessions.filter((s) => s.openToJoin);
  if (open.length === 0) {
    open = await ensureDemoOpenTrips();
  }
  if (filters?.cityCode) {
    const code = filters.cityCode.toUpperCase();
    open = open.filter((s) => (s.cityCodes || []).includes(code));
  }

  open.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return open.slice(0, 40);
}

async function ensureDemoOpenTrips(): Promise<TripSession[]> {
  const demos = [
    {
      slug: "new-york-4-days",
      host: "Maya",
      note: "Times Square stay · open to 2–4 more travellers",
      voters: ["Maya", "Jordan"],
    },
    {
      slug: "midtown-hotel-3-days",
      host: "Sam",
      note: "Midtown hotel base · flexible Broadway night",
      voters: ["Sam", "Priya", "Chris"],
    },
    {
      slug: "east-coast-classics",
      host: "Alex",
      note: "NYC → Philly → D.C. · looking for 1–2 more",
      voters: ["Alex"],
    },
  ];

  const created: TripSession[] = [];
  for (const demo of demos) {
    const template = getTemplateBySlug(demo.slug);
    if (!template) continue;
    const voters: TripVoter[] = demo.voters.map((name, i) => ({
      key: `demo_${demo.slug}_${i}`,
      name,
      votes: {},
      joinedAt: new Date(Date.now() - (i + 1) * 3600_000).toISOString(),
    }));
    const session: TripSession = {
      id: `demo_${demo.slug}_${code()}`,
      shareCode: `demo${code().slice(0, 4)}`,
      templateSlug: template.slug,
      templateTitle: template.title,
      createdAt: new Date(Date.now() - 7200_000).toISOString(),
      hotelName: template.hotelAnchor?.name,
      route: template.route,
      region: template.region,
      cityCodes: template.cityCodes,
      openToJoin: true,
      joinNote: demo.note,
      selections: {},
      wants: [],
      votes: {},
      voters,
      voterNames: voters.map((v) => v.name),
      specialEventRequests: [],
    };
    created.push(await saveSession(session));
  }
  return created;
}

export async function setSessionOpenToJoin(
  shareCode: string,
  openToJoin: boolean,
  joinNote?: string,
) {
  const session = await getSessionByShareCode(shareCode);
  if (!session) return null;
  session.openToJoin = openToJoin;
  if (typeof joinNote === "string") {
    session.joinNote = joinNote.slice(0, 160);
  }
  return saveSession(session);
}

export async function joinTripSession(
  shareCode: string,
  voterKey: string,
  voterName: string,
) {
  const session = await getSessionByShareCode(shareCode);
  if (!session) return null;
  const existing = session.voters.find((v) => v.key === voterKey);
  if (existing) {
    existing.name = voterName.slice(0, 40) || existing.name;
  } else {
    session.voters.push({
      key: voterKey,
      name: (voterName || "Guest").slice(0, 40),
      votes: {},
      joinedAt: new Date().toISOString(),
    });
  }
  return saveSession(session);
}

export async function saveSessionVotes(
  shareCode: string,
  blockId: string,
  optionId: string,
  voterName: string,
  voterKey: string,
) {
  const session = await getSessionByShareCode(shareCode);
  if (!session) return null;

  let voter = session.voters.find((v) => v.key === voterKey);
  if (!voter) {
    voter = {
      key: voterKey,
      name: (voterName || "Guest").slice(0, 40),
      votes: {},
      joinedAt: new Date().toISOString(),
    };
    session.voters.push(voter);
  } else if (voterName) {
    voter.name = voterName.slice(0, 40);
  }

  voter.votes[blockId] = optionId;
  session.selections[blockId] = optionId;
  return saveSession(session);
}

export async function updateSessionWants(
  shareCode: string,
  wants: ExperienceCategory[],
  selections: Record<string, string>,
) {
  const session = await getSessionByShareCode(shareCode);
  if (!session) return null;
  session.wants = wants;
  session.selections = { ...session.selections, ...selections };
  return saveSession(session);
}

export async function saveTravelledRating(
  shareCode: string,
  rating: number,
  note?: string,
) {
  const session = await getSessionByShareCode(shareCode);
  if (!session) return null;
  session.travelledRating = Math.min(5, Math.max(1, Math.round(rating)));
  session.travelledNote = note?.slice(0, 500);
  return saveSession(session);
}

export async function addSpecialEventRequest(
  shareCode: string,
  kind: "band" | "private_dinner" | "other",
  note: string,
) {
  const session = await getSessionByShareCode(shareCode);
  if (!session) return null;
  session.specialEventRequests.push({
    id: `se_${code()}`,
    kind,
    note: note.slice(0, 500),
    status: "requested",
    createdAt: new Date().toISOString(),
  });
  return saveSession(session);
}

export function winningOptions(session: TripSession) {
  const winners: Record<string, { optionId: string; count: number }> = {};
  for (const [blockId, tally] of Object.entries(session.votes || {})) {
    let bestId = "";
    let bestCount = 0;
    for (const [optionId, count] of Object.entries(tally)) {
      if (count > bestCount) {
        bestCount = count;
        bestId = optionId;
      }
    }
    if (bestId) winners[blockId] = { optionId: bestId, count: bestCount };
  }
  return winners;
}
