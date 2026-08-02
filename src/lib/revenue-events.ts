import { promises as fs } from "fs";
import path from "path";
import {
  dbInsertRevenueEvent,
  dbRevenueEventStats,
  hasDatabase,
} from "@/lib/db";

export type RevenueEventKind =
  | "affiliate_click"
  | "tour_request"
  | "operator_publish";

export type RevenueEvent = {
  id: string;
  kind: RevenueEventKind;
  partner?: string;
  productId?: string;
  citySlug?: string;
  path?: string;
  meta?: string;
  createdAt: string;
};

const STORE_FILE =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "toursiwant-revenue-events.json")
    : path.join(process.cwd(), "data", "revenue-events.json");

async function readFileEvents(): Promise<RevenueEvent[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as RevenueEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFileEvents(events: RevenueEvent[]) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(events.slice(0, 2000), null, 2), "utf8");
}

export async function trackRevenueEvent(input: {
  kind: RevenueEventKind;
  partner?: string;
  productId?: string;
  citySlug?: string;
  path?: string;
  meta?: string;
}): Promise<RevenueEvent> {
  const event: RevenueEvent = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    partner: input.partner,
    productId: input.productId,
    citySlug: input.citySlug,
    path: input.path,
    meta: input.meta,
    createdAt: new Date().toISOString(),
  };

  if (hasDatabase()) {
    await dbInsertRevenueEvent(event);
    return event;
  }

  const all = await readFileEvents();
  all.unshift(event);
  await writeFileEvents(all);
  return event;
}

export async function revenueEventStats() {
  if (hasDatabase()) {
    return dbRevenueEventStats();
  }

  const events = await readFileEvents();
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = events.filter(
    (e) => new Date(e.createdAt).getTime() >= since,
  );
  const affiliateClicks = week.filter((e) => e.kind === "affiliate_click");

  const byPartner: Record<string, number> = {};
  for (const e of affiliateClicks) {
    const key = e.partner || "unknown";
    byPartner[key] = (byPartner[key] || 0) + 1;
  }

  const byCity: Record<string, number> = {};
  for (const e of affiliateClicks) {
    const key = e.citySlug || "unknown";
    byCity[key] = (byCity[key] || 0) + 1;
  }

  const byProduct: Record<string, number> = {};
  for (const e of affiliateClicks) {
    const key = e.productId || "unknown";
    byProduct[key] = (byProduct[key] || 0) + 1;
  }

  return {
    affiliateClicks7d: affiliateClicks.length,
    affiliateClicksAll: events.filter((e) => e.kind === "affiliate_click")
      .length,
    byPartner: Object.entries(byPartner)
      .map(([partner, clicks]) => ({ partner, clicks }))
      .sort((a, b) => b.clicks - a.clicks),
    byCity: Object.entries(byCity)
      .map(([citySlug, clicks]) => ({ citySlug, clicks }))
      .sort((a, b) => b.clicks - a.clicks),
    topProducts: Object.entries(byProduct)
      .map(([productId, clicks]) => ({ productId, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 12),
  };
}
