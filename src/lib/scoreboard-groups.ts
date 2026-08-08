import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { ensureAppSchema, getSql, hasDatabase } from "@/lib/db";

export type ScoreboardVote = "want" | "maybe" | "skip";

export type ScoreboardVoter = {
  key: string;
  /** Display label — prefer email; legacy seats may only have a name. */
  name: string;
  email?: string;
  /** Signed-in account that owns this voter seat (required for new joins). */
  userId?: string;
  /** placeSlug → vote */
  votes: Record<string, ScoreboardVote>;
  joinedAt: string;
};

export type ScoreboardGroup = {
  id: string;
  shareCode: string;
  title: string;
  destination: "new-york";
  createdAt: string;
  hostKey: string;
  hostName: string;
  voters: ScoreboardVoter[];
};

type Store = { groups: ScoreboardGroup[] };

const storePath =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "toursiwant-scoreboard-groups.json")
    : path.join(process.cwd(), "data", "scoreboard-groups.json");

function code() {
  return randomBytes(3).toString("hex");
}

function voterKey() {
  return `v_${randomBytes(4).toString("hex")}`;
}

async function readFileStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return { groups: parsed.groups || [] };
  } catch {
    return { groups: [] };
  }
}

async function writeFileStore(store: Store) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

async function ensureTable() {
  if (!hasDatabase()) return;
  await ensureAppSchema();
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS scoreboard_groups (
      id TEXT PRIMARY KEY,
      share_code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      destination TEXT NOT NULL DEFAULT 'new-york',
      host_key TEXT NOT NULL,
      host_name TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function toPayload(g: ScoreboardGroup) {
  return { voters: g.voters };
}

function fromRow(row: {
  id: string;
  share_code: string;
  title: string;
  destination: string;
  host_key: string;
  host_name: string;
  payload: unknown;
  created_at: string | Date;
}): ScoreboardGroup {
  const payload =
    typeof row.payload === "string"
      ? (JSON.parse(row.payload) as { voters?: ScoreboardVoter[] })
      : ((row.payload || {}) as { voters?: ScoreboardVoter[] });
  return {
    id: row.id,
    shareCode: row.share_code,
    title: row.title,
    destination: "new-york",
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : row.created_at.toISOString(),
    hostKey: row.host_key,
    hostName: row.host_name,
    voters: payload.voters || [],
  };
}

async function saveGroup(group: ScoreboardGroup): Promise<ScoreboardGroup> {
  if (hasDatabase()) {
    await ensureTable();
    const sql = getSql();
    await sql`
      INSERT INTO scoreboard_groups (
        id, share_code, title, destination, host_key, host_name, payload, created_at, updated_at
      ) VALUES (
        ${group.id},
        ${group.shareCode},
        ${group.title},
        ${group.destination},
        ${group.hostKey},
        ${group.hostName},
        ${JSON.stringify(toPayload(group))},
        ${group.createdAt},
        ${new Date().toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at
    `;
    return group;
  }
  const store = await readFileStore();
  const idx = store.groups.findIndex((g) => g.id === group.id);
  if (idx >= 0) store.groups[idx] = group;
  else store.groups.unshift(group);
  store.groups = store.groups.slice(0, 300);
  await writeFileStore(store);
  return group;
}

export async function createScoreboardGroup(input: {
  title: string;
  hostUserId: string;
  hostEmail: string;
  hostName?: string;
}): Promise<{ group: ScoreboardGroup; voterKey: string }> {
  const hostKey = voterKey();
  const email = input.hostEmail.trim().toLowerCase();
  const label = (email || input.hostName || "Host").slice(0, 80);
  const group: ScoreboardGroup = {
    id: `sg_${Date.now()}_${code()}`,
    shareCode: code(),
    title: (input.title || "New York Friends Trip").slice(0, 80),
    destination: "new-york",
    createdAt: new Date().toISOString(),
    hostKey,
    hostName: label,
    voters: [
      {
        key: hostKey,
        name: label,
        email: email || undefined,
        userId: input.hostUserId,
        votes: {},
        joinedAt: new Date().toISOString(),
      },
    ],
  };
  await saveGroup(group);
  return { group, voterKey: hostKey };
}

export async function getScoreboardGroup(shareCode: string) {
  if (hasDatabase()) {
    await ensureTable();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM scoreboard_groups
      WHERE lower(share_code) = ${shareCode.toLowerCase()}
      LIMIT 1
    `;
    if (!rows[0]) return null;
    return fromRow(rows[0] as Parameters<typeof fromRow>[0]);
  }
  const store = await readFileStore();
  return (
    store.groups.find(
      (g) => g.shareCode.toLowerCase() === shareCode.toLowerCase(),
    ) || null
  );
}

async function listRecentGroups(limit = 300): Promise<ScoreboardGroup[]> {
  if (hasDatabase()) {
    await ensureTable();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM scoreboard_groups
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `;
    return (rows as Array<Parameters<typeof fromRow>[0]>).map(fromRow);
  }
  const store = await readFileStore();
  return store.groups.slice(0, limit);
}

export type UserScoreboardGroup = ScoreboardGroup & {
  role: "host" | "member";
  myWantCount: number;
  totalWantVotes: number;
  placesWanted: number;
};

/** Groups this account created or joined (for My trips). */
export async function listScoreboardGroupsForUser(
  userId: string,
): Promise<UserScoreboardGroup[]> {
  const groups = await listRecentGroups(400);
  const mine: UserScoreboardGroup[] = [];

  for (const group of groups) {
    const me = group.voters.find((v) => v.userId === userId);
    if (!me) continue;
    const ranks = rankGroupPlaces(group);
    const placesWanted = ranks.filter((r) => r.wantCount > 0).length;
    const totalWantVotes = ranks.reduce((n, r) => n + r.wantCount, 0);
    const myWantCount = Object.values(me.votes).filter((v) => v === "want")
      .length;
    mine.push({
      ...group,
      role: me.key === group.hostKey ? "host" : "member",
      myWantCount,
      totalWantVotes,
      placesWanted,
    });
  }

  return mine.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function joinScoreboardGroup(
  shareCode: string,
  options: {
    userId: string;
    email: string;
    existingKey?: string;
    name?: string;
  },
): Promise<{ group: ScoreboardGroup; voterKey: string } | null> {
  const group = await getScoreboardGroup(shareCode);
  if (!group) return null;

  const email = options.email.trim().toLowerCase();
  const label = (email || options.name || "Traveller").slice(0, 80);
  const existingKey = options.existingKey;
  const userId = options.userId;

  if (existingKey) {
    const found = group.voters.find((v) => v.key === existingKey);
    if (found) {
      found.name = label || found.name;
      found.email = email || found.email;
      found.userId = userId;
      await saveGroup(group);
      return { group, voterKey: found.key };
    }
  }

  const byUser = group.voters.find((v) => v.userId === userId);
  if (byUser) {
    byUser.name = label || byUser.name;
    byUser.email = email || byUser.email;
    await saveGroup(group);
    return { group, voterKey: byUser.key };
  }

  if (email) {
    const byEmail = group.voters.find(
      (v) => v.email && v.email.toLowerCase() === email,
    );
    if (byEmail) {
      byEmail.name = label || byEmail.name;
      byEmail.userId = userId;
      await saveGroup(group);
      return { group, voterKey: byEmail.key };
    }
  }

  const key = voterKey();
  group.voters.push({
    key,
    name: label,
    email: email || undefined,
    userId,
    votes: {},
    joinedAt: new Date().toISOString(),
  });
  await saveGroup(group);
  return { group, voterKey: key };
}

export async function setScoreboardVotes(
  shareCode: string,
  voterKey: string,
  votes: Record<string, ScoreboardVote>,
): Promise<ScoreboardGroup | null> {
  const group = await getScoreboardGroup(shareCode);
  if (!group) return null;
  const voter = group.voters.find((v) => v.key === voterKey);
  if (!voter) return null;

  const next: Record<string, ScoreboardVote> = { ...voter.votes };
  for (const [slug, vote] of Object.entries(votes)) {
    if (vote === "want" || vote === "maybe" || vote === "skip") {
      next[slug] = vote;
    }
  }
  voter.votes = next;
  await saveGroup(group);
  return group;
}

export type GroupPlaceRank = {
  slug: string;
  wantCount: number;
  maybeCount: number;
  skipCount: number;
  supportPercent: number;
  votersTotal: number;
};

export function rankGroupPlaces(group: ScoreboardGroup): GroupPlaceRank[] {
  const totals = new Map<
    string,
    { want: number; maybe: number; skip: number }
  >();
  const votersTotal = Math.max(1, group.voters.length);

  for (const voter of group.voters) {
    for (const [slug, vote] of Object.entries(voter.votes)) {
      const cur = totals.get(slug) || { want: 0, maybe: 0, skip: 0 };
      if (vote === "want") cur.want += 1;
      else if (vote === "maybe") cur.maybe += 1;
      else cur.skip += 1;
      totals.set(slug, cur);
    }
  }

  return [...totals.entries()]
    .map(([slug, t]) => {
      const support = (t.want * 1 + t.maybe * 0.5) / votersTotal;
      return {
        slug,
        wantCount: t.want,
        maybeCount: t.maybe,
        skipCount: t.skip,
        supportPercent: Math.round(support * 100),
        votersTotal: group.voters.length,
      };
    })
    .sort(
      (a, b) =>
        b.wantCount - a.wantCount ||
        b.maybeCount - a.maybeCount ||
        b.supportPercent - a.supportPercent,
    );
}
