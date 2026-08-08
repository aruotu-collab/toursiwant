import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountLogoutButton } from "@/components/AccountLogoutButton";
import { DeleteSavedTripButton } from "@/components/DeleteSavedTripButton";
import { getCurrentUser } from "@/lib/auth";
import { isNycPlanTrip, openSavedTripHref } from "@/lib/saved-trip-kinds";
import { listScoreboardGroupsForUser } from "@/lib/scoreboard-groups";
import { listSavedTripsForUser } from "@/lib/saved-trips";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/join?next=${encodeURIComponent("/account")}`);
  }

  const { welcome } = await searchParams;
  if (welcome) {
    redirect("/");
  }

  const firstName = user.name?.split(" ")[0] || user.email.split("@")[0];
  const [savedTrips, groupBoards] = await Promise.all([
    listSavedTripsForUser(user.id).catch(() => []),
    listScoreboardGroupsForUser(user.id).catch(() => []),
  ]);

  return (
    <main className="w-full max-w-full flex-1 overflow-x-clip overscroll-x-none bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_40%)] [touch-action:pan-y]">
      <div className="mx-auto w-full max-w-6xl overflow-x-clip px-5 py-[7.5rem] sm:px-8 sm:py-32 lg:py-28">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/scorecard"
              className="mb-4 inline-flex text-sm font-semibold text-skyline underline-offset-2 hover:underline"
            >
              ← Back to Scorecard
            </Link>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
              Member area
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
              Welcome, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-ink-soft">
              Signed in as{" "}
              <span className="font-medium text-ink">{user.email}</span>
              {user.role === "admin" ? " · Admin" : ""}. Group vote boards and
              saved scorecard plans both live here under My trips.
            </p>
          </div>
          <AccountLogoutButton />
        </div>

        {user.role === "admin" ? (
          <div className="mt-8 flex flex-wrap gap-3 border border-skyline/20 bg-skyline/5 p-5">
            <p className="w-full text-sm text-ink-soft">
              Admin access — platform console only (not shown to travellers).
            </p>
            <Link
              href="/admin"
              className="bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
            >
              Admin console
            </Link>
          </div>
        ) : null}

        <section id="my-trips" className="mt-12 scroll-mt-28">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink">My trips</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Active group vote boards, plus scorecard plans you saved.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="/new-york"
                className="text-skyline underline-offset-2 hover:underline"
              >
                New group →
              </Link>
              <Link
                href="/scorecard"
                className="text-skyline underline-offset-2 hover:underline"
              >
                Scorecard →
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-deep">
              Group vote boards
            </h3>
            {groupBoards.length === 0 ? (
              <div className="mt-3 border border-ink/10 bg-white/70 p-6">
                <p className="text-sm text-ink-soft">
                  No group boards on this account yet. Create one while signed
                  in from the New York scoreboard (
                  <span className="font-semibold text-ink">
                    Planning with friends?
                  </span>
                  ). Boards you only voted on before sign-in was required won&apos;t
                  appear — open the invite link again while signed in.
                </p>
                <Link
                  href="/new-york"
                  className="mt-4 inline-flex bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep"
                >
                  Open New York board
                </Link>
              </div>
            ) : (
              <ul className="mt-3 grid gap-4 md:grid-cols-2">
                {groupBoards.map((g) => {
                  const votedPeople = g.voters.filter(
                    (v) => Object.keys(v.votes).length > 0,
                  ).length;
                  return (
                    <li
                      key={g.id}
                      className="border border-amber/35 bg-amber/[0.07] p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone">
                        Group vote · New York
                        {g.role === "host" ? " · Host" : " · Member"}
                      </p>
                      <h3 className="mt-2 font-display text-2xl text-ink">
                        {g.title}
                      </h3>
                      <p className="mt-2 font-mono text-sm text-ink">
                        Code{" "}
                        <span className="bg-white/80 px-1.5 py-0.5 uppercase tracking-wider">
                          {g.shareCode}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text-ink-soft">
                        {votedPeople}/{g.voters.length} voted · {g.placesWanted}{" "}
                        places with Want · you marked {g.myWantCount} Want
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-stone">
                        Created {new Date(g.createdAt).toLocaleString()}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/new-york/group/${g.shareCode}`}
                          className="bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
                        >
                          See votes
                        </Link>
                        {g.placesWanted >= 2 ? (
                          <Link
                            href={`/new-york/plan?group=${encodeURIComponent(g.shareCode)}`}
                            className="border border-ink/20 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-amber"
                          >
                            Build trip
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-10">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-deep">
              Saved plans
            </h3>
            {savedTrips.length === 0 ? (
              <div className="mt-3 border border-ink/10 bg-white/70 p-6">
                <p className="text-sm text-ink-soft">
                  No saved plans yet. From a group board or the solo scoreboard,
                  open the plan builder and tap{" "}
                  <span className="font-semibold text-ink">Save as my trip</span>
                  .
                </p>
              </div>
            ) : (
              <ul className="mt-3 grid gap-4 md:grid-cols-2">
                {savedTrips.map((trip) => {
                  const nyc = isNycPlanTrip(trip);
                  return (
                    <li
                      key={trip.id}
                      className="border border-ink/10 bg-white/70 p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone">
                        {nyc ? "New York plan" : trip.region || "USA"}
                        {trip.cityCodes?.length
                          ? ` · ${trip.cityCodes.join(" · ")}`
                          : ""}
                        {nyc && trip.planDays
                          ? ` · ${trip.planDays} day${trip.planDays === 1 ? "" : "s"}`
                          : ""}
                      </p>
                      <h3 className="mt-2 font-display text-2xl text-ink">
                        {trip.title}
                      </h3>
                      {trip.route ? (
                        <p className="mt-2 text-sm text-ink-soft">{trip.route}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-stone">
                        {nyc
                          ? `${trip.placeSlugs?.length || 0} places from the scoreboard`
                          : `Based on ${trip.templateTitle}`}
                        {trip.sourceShareCode
                          ? " · from a group board"
                          : ""}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-stone">
                        Updated {new Date(trip.updatedAt).toLocaleString()}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={openSavedTripHref(trip)}
                          className="bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
                        >
                          Open my trip
                        </Link>
                        <DeleteSavedTripButton tripId={trip.id} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/scorecard"
            className="border border-ink/10 bg-white/70 px-5 py-5 transition hover:border-skyline/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              Destinations
            </p>
            <p className="mt-2 font-display text-xl text-ink">Open Scorecard →</p>
          </Link>
          <Link
            href="/new-york"
            className="border border-ink/10 bg-white/70 px-5 py-5 transition hover:border-skyline/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              Live board
            </p>
            <p className="mt-2 font-display text-xl text-ink">
              New York Top Places →
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
