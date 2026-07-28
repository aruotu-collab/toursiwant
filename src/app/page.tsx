import Image from "next/image";
import Link from "next/link";
import { TourMarketBoard } from "@/components/TourMarketBoard";
import { TourRushBoard } from "@/components/TourRushBoard";
import { cities, launchCity } from "@/lib/cities";

export default function HomePage() {
  const upcoming = cities.filter((city) => city.status === "coming_soon");

  return (
    <main className="flex-1">
      <h1 className="sr-only">ToursIWant — New York tour rush and live demand</h1>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={launchCity.heroImage}
            alt={launchCity.heroImageAlt}
            fill
            priority
            className="hero-pan object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,27,42,0.88)_0%,rgba(12,27,42,0.72)_55%,rgba(12,27,42,0.45)_100%)]" />
          <div className="grain pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-soft-light" />
        </div>

        <div className="relative mx-auto flex w-full max-w-[90rem] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5 sm:px-8">
          <p className="shrink-0 font-display text-xl tracking-tight text-white sm:text-2xl">
            Tours<span className="text-amber">I</span>Want
          </p>

          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:flex-nowrap">
            <a
              href="#rush"
              className="inline-flex items-center justify-center bg-amber px-4 py-2 text-xs font-semibold tracking-wide text-ink transition hover:bg-amber-deep sm:text-sm"
            >
              Jump to live seats
            </a>
            <Link
              href="/request"
              className="inline-flex items-center justify-center border border-white/35 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-sm transition hover:bg-white/20 sm:text-sm"
            >
              Request a custom tour
            </Link>
            <Link
              href="/tours"
              className="hidden items-center justify-center px-2 py-2 text-xs font-medium text-white/75 transition hover:text-white md:inline-flex"
            >
              Find tours
            </Link>
            <Link
              href="/request?intent=operator"
              className="hidden items-center justify-center px-2 py-2 text-xs font-medium text-white/75 transition hover:text-white lg:inline-flex"
            >
              Operators
            </Link>
          </div>
        </div>
      </section>

      <TourRushBoard />

      <div id="market">
        <TourMarketBoard />
      </div>
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
              How it works
            </p>
            <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
              Discover. Request. Join.
            </h2>
            <p className="mt-4 max-w-lg text-ink-soft">
              ToursIWant is tourism intelligence — not a static brochure. Watch
              demand, pick a date, and match with New York operators who can
              actually run the experience.
            </p>
          </div>
          <ol className="space-y-6">
            {[
              {
                step: "01",
                title: "Read the market",
                copy: "See which destinations are hot, how many groups are planning visits, and where seats are filling.",
              },
              {
                step: "02",
                title: "Jump on a rush lot",
                copy: "Countdowns, seats left, and live interest — claim before the departure window closes.",
              },
              {
                step: "03",
                title: "Go with locals",
                copy: "Verified operators respond with pricing, meeting points, and availability — today or months ahead.",
              },
            ].map((item) => (
              <li key={item.step} className="grid grid-cols-[auto_1fr] gap-4">
                <span className="font-display text-2xl text-amber">{item.step}</span>
                <div>
                  <h3 className="font-display text-xl text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    {item.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,var(--paper)_0%,var(--mist)_100%)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
            Launch city
          </p>
          <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
            New York first. Then the world.
          </h2>
          <p className="mt-4 max-w-2xl text-ink-soft">
            We start where demand and operator density are highest, then open
            London, Florida, Hong Kong, and more — same intelligence board,
            local operators in each city.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((city) => (
              <article
                key={city.slug}
                className="relative overflow-hidden border border-ink/10 bg-white/70"
              >
                <div className="relative h-36">
                  <Image
                    src={city.heroImage}
                    alt={city.heroImageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-ink/35" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl text-ink">{city.name}</h3>
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        city.status === "live"
                          ? "text-amber-deep"
                          : "text-stone"
                      }`}
                    >
                      {city.status === "live" ? "Live" : "Soon"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{city.tagline}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 text-sm text-ink-soft">
            Next up: {upcoming.map((city) => city.name).join(", ")}.
          </p>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:py-20">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl sm:text-4xl">
              Run tours in New York?
            </h2>
            <p className="mt-3 text-white/75">
              Get verified, publish schedules, and receive demand when
              travellers plan the Met, Liberty, Brooklyn, and more. Early
              operators help shape the board.
            </p>
          </div>
          <Link
            href="/request?intent=operator"
            className="inline-flex items-center justify-center bg-amber px-6 py-3.5 text-sm font-semibold tracking-wide text-ink transition hover:bg-amber-deep"
          >
            Join as an operator
          </Link>
        </div>
      </section>
    </main>
  );
}
