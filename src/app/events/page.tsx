import Image from "next/image";
import Link from "next/link";
import {
  formatEventWhen,
  nycEventsThisWeek,
} from "@/lib/events";

export const metadata = {
  title: "Events This Week · New York",
  description:
    "Concerts, sports, theatre, and festivals — request Event Pickup & Return with ToursIWant.",
};

export default function EventsPage() {
  return (
    <main className="flex-1 bg-paper">
      <section className="border-b border-ink/10 bg-[linear-gradient(135deg,var(--ink)_0%,var(--skyline)_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">
            New York · This week
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl text-white sm:text-5xl">
            Events This Week
          </h1>
          <p className="mt-4 max-w-xl text-white/80">
            Don’t fight Midtown after the encore. Request Event Pickup & Return —
            home to venue, then back again when the night ends.
          </p>
          <Link
            href="/events/ride"
            className="mt-8 inline-flex bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
          >
            Request Event Pickup & Return
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {nycEventsThisWeek.map((event) => (
            <article
              key={event.slug}
              className="group overflow-hidden border border-ink/10 bg-white/60 transition hover:border-skyline/40"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.imageAlt}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <p className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-wider text-amber">
                  {event.category}
                </p>
              </div>
              <div className="p-5">
                <h2 className="font-display text-2xl text-ink">{event.name}</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  {event.venue} · {event.neighbourhood}
                </p>
                <p className="mt-1 font-mono text-xs text-stone">
                  {formatEventWhen(event.startsAt)} →{" "}
                  {formatEventWhen(event.endsAt)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {event.summary}
                </p>
                <Link
                  href={`/events/ride?event=${event.slug}`}
                  className="mt-5 inline-flex text-sm font-semibold text-skyline underline-offset-2 hover:underline"
                >
                  Book pickup & return →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
