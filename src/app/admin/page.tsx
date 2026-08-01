import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoleSelect } from "@/components/AdminRoleSelect";
import { isPlatformAdminEmail, roleLabel } from "@/lib/admin";
import { listUsers, requireAdmin } from "@/lib/auth";
import { dbPageViewStats, hasDatabase } from "@/lib/db";
import { listRequests } from "@/lib/requests-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect(`/join?next=${encodeURIComponent("/admin")}`);
  }

  const [users, requests, visitors] = await Promise.all([
    listUsers(300),
    listRequests(),
    hasDatabase()
      ? dbPageViewStats()
      : Promise.resolve({
          allTime: 0,
          last24h: 0,
          last7d: 0,
          last30d: 0,
          uniqueSessions24h: 0,
          topPaths: [] as { path: string; views: number }[],
        }),
  ]);

  const live = requests.filter((item) => item.source === "live");
  const openLive = live.filter(
    (item) => (item.status || "open") !== "responded",
  );

  const stats = [
    { label: "Members", value: users.length },
    { label: "Operators", value: users.filter((u) => u.role === "operator").length },
    { label: "Live requests", value: live.length },
    { label: "Awaiting reply", value: openLive.length },
    { label: "Visits 24h", value: visitors.last24h },
    { label: "Visits 7d", value: visitors.last7d },
    { label: "Unique 24h", value: visitors.uniqueSessions24h },
    { label: "Visits all-time", value: visitors.allTime },
  ];

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_35%)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/?menu=pulse"
              className="mb-4 inline-flex text-sm font-semibold text-skyline underline-offset-2 hover:underline"
            >
              ← Back to live board
            </Link>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
              Admin · ToursIWant
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
              Platform monitor
            </h1>
            <p className="mt-3 max-w-2xl text-ink-soft">
              Signed in as {admin.email}. You can use traveller tools, the
              operator lead inbox, and this admin console.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/?menu=account"
              className="border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-white"
            >
              Traveller account
            </Link>
            <Link
              href="/operator"
              className="border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-white"
            >
              Operator inbox
            </Link>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noreferrer"
              className="bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
            >
              Google Analytics
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-ink/10 bg-white/70 px-5 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-stone">
                {stat.label}
              </p>
              <p className="mt-2 font-display text-3xl text-ink">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-ink">Top paths · 7 days</h2>
            <p className="mt-2 text-sm text-ink-soft">
              On-site page views tracked by ToursIWant (separate from Google
              Analytics).
            </p>
            <ul className="mt-4 space-y-2">
              {visitors.topPaths.length === 0 ? (
                <li className="border border-ink/10 bg-white/70 p-4 text-sm text-ink-soft">
                  No visits recorded yet — browse the public site to seed data.
                </li>
              ) : (
                visitors.topPaths.map((row) => (
                  <li
                    key={row.path}
                    className="flex items-center justify-between gap-3 border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                  >
                    <span className="truncate font-mono text-ink">{row.path}</span>
                    <span className="shrink-0 font-semibold text-ink">
                      {row.views}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl text-ink">Live requests</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Latest real traveller captures across the marketplace.
            </p>
            <ul className="mt-4 space-y-2">
              {live.length === 0 ? (
                <li className="border border-ink/10 bg-white/70 p-4 text-sm text-ink-soft">
                  No live requests yet.
                </li>
              ) : (
                live.slice(0, 10).map((item) => (
                  <li
                    key={item.id}
                    className="border border-ink/10 bg-white/80 px-4 py-3 text-sm"
                  >
                    <p className="font-semibold text-ink">
                      {item.tourTitle ||
                        item.eventName ||
                        item.details?.slice(0, 50) ||
                        item.type}
                    </p>
                    <p className="mt-1 text-ink-soft">
                      {item.name} · {item.email}
                      {item.status === "responded" ? " · Replied" : " · Open"}
                    </p>
                  </li>
                ))
              )}
            </ul>
            <Link
              href="/operator"
              className="mt-4 inline-flex text-sm font-semibold text-skyline underline-offset-2 hover:underline"
            >
              Open operator inbox →
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Members</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Change roles anytime. {isPlatformAdminEmail(admin.email)
              ? "Your owner email stays admin."
              : null}
          </p>
          <div className="mt-6 overflow-x-auto border border-ink/10 bg-white/80">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-paper/80 text-xs uppercase tracking-wider text-stone">
                <tr>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-ink/5">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">
                        {user.name || user.email.split("@")[0]}
                      </p>
                      <p className="text-ink-soft">{user.email}</p>
                      {user.businessName ? (
                        <p className="text-xs text-stone">{user.businessName}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <AdminRoleSelect
                        userId={user.id}
                        email={user.email}
                        role={user.role}
                      />
                      <p className="mt-1 text-[11px] text-stone">
                        {roleLabel(user.role)}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone">
                      {new Date(user.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
