import { NextResponse } from "next/server";
import { listUsers, requireAdmin } from "@/lib/auth";
import { dbPageViewStats, hasDatabase } from "@/lib/db";
import { listRequests } from "@/lib/requests-store";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const [users, requests] = await Promise.all([
    listUsers(500),
    listRequests(),
  ]);

  const live = requests.filter((item) => item.source === "live");
  const visitors = hasDatabase()
    ? await dbPageViewStats()
    : {
        allTime: 0,
        last24h: 0,
        last7d: 0,
        last30d: 0,
        uniqueSessions24h: 0,
        topPaths: [],
      };

  return NextResponse.json({
    members: {
      total: users.length,
      travellers: users.filter((u) => u.role === "traveller").length,
      operators: users.filter((u) => u.role === "operator").length,
      admins: users.filter((u) => u.role === "admin").length,
    },
    requests: {
      total: requests.length,
      live: live.length,
      open: live.filter((item) => (item.status || "open") !== "responded")
        .length,
      responded: live.filter((item) => item.status === "responded").length,
    },
    visitors,
    recentUsers: users.slice(0, 8),
    recentLiveRequests: live.slice(0, 8),
  });
}
