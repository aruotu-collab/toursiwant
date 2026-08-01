import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listOperatorListings } from "@/lib/listings-store";
import { listRequests } from "@/lib/requests-store";
import { OperatorListingsPanel } from "@/components/OperatorListingsPanel";
import { OperatorLogoutButton } from "@/components/OperatorLogoutButton";
import { OperatorReplyForm } from "@/components/OperatorReplyForm";

export const dynamic = "force-dynamic";

function typeLabel(type: string) {
  switch (type) {
    case "tour_interest":
      return "Tour interest";
    case "custom_request":
      return "Custom request";
    case "operator_interest":
      return "Operator signup";
    case "event_ride":
      return "Event pickup & return";
    case "accommodation_request":
      return "Stay near tour";
    default:
      return type;
  }
}

export default async function OperatorDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/join?role=operator&next=/operator");
  }

  if (user.role !== "operator" && user.role !== "admin") {
    redirect("/join?role=operator&next=/operator");
  }

  const requests = await listRequests();
  const leads = requests.filter(
    (item) =>
      item.type !== "operator_interest" &&
      (item.source === "live" || item.source === "mock"),
  );

  const liveLeads = leads.filter((item) => item.source === "live");
  const awaitingReply = liveLeads.filter(
    (item) => (item.status || "open") !== "responded",
  );
  const stayLeads = leads.filter(
    (item) => item.needAccommodation || item.type === "accommodation_request",
  );
  const eventLeads = leads.filter((item) => item.type === "event_ride");
  const myListings = await listOperatorListings(user.id);
  const myListingsCount = myListings.filter(
    (item) => item.status === "published",
  ).length;

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_35%)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
              Operator · USA
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
              Listings & lead inbox
            </h1>
            <p className="mt-3 max-w-xl text-ink-soft">
              Signed in as {user.name || user.email}
              {user.businessName ? ` · ${user.businessName}` : ""}. Publish tours
              (Religious, Museum, Beach…) then reply to traveller leads.
            </p>
          </div>
          <OperatorLogoutButton />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-4">
          {[
            { label: "My listings", value: myListingsCount },
            { label: "All leads", value: leads.length },
            { label: "Awaiting reply", value: awaitingReply.length },
            {
              label: "Events + stays",
              value: eventLeads.length + stayLeads.length,
            },
          ].map((stat) => (
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

        <OperatorListingsPanel />

        <div className="mt-12">
          <h2 className="font-display text-2xl text-ink">Lead inbox</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Reply on ToursIWant to email the traveller — they see it in Account.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {leads.length === 0 ? (
            <p className="border border-ink/10 bg-white/70 p-8 text-ink-soft">
              No leads yet. When travellers submit requests, they appear here.
            </p>
          ) : (
            leads.slice(0, 80).map((lead) => {
              const responded =
                lead.status === "responded" && lead.operatorReply;
              return (
                <article
                  key={lead.id}
                  className="border border-ink/10 bg-white/80 p-5 transition hover:border-skyline/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-deep">
                          {typeLabel(lead.type)}
                        </span>
                        {lead.source === "live" ? (
                          <span className="bg-skyline px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                            Live
                          </span>
                        ) : (
                          <span className="border border-ink/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone">
                            Seed
                          </span>
                        )}
                        {responded ? (
                          <span className="border border-skyline/30 bg-skyline/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-skyline">
                            Replied
                          </span>
                        ) : lead.source === "live" ? (
                          <span className="border border-amber/50 bg-amber/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
                            Needs reply
                          </span>
                        ) : null}
                        {lead.needAccommodation ? (
                          <span className="border border-amber/40 bg-amber/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
                            Stay near
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-2 font-display text-xl text-ink">
                        {lead.tourTitle ||
                          lead.eventName ||
                          lead.details?.slice(0, 60) ||
                          "Traveller request"}
                      </h2>
                      <p className="mt-1 text-sm text-ink-soft">
                        {lead.name} · {lead.email}
                        {lead.phone ? ` · ${lead.phone}` : ""}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-stone">
                      {new Date(lead.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
                    {lead.travelDate ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone">
                          Date
                        </dt>
                        <dd>{lead.travelDate}</dd>
                      </div>
                    ) : null}
                    {lead.groupSize ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone">
                          Group
                        </dt>
                        <dd>{lead.groupSize}</dd>
                      </div>
                    ) : null}
                    {lead.pickup ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone">
                          Pickup
                        </dt>
                        <dd>{lead.pickup}</dd>
                      </div>
                    ) : null}
                    {lead.returnAddress ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone">
                          Return to
                        </dt>
                        <dd>{lead.returnAddress}</dd>
                      </div>
                    ) : null}
                    {lead.eventStart ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-stone">
                          Event window
                        </dt>
                        <dd>
                          {lead.eventStart}
                          {lead.eventEnd ? ` → ${lead.eventEnd}` : ""}
                        </dd>
                      </div>
                    ) : null}
                    {lead.accommodationNotes ? (
                      <div className="sm:col-span-2">
                        <dt className="text-xs uppercase tracking-wider text-stone">
                          Stay notes
                        </dt>
                        <dd>{lead.accommodationNotes}</dd>
                      </div>
                    ) : null}
                    {lead.details ? (
                      <div className="sm:col-span-2">
                        <dt className="text-xs uppercase tracking-wider text-stone">
                          Details
                        </dt>
                        <dd>{lead.details}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="mt-4 flex flex-wrap items-start gap-3">
                    {lead.source === "live" ? (
                      <OperatorReplyForm
                        requestId={lead.id}
                        travellerName={lead.name}
                        alreadyReplied={Boolean(responded)}
                        existingQuote={lead.operatorQuote}
                        existingReply={lead.operatorReply}
                      />
                    ) : (
                      <p className="text-xs text-stone">
                        Seed demo lead — reply works on live requests only.
                      </p>
                    )}
                    <a
                      href={`mailto:${lead.email}?subject=${encodeURIComponent(
                        `ToursIWant quote: ${lead.tourTitle || lead.eventName || "your request"}`,
                      )}`}
                      className="border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-paper"
                    >
                      Email directly
                    </a>
                    {lead.phone ? (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-paper"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <p className="mt-10 text-sm text-stone">
          Need to update your operator profile?{" "}
          <Link href="/request?intent=operator" className="text-skyline underline">
            Operator interest form
          </Link>
        </p>
      </div>
    </main>
  );
}
