import { promises as fs } from "fs";
import path from "path";
import {
  dbInsertRequest,
  dbListLiveRequests,
  hasDatabase,
} from "@/lib/db";
import {
  seedCapturedRequests,
  type CapturedRequest,
  type CapturedRequestType,
} from "@/lib/seed-requests";

const STORE_FILE =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "toursiwant-captured-requests.json")
    : path.join(process.cwd(), "data", "captured-requests.json");

type NewRequestInput = {
  type: CapturedRequestType;
  name: string;
  email: string;
  phone?: string;
  travelDate?: string;
  tourSlug?: string;
  tourTitle?: string;
  groupSize?: number;
  pickup?: string;
  details?: string;
  joinGroup?: boolean;
  businessName?: string;
  citySlug?: string;
};

async function readFileLiveRequests(): Promise<CapturedRequest[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as CapturedRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFileLiveRequests(requests: CapturedRequest[]) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(requests, null, 2), "utf8");
}

async function readLiveRequests(): Promise<CapturedRequest[]> {
  if (hasDatabase()) {
    return dbListLiveRequests();
  }
  return readFileLiveRequests();
}

export function storageMode() {
  return hasDatabase() ? "postgres" : "file";
}

export async function listRequests(): Promise<CapturedRequest[]> {
  const live = await readLiveRequests();
  const merged = [...live, ...seedCapturedRequests];
  return merged.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createRequest(
  input: NewRequestInput,
): Promise<CapturedRequest> {
  const request: CapturedRequest = {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    createdAt: new Date().toISOString(),
    citySlug: input.citySlug || "new-york",
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || undefined,
    travelDate: input.travelDate || undefined,
    tourSlug: input.tourSlug || undefined,
    tourTitle: input.tourTitle || undefined,
    groupSize: input.groupSize,
    pickup: input.pickup?.trim() || undefined,
    details: input.details?.trim() || undefined,
    joinGroup: input.joinGroup,
    businessName: input.businessName?.trim() || undefined,
    source: "live",
  };

  if (hasDatabase()) {
    await dbInsertRequest(request);
    return request;
  }

  const live = await readFileLiveRequests();
  const next = [request, ...live].slice(0, 500);
  await writeFileLiveRequests(next);
  return request;
}
