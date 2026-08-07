import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { ExperienceCategory } from "@/lib/trip-templates";

export type VoteTally = Record<string, Record<string, number>>;

export type TripSession = {
  id: string;
  shareCode: string;
  templateSlug: string;
  templateTitle: string;
  createdAt: string;
  hotelName?: string;
  selections: Record<string, string>;
  wants: ExperienceCategory[];
  votes: VoteTally;
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

export async function createTripSession(input: {
  templateSlug: string;
  templateTitle: string;
  hotelName?: string;
  selections?: Record<string, string>;
  wants?: ExperienceCategory[];
}): Promise<TripSession> {
  const store = await readStore();
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
    voterNames: [],
    specialEventRequests: [],
  };
  store.sessions.unshift(session);
  store.sessions = store.sessions.slice(0, 200);
  await writeStore(store);
  return session;
}

export async function getSessionByShareCode(shareCode: string) {
  const store = await readStore();
  return (
    store.sessions.find(
      (s) => s.shareCode.toLowerCase() === shareCode.toLowerCase(),
    ) || null
  );
}

export async function getSessionById(id: string) {
  const store = await readStore();
  return store.sessions.find((s) => s.id === id) || null;
}

export async function saveSessionVotes(
  shareCode: string,
  blockId: string,
  optionId: string,
  voterName: string,
) {
  const store = await readStore();
  const session = store.sessions.find(
    (s) => s.shareCode.toLowerCase() === shareCode.toLowerCase(),
  );
  if (!session) return null;
  if (!session.votes[blockId]) session.votes[blockId] = {};
  session.votes[blockId][optionId] =
    (session.votes[blockId][optionId] || 0) + 1;
  if (voterName && !session.voterNames.includes(voterName)) {
    session.voterNames.push(voterName.slice(0, 40));
  }
  session.selections[blockId] = optionId;
  await writeStore(store);
  return session;
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
  return session;
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
  return session;
}
