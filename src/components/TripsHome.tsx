"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HereNowPanel } from "@/components/HereNowPanel";
import { LiveTripsPanel } from "@/components/LiveTripsPanel";
import {
  combineUsCities,
  listTemplates,
  personalizeOptions,
  usCityOptions,
  type TripTemplate,
} from "@/lib/trip-templates";

type Door = "home" | "explore" | "combine" | "here" | "live";

const scaleLabel: Record<TripTemplate["scale"], string> = {
  multi_city: "Multi-city",
  country: "USA route",
  city: "City",
  hotel_area: "Hotel area",
  here_now: "I'm here now",
};

function TemplateCard({ t }: { t: TripTemplate }) {
  return (
    <Link
      href={`/trips/${t.slug}`}
      className="group block border border-white/15 bg-white/[0.04] p-5 transition hover:border-amber/50 hover:bg-white/[0.07]"
      style={{ animation: "rise-in 0.45s ease-out both" }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
          {scaleLabel[t.scale]} · {t.days === 1 ? "Same day" : `${t.days} days`}
          {t.region ? ` · ${t.region}` : ""}
        </p>
        {t.travelledRating ? (
          <p className="font-mono text-[10px] text-white/55">
            ★ {t.travelledRating} travelled
          </p>
        ) : null}
      </div>
      <h3 className="mt-3 font-display text-2xl tracking-tight text-white transition group-hover:text-amber">
        {t.title}
      </h3>
      <p className="mt-2 text-sm text-white/65">{t.route}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/75">{t.blurb}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {t.bestFor.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="border border-white/15 px-2 py-1 text-[11px] text-white/60"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-4 flex items-center justify-between font-mono text-[11px] text-white/45">
        <span>
          {t.savedCount.toLocaleString()} saved · {t.recommendPercent}% recommend
        </span>
        <span className="text-amber opacity-0 transition group-hover:opacity-100">
          Open →
        </span>
      </p>
    </Link>
  );
}

function parseDoor(raw: string | null): Door {
  if (
    raw === "explore" ||
    raw === "combine" ||
    raw === "here" ||
    raw === "live"
  )
    return raw;
  return "home";
}

export function TripsHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [door, setDoorState] = useState<Door>(() =>
    parseDoor(searchParams.get("door")),
  );
  const [combineCodes, setCombineCodes] = useState<string[]>(["NYC", "DC"]);
  const [exploreScale, setExploreScale] = useState<
    "all" | "country" | "multi_city" | "city" | "hotel_area"
  >("all");
  const [exploreRegion, setExploreRegion] = useState<string>("all");

  useEffect(() => {
    setDoorState(parseDoor(searchParams.get("door")));
  }, [searchParams]);

  function setDoor(next: Door) {
    setDoorState(next);
    const url = next === "home" ? "/" : `/?door=${next}`;
    router.replace(url, { scroll: false });
  }

  const regions = useMemo(() => {
    const set = new Set(
      listTemplates()
        .map((t) => t.region)
        .filter(Boolean) as string[],
    );
    return ["all", ...Array.from(set).sort()];
  }, []);

  const exploreList = useMemo(() => {
    let list =
      exploreScale === "all"
        ? listTemplates().filter((t) => t.scale !== "here_now")
        : listTemplates({ scale: exploreScale });
    if (exploreRegion !== "all") {
      list = list.filter((t) => t.region === exploreRegion);
    }
    return list;
  }, [exploreScale, exploreRegion]);

  const combineList = useMemo(
    () => combineUsCities(combineCodes),
    [combineCodes],
  );

  const featured = useMemo(
    () =>
      listTemplates().filter((t) =>
        ["nyc-4", "east-coast-classics", "niagara-evening"].includes(t.id),
      ),
    [],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071018] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 15% 10%, rgba(212,160,23,0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 0%, rgba(31,78,121,0.35), transparent 50%), linear-gradient(180deg, #071018 0%, #0c1b2a 45%, #071018 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <button type="button" onClick={() => setDoor("home")} className="text-left">
          <p className="font-display text-2xl tracking-tight sm:text-3xl">
            Tours<span className="text-amber">I</span>Want
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
            United States · Proven trips
          </p>
        </button>
        <nav className="flex items-center gap-3 text-sm text-white/70">
          <button
            type="button"
            onClick={() => setDoor("explore")}
            className="hidden hover:text-white sm:inline"
          >
            Explore
          </button>
          <button
            type="button"
            onClick={() => setDoor("here")}
            className="border border-white/25 px-3 py-2 text-xs font-semibold text-white transition hover:border-amber hover:text-amber sm:text-sm"
          >
            I&apos;m here now
          </button>
          <Link href="/account" className="hover:text-white">
            Account
          </Link>
        </nav>
      </header>

      {door === "home" ? (
        <>
          <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-6xl flex-col justify-center px-5 pb-16 pt-6 sm:px-8">
            <p
              className="font-display text-[clamp(2.6rem,8vw,5.5rem)] leading-[0.95] tracking-tight text-white"
              style={{ animation: "rise-in 0.7s ease-out both" }}
            >
              Tours<span className="text-amber">I</span>Want
            </p>
            <h1
              className="mt-6 max-w-2xl font-display text-[clamp(1.35rem,3.5vw,2.15rem)] leading-snug text-white/90"
              style={{ animation: "rise-in 0.7s ease-out 0.08s both" }}
            >
              Start with a USA trip that already works. Then make it yours.
            </h1>
            <p
              className="mt-4 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg"
              style={{ animation: "rise-in 0.7s ease-out 0.14s both" }}
            >
              Proven templates for American cities, multi-city routes, and
              right-now plans from your hotel — not a blank itinerary.
            </p>
            <div
              className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              style={{ animation: "rise-in 0.7s ease-out 0.2s both" }}
            >
              {(
                [
                  {
                    id: "explore" as const,
                    title: "Explore USA trips",
                    copy: "City, region, and coast-to-coast spines.",
                  },
                  {
                    id: "combine" as const,
                    title: "Combine cities",
                    copy: "NYC + D.C., California, Florida, and more.",
                  },
                  {
                    id: "here" as const,
                    title: "I'm here now",
                    copy: "Type your hotel → time → mood → ready plans.",
                  },
                  {
                    id: "live" as const,
                    title: "Join a group",
                    copy: "See live templates people are already on — join and personalize.",
                  },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDoor(d.id)}
                  className="border border-white/20 bg-white/[0.05] px-5 py-6 text-left transition hover:border-amber hover:bg-amber/10 sm:col-span-1"
                >
                  <p className="font-display text-xl text-white">{d.title}</p>
                  <p className="mt-2 text-sm text-white/60">{d.copy}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="relative z-10 mx-auto w-full max-w-6xl border-t border-white/10 px-5 py-16 sm:px-8">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-2 max-w-xl text-white/60">
              Built for travel across the United States — structure stays,
              experiences swap.
            </p>
            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Pick a proven USA trip",
                  c: "Start from a template people already travel — not an empty calendar.",
                },
                {
                  n: "02",
                  t: "Swap flexible days",
                  c: "Faith, food, fun, free time — change a day without breaking the spine.",
                },
                {
                  n: "03",
                  t: "Share, vote, book",
                  c: "Send one link to the group. Vote on slots. Book paid pieces when useful.",
                },
              ].map((step) => (
                <li key={step.n} className="border-l border-amber/40 pl-4">
                  <p className="font-mono text-[11px] text-amber">{step.n}</p>
                  <p className="mt-2 font-display text-xl">{step.t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {step.c}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl tracking-tight">
                  Start here
                </h2>
                <p className="mt-2 text-white/60">
                  Three USA templates that show the product.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDoor("explore")}
                className="font-mono text-xs uppercase tracking-[0.16em] text-amber hover:text-white"
              >
                See all USA trips →
              </button>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {featured.map((t) => (
                <TemplateCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {door !== "home" ? (
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 pt-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setDoor("home")}
              className="font-mono text-xs uppercase tracking-[0.16em] text-white/50 hover:text-amber"
            >
              ← Home
            </button>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["explore", "Explore USA"],
                  ["combine", "Combine cities"],
                  ["here", "I'm here now"],
                  ["live", "Join a group"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDoor(id)}
                  className={`border px-3 py-1.5 text-xs transition sm:text-sm ${
                    door === id
                      ? "border-amber bg-amber text-ink"
                      : "border-white/20 text-white/65 hover:border-white/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {door === "explore" ? (
            <div className="mt-8">
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                Explore USA trips
              </h2>
              <p className="mt-2 max-w-xl text-white/60">
                Pick a template that already works across American cities and
                regions. Personalize flexible days next.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All"],
                    ["country", "USA routes"],
                    ["multi_city", "Multi-city"],
                    ["city", "City"],
                    ["hotel_area", "Hotel area"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setExploreScale(id)}
                    className={`border px-3 py-2 text-sm transition ${
                      exploreScale === id
                        ? "border-amber bg-amber text-ink"
                        : "border-white/20 text-white/70 hover:border-white/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {regions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setExploreRegion(r)}
                    className={`border px-3 py-1.5 text-xs transition ${
                      exploreRegion === r
                        ? "border-white/50 bg-white/10 text-white"
                        : "border-white/10 text-white/50 hover:border-white/30"
                    }`}
                  >
                    {r === "all" ? "All regions" : r}
                  </button>
                ))}
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {exploreList.map((t) => (
                  <TemplateCard key={t.id} t={t} />
                ))}
              </div>
            </div>
          ) : null}

          {door === "combine" ? (
            <div className="mt-8">
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                Combine cities
              </h2>
              <p className="mt-2 max-w-xl text-white/60">
                Multi-city USA templates first — not single cities glued together
                later.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {usCityOptions.map(({ code, label }) => {
                  const on = combineCodes.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() =>
                        setCombineCodes((prev) =>
                          on
                            ? prev.filter((c) => c !== code)
                            : [...prev, code],
                        )
                      }
                      className={`border px-3 py-2 text-left text-sm transition ${
                        on
                          ? "border-amber bg-amber text-ink"
                          : "border-white/20 text-white/70"
                      }`}
                    >
                      <span className="font-mono">{code}</span>
                      <span className="ml-2 opacity-80">{label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {combineList.length ? (
                  combineList.map((t) => <TemplateCard key={t.id} t={t} />)
                ) : (
                  <p className="text-white/55">
                    Select cities — try New York + Washington, D.C. or San
                    Francisco + Los Angeles + San Diego.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {door === "here" ? (
            <div className="mt-8">
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                I&apos;m here now
              </h2>
              <p className="mt-2 max-w-xl text-white/60">
                Type the hotel you&apos;re in — or pick a featured stay — then
                tell us how much time you have.
              </p>
              <HereNowPanel />
            </div>
          ) : null}

          {door === "live" ? (
            <div className="mt-8">
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                Join a group
              </h2>
              <p className="mt-2 max-w-xl text-white/60">
                See templates people are already travelling with — join their
                room, then personalize flexible days to suit you.
              </p>
              <LiveTripsPanel />
            </div>
          ) : null}

          <details className="mt-14 border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-display text-lg text-white/80">
              What you can personalize on a trip
            </summary>
            <ul className="mt-4 grid gap-2 text-sm text-white/55 sm:grid-cols-2">
              {personalizeOptions.map((o) => (
                <li key={o.id}>· {o.label}</li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}
    </div>
  );
}
