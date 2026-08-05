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
  const replies = requests.filter(
    (item) => item.status === "responded" && item.operatorReply,
  );
  const firstName = user.name?.split(" ")[0] || user.email.split("@")[0];

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_40%)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/?menu=near"
              className="mb-4 inline-flex text-sm font-semibold text-skyline underline-offset-2 hover:underline"
            >
              ← Back to Near you
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
              {user.role === "operator" || user.role === "admin"
                ? user.role === "admin"
                  ? " · Admin"
                  : " · Operator"
                : " · Traveller"}
              . When an operator replies, you get an email and it shows below.
            </p>
          </div>
          <AccountLogoutButton />
        </div>

        {user.role === "admin" ? (
          <div className="mt-8 flex flex-wrap gap-3 border border-skyline/20 bg-skyline/5 p-5">
            <p className="w-full text-sm text-ink-soft">
              Admin access — you can use traveller tools, the operator inbox, and
              the platform console.
            </p>
            <Link
              href="/admin"
              className="bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
            >
              Admin console
            </Link>
            <Link
              href="/operator"
              className="border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-white"
            >
              Operator inbox
            </Link>
            <Link
              href="/?menu=admin"
              className="border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-white"
            >
              Admin board menu
            </Link>
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="border border-ink/10 bg-white/70 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              Your requests
            </p>
            <p className="mt-2 font-display text-3xl text-ink">
              {requests.length}
            </p>
          </div>
          <div className="border border-ink/10 bg-white/70 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              Operator replies
            </p>
            <p className="mt-2 font-display text-3xl text-ink">
              {replies.length}
            </p>
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
        </div>

        {replies.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl text-ink">New replies</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Operators responded to these requests. Check your email too — same
              message is sent there.
            </p>
            <ul className="mt-6 space-y-3">
              {replies.map((item) => {
                const from =
                  item.operatorBusinessName ||
                  item.operatorName ||
                  "Operator";
                return (
                  <li
                    key={`reply-${item.id}`}
                    className="border border-skyline/25 bg-skyline/5 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-skyline">
                          Operator responded
                        </p>
                        <p className="mt-1 font-display text-xl text-ink">
                          {item.tourTitle ||
                            item.eventName ||
                            item.details?.slice(0, 70) ||
                            "Your request"}
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">
                          From {from}
                          {item.travelDate ? ` · ${item.travelDate}` : ""}
                        </p>
                      </div>
                      {item.operatorReplyAt ? (
                        <p className="font-mono text-xs text-stone">
                          {new Date(item.operatorReplyAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                    {item.operatorQuote ? (
                      <p className="mt-3 text-sm font-semibold text-ink">
                        Quote: {item.operatorQuote}
                      </p>
                    ) : null}
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                      {item.operatorReply}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Your activity</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Live requests linked to {user.email}. Status updates when an
            operator sends a quote on ToursIWant.
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
              {requests.map((item) => {
                const responded =
                  item.status === "responded" && item.operatorReply;
                return (
                  <li
                    key={item.id}
                    className="border border-ink/10 bg-white/80 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-amber-deep">
                            {typeLabel(item.type)}
                          </p>
                          {responded ? (
                            <span className="bg-skyline px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                              Operator replied
                            </span>
                          ) : (
                            <span className="border border-ink/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone">
                              Waiting for operator
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-display text-xl text-ink">
                          {item.tourTitle ||
                            item.eventName ||
                            item.details?.slice(0, 70) ||
                            "Your request"}
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">
                          {item.travelDate ? `Date ${item.travelDate}` : null}
                          {item.groupSize
                            ? ` · ${item.groupSize} travellers`
                            : null}
                          {item.pickup ? ` · Pickup: ${item.pickup}` : null}
                        </p>
                      </div>
                      <p className="font-mono text-xs text-stone">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {responded ? (
                      <div className="mt-4 border-l-2 border-skyline/40 bg-paper/80 px-4 py-3">
                        {(item.operatorBusinessName || item.operatorName) && (
                          <p className="text-xs font-semibold uppercase tracking-wider text-skyline">
                            From{" "}
                            {item.operatorBusinessName || item.operatorName}
                          </p>
                        )}
                        {item.operatorQuote ? (
                          <p className="mt-1 text-sm font-semibold text-ink">
                            Quote: {item.operatorQuote}
                          </p>
                        ) : null}
                        <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
                          {item.operatorReply}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-ink-soft">
                        You’ll get an email when an operator responds — and the
                        reply will appear here.
                      </p>
                    )}
                    {item.tourSlug ? (
                      <Link
                        href={`/tours/${item.tourSlug}${item.travelDate ? `?date=${item.travelDate}` : ""}`}
                        className="mt-3 inline-flex text-sm font-semibold text-skyline underline-offset-2 hover:underline"
                      >
                        View tour →
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
