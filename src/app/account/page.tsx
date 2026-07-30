import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountLogoutButton } from "@/components/AccountLogoutButton";
import { getCurrentUser } from "@/lib/auth";
import { listRequestsForEmail } from "@/lib/requests-store";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams: Promise<{ welcome?: string }>;
};

function typeLabel(type: string) {
  switch (type) {
    case "tour_interest":
      return "Tour interest";
    case "custom_request":
      return "Custom request";
    case "event_ride":
      return "Event pickup & return";
    case "accommodation_request":
      return "Stay near tour";
    case "operator_interest":
      return "Operator interest";
    default:
      return type;
  }
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/join?next=${encodeURIComponent("/?menu=account")}`);
  }

  const { welcome } = await searchParams;

  // Prefer the live board after fresh sign-in
  if (welcome) {
    redirect("/?menu=account");
  }

  const requests = await listRequestsForEmail(user.email);
  const firstName = user.name?.split(" ")[0] || user.email.split("@")[0];

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_40%)]">
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
              Member area
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
              Welcome, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-ink-soft">
              Signed in as <span className="font-medium text-ink">{user.email}</span>
              {user.role === "operator" || user.role === "admin"
                ? " · Operator"
                : " · Traveller"}
              . Track your requests and continue browsing New York tours.
            </p>
          </div>
          <AccountLogoutButton />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="border border-ink/10 bg-white/70 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              Your requests
            </p>
            <p className="mt-2 font-display text-3xl text-ink">{requests.length}</p>
          </div>
          <Link
            href="/tours"
            className="border border-ink/10 bg-white/70 px-5 py-4 transition hover:border-skyline/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              Browse
            </p>
            <p className="mt-2 font-display text-xl text-ink">Find tours →</p>
          </Link>
          <Link
            href={user.role === "operator" || user.role === "admin" ? "/operator" : "/events"}
            className="border border-ink/10 bg-white/70 px-5 py-4 transition hover:border-skyline/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              {user.role === "operator" || user.role === "admin"
                ? "Operator"
                : "Tonight"}
            </p>
            <p className="mt-2 font-display text-xl text-ink">
              {user.role === "operator" || user.role === "admin"
                ? "Lead inbox →"
                : "Events this week →"}
            </p>
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Your activity</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Live requests linked to {user.email}. Quotes from operators will show
            up here as the marketplace grows.
          </p>

          {requests.length === 0 ? (
            <div className="mt-6 border border-ink/10 bg-white/70 p-8">
              <p className="text-ink-soft">
                No saved requests yet for this email.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/tours"
                  className="bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep"
                >
                  Browse tours
                </Link>
                <Link
                  href="/request"
                  className="border border-ink/20 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-white"
                >
                  Request a tour
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {requests.map((item) => (
                <li
                  key={item.id}
                  className="border border-ink/10 bg-white/80 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-deep">
                        {typeLabel(item.type)}
                      </p>
                      <p className="mt-1 font-display text-xl text-ink">
                        {item.tourTitle ||
                          item.eventName ||
                          item.details?.slice(0, 70) ||
                          "Your request"}
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {item.travelDate ? `Date ${item.travelDate}` : null}
                        {item.groupSize ? ` · ${item.groupSize} travellers` : null}
                        {item.pickup ? ` · Pickup: ${item.pickup}` : null}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-stone">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {item.tourSlug ? (
                    <Link
                      href={`/tours/${item.tourSlug}${item.travelDate ? `?date=${item.travelDate}` : ""}`}
                      className="mt-3 inline-flex text-sm font-semibold text-skyline underline-offset-2 hover:underline"
                    >
                      View tour →
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
