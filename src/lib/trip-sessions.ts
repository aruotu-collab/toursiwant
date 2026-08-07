import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
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
  selections: Record<string, string>;
  wants: ExperienceCategory[];
  /** Derived from voters — kept for easy UI reads */
  votes: VoteTally;
  voters: TripVoter[];
  /** @deprecated use voters */
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

const storePath = path.join(process.cwd(), "data", "trip-sessions.json");

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return { sessions: [] };
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function code() {
  return randomBytes(4).toString("hex");
}

function rebuildTallies(voters: TripVoter[]): VoteTally {
  const votes: VoteTally = {};
  for (const voter of voters) {
    for (const [blockId, optionId] of Object.entries(voter.votes)) {
      if (!votes[blockId]) votes[blockId] = {};
      votes[blockId][optionId] = (votes[blockId][optionId] || 0) + 1;
    }
  }
  return votes;
}

function normalizeSession(session: TripSession): TripSession {
  const voters = session.voters || [];
  return {
    ...session,
    voters,
    votes: rebuildTallies(voters),
    voterNames: voters.map((v) => v.name),
  };
}

export async function createTripSession(input: {
  templateSlug: string;
  templateTitle: string;
  hotelName?: string;
  selections?: Record<string, string>;
  wants?: ExperienceCategory[];
  hostName?: string;
  hostKey?: string;
}): Promise<TripSession> {
  const store = await readStore();
  const voters: TripVoter[] = [];
  if (input.hostName && input.hostKey) {
    voters.push({
      key: input.hostKey,
      name: input.hostName.slice(0, 40),
      votes: {},
      joinedAt: new Date().toISOString(),
    });
  }
  const session: TripSession = {
    id: `sess_${Date.now()}_${code()}`,
    shareCode: code(),
    templateSlug: input.templateSlug,
    templateTitle: input.templateTitle,
    createdAt: new Date().toISOString(),
    hotelName: input.hotelName,
    selections: input.selections || {},
    wants: input.wants || [],
    votes: {},
    voters,
    voterNames: voters.map((v) => v.name),
    specialEventRequests: [],
  };
  store.sessions.unshift(session);
  store.sessions = store.sessions.slice(0, 200);
  await writeStore(store);
  return normalizeSession(session);
}

export async function getSessionByShareCode(shareCode: string) {
  const store = await readStore();
  const session = store.sessions.find(
    (s) => s.shareCode.toLowerCase() === shareCode.toLowerCase(),
  );
  return session ? normalizeSession(session) : null;
}

export async function joinTripSession(
  shareCode: string,
  voterKey: string,
  voterName: string,
) {
  const store = await readStore();
  const session = store.sessions.find(
    (s) => s.shareCode.toLowerCase() === shareCode.toLowerCase(),
  );
  if (!session) return null;
  if (!session.voters) session.voters = [];
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
  const normalized = normalizeSession(session);
  Object.assign(session, normalized);
  await writeStore(store);
  return normalized;
}

export async function saveSessionVotes(
  shareCode: string,
  blockId: string,
  optionId: string,
  voterName: string,
  voterKey: string,
) {
  const store = await readStore();
  const session = store.sessions.find(
    (s) => s.shareCode.toLowerCase() === shareCode.toLowerCase(),
  );
  if (!session) return null;
  if (!session.voters) session.voters = [];

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

  const normalized = normalizeSession(session);
  Object.assign(session, normalized);
  await writeStore(store);
  return normalized;
}

export async function updateSessionWants(
  shareCode: string,
  wants: ExperienceCategory[],
  selections: Record<string, string>,
) {
  const store = await readStore();
  const session = store.sessions.find(
    (s) => s.shareCode.toLowerCase() === shareCode.toLowerCase(),
  );
  if (!session) return null;
  session.wants = wants;
  session.selections = { ...session.selections, ...selections };
  await writeStore(store);
  return normalizeSession(session);
}

export async function saveTravelledRating(
  shareCode: string,
  rating: number,
  note?: string,
) {
  const store = await readStore();
  const session = store.sessions.find(
    (s) => s.shareCode.toLowerCase() === shareCode.toLowerCase(),
  );
  if (!session) return null;
  session.travelledRating = Math.min(5, Math.max(1, Math.round(rating)));
  session.travelledNote = note?.slice(0, 500);
  await writeStore(store);
  return normalizeSession(session);
}

export async function addSpecialEventRequest(
  shareCode: string,
  kind: "band" | "private_dinner" | "other",
  note: string,
) {
  const store = await readStore();
  const session = store.sessions.find(
    (s) => s.shareCode.toLowerCase() === shareCode.toLowerCase(),
  );
  if (!session) return null;
  session.specialEventRequests.push({
    id: `se_${code()}`,
    kind,
    note: note.slice(0, 500),
    status: "requested",
    createdAt: new Date().toISOString(),
  });
  await writeStore(store);
  return normalizeSession(session);
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
