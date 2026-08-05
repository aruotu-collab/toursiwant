"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  compareCities,
  comparePriorities,
  formatDuration,
  formatFromPrice,
  nycQuickSearches,
  triLabel,
  type ComparePriority,
  type CompareResult,
  type ScoredTour,
} from "@/lib/tour-compare";

export function TourIntelligenceApp() {
  const [query, setQuery] = useState("Statue of Liberty");
  const [citySlug, setCitySlug] = useState("new-york");
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [budget, setBudget] = useState<number | "">("");
  const [priority, setPriority] = useState<ComparePriority>("overall");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const comparedTours = useMemo(() => {
    if (!result) return [];
    return result.shortlist.filter((t) => compareIds.includes(t.id)).slice(0, 5);
  }, [result, compareIds]);

  async function runCompare(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setCompareIds([]);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          citySlug,
          date: date || undefined,
          adults,
          children,
          budgetPerPerson: budget === "" ? null : budget,
          priority,
        }),
      });
      const data = (await res.json()) as CompareResult & { error?: string };
      if (!res.ok) {
        setError(data.error || "Comparison failed.");
        setResult(null);
        return;
      }
      setResult(data);
      if (data.error && !data.shortlist.length) setError(data.error);
    } catch {
      setError("Network error — try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="min-h-dvh bg-[#070f18] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="font-display text-xl tracking-tight sm:text-2xl">
              Tours<span className="text-amber">I</span>Want
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
              Tour Intelligence
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-xs text-white/65 sm:text-sm">
            <a href="#compare" className="hover:text-white">
              Compare tours
            </a>
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber">
            We compare the tours. You choose the experience.
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-white sm:text-5xl">
            Find the tour that fits you — not 80 nearly identical listings.
          </h1>
          <p className="mt-4 text-base text-white/65 sm:text-lg">
            Tell us where you&apos;re going and what matters. We analyse Viator
            inventory and show the strongest choices — with reasons, trade-offs,
            and estimated group totals.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-white/50">
            <li>✓ Price</li>
            <li>✓ Reviews</li>
            <li>✓ What&apos;s included</li>
            <li>✓ Schedule signals</li>
            <li>✓ Overall value</li>
          </ul>
        </section>

        <section
          id="compare"
          className="mt-10 scroll-mt-8 border border-amber/30 bg-amber/[0.04] p-5 sm:p-7"
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
            Set what matters → scan tours → see the edge
          </p>
          <form onSubmit={runCompare} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
                Where or what would you like to visit?
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Statue of Liberty, Central Park, food tour…"
                className="w-full border border-white/15 bg-[#0a1520] px-4 py-3.5 text-base text-white outline-none placeholder:text-white/35 focus:border-amber/50"
                required
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {nycQuickSearches.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setQuery(item.query);
                    setCitySlug(item.citySlug);
                  }}
                  className="border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:border-amber/40 hover:text-amber"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
                  Destination
                </span>
                <select
                  value={citySlug}
                  onChange={(e) => setCitySlug(e.target.value)}
                  className="w-full border border-white/15 bg-[#0a1520] px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-amber/50"
                >
                  {compareCities.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
                  Date (optional)
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-white/15 bg-[#0a1520] px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-amber/50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
                  Adults
                </span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value) || 1)}
                  className="w-full border border-white/15 bg-[#0a1520] px-3 py-2.5 text-sm text-white outline-none focus:border-amber/50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
                  Children
                </span>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value) || 0)}
                  className="w-full border border-white/15 bg-[#0a1520] px-3 py-2.5 text-sm text-white outline-none focus:border-amber/50"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
                  Max price / person (optional)
                </span>
                <input
                  type="number"
                  min={20}
                  placeholder="e.g. 100"
                  value={budget}
                  onChange={(e) =>
                    setBudget(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full border border-white/15 bg-[#0a1520] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber/50"
                />
              </label>
              <fieldset>
                <legend className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-white/45">
                  What matters most?
                </legend>
                <div className="flex flex-wrap gap-2">
                  {comparePriorities.map((p) => {
                    const active = priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`border px-2.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-amber bg-amber text-ink"
                            : "border-white/15 text-white/70 hover:border-white/35"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-amber px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:opacity-60"
            >
              {loading ? "Scanning tours…" : "Compare tours"}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-amber">{error}</p> : null}
        </section>

        {result ? (
          <section className="mt-10 space-y-8">
            <div className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-amber">
                Tour Intelligence — {result.query}
              </p>
              <p className="mt-2 font-display text-3xl text-white">
                We analysed {result.funnel.analysed} tours
              </p>
              <p className="mt-1 text-sm text-white/55">
                {result.cityName}
                {result.env ? ` · ${result.env}` : ""} · affiliate inventory
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <FunnelStat
                  label="Analysed"
                  value={result.funnel.analysed}
                />
                <FunnelStat
                  label="Within budget lens"
                  value={result.funnel.afterBudget}
                />
                <FunnelStat
                  label="After duration/rating"
                  value={result.funnel.afterDuration}
                />
                <FunnelStat
                  label="Strongest matches"
                  value={result.funnel.afterPreferences}
                  highlight
                />
              </div>
            </div>

            {result.awards.length > 0 ? (
              <div>
                <h2 className="font-display text-2xl text-white">
                  Your best matches
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  Awards from the same scan — different travellers, different winners.
                </p>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {result.awards.map((item) => (
                    <AwardCard
                      key={`${item.award}-${item.tour.id}`}
                      label={item.label}
                      tour={item.tour}
                      selected={compareIds.includes(item.tour.id)}
                      onToggleCompare={() => toggleCompare(item.tour.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {result.shortlist.length > 0 ? (
              <div>
                <h2 className="font-display text-2xl text-white">
                  Ranked shortlist
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  Select up to 5 for side-by-side comparison.
                </p>
                <ul className="mt-4 space-y-3">
                  {result.shortlist.map((tour, index) => (
                    <li
                      key={tour.id}
                      className="border border-white/10 bg-white/[0.03] p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-amber">
                            #{index + 1} · {tour.matchPercent}% match · quality{" "}
                            {tour.qualityScore} · fit {tour.fitScore}
                          </p>
                          <h3 className="mt-1 font-semibold text-white">
                            {tour.title}
                          </h3>
                          <p className="mt-1 text-sm text-white/55">
                            {formatFromPrice(tour)} · {formatDuration(tour.durationMinutes)}
                            {tour.rating != null
                              ? ` · ${tour.rating.toFixed(1)}★ (${tour.reviewCount.toLocaleString()} reviews)`
                              : ""}
                          </p>
                          <p className="mt-1 text-xs text-white/45">
                            {tour.groupPriceLabel}
                          </p>
                          <p className="mt-2 text-sm text-white/70">{tour.whyWins}</p>
                          {tour.whyNotHigher ? (
                            <p className="mt-2 text-xs text-white/45">
                              Why not higher: {tour.whyNotHigher}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCompare(tour.id)}
                            className={`border px-3 py-2 text-xs font-semibold ${
                              compareIds.includes(tour.id)
                                ? "border-amber bg-amber/20 text-amber"
                                : "border-white/20 text-white/80 hover:bg-white/5"
                            }`}
                          >
                            {compareIds.includes(tour.id)
                              ? "In compare"
                              : "Compare"}
                          </button>
                          <Link
                            href={tour.bookingPath}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="bg-amber px-3 py-2 text-center text-xs font-semibold text-ink hover:bg-amber-deep"
                          >
                            Book on Viator →
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {comparedTours.length >= 2 ? (
              <SideBySide tours={comparedTours} />
            ) : null}

            <p className="text-xs text-white/40">
              ToursIWant may earn a commission when you book through our links, at
              no additional cost to you. Affiliate commission does not determine
              our comparison rankings. Prices shown are from-prices — verify the
              final amount on Viator.
            </p>
          </section>
        ) : null}

        <section id="how" className="mt-16 max-w-2xl scroll-mt-8 border-t border-white/10 pt-10">
          <h2 className="font-display text-2xl text-white">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm text-white/65">
            <li>
              <span className="font-semibold text-amber">1 · Set what matters</span>{" "}
              — destination, travellers, budget, priority.
            </li>
            <li>
              <span className="font-semibold text-amber">2 · Scan</span> — we pull
              live Viator inventory for that market.
            </li>
            <li>
              <span className="font-semibold text-amber">3 · See the edge</span> —
              awards, match %, why it wins, and what to watch.
            </li>
            <li>
              <span className="font-semibold text-amber">4 · Book</span> — checkout
              on Viator via our tracked link.
            </li>
          </ol>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
        ToursIWant · We compared the tours so you don&apos;t have to.
      </footer>
    </div>
  );
}

function FunnelStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border px-3 py-3 ${
        highlight
          ? "border-amber/40 bg-amber/10"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl text-white">{value}</p>
    </div>
  );
}

function AwardCard({
  label,
  tour,
  selected,
  onToggleCompare,
}: {
  label: string;
  tour: ScoredTour;
  selected: boolean;
  onToggleCompare: () => void;
}) {
  return (
    <article className="border border-white/10 bg-white/[0.03] p-5">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber">
        {label} · {tour.matchPercent}% fit
      </p>
      <h3 className="mt-2 font-display text-xl text-white">{tour.title}</h3>
      <p className="mt-1 text-sm text-white/60">
        {formatFromPrice(tour)}
        {tour.priceFrom != null ? "/person" : ""} ·{" "}
        {formatDuration(tour.durationMinutes)}
        {tour.rating != null ? ` · ${tour.rating.toFixed(1)}★` : ""}
      </p>
      <p className="mt-1 text-xs text-white/45">{tour.groupPriceLabel}</p>

      <div className="mt-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
          Why it wins
        </p>
        <p className="mt-1 text-sm text-white/75">{tour.whyWins}</p>
        {tour.likes.length ? (
          <ul className="mt-2 space-y-1 text-sm text-emerald-300/90">
            {tour.likes.map((l) => (
              <li key={l}>✓ {l}</li>
            ))}
          </ul>
        ) : null}
        {tour.watchOuts.length ? (
          <ul className="mt-2 space-y-1 text-sm text-amber/80">
            {tour.watchOuts.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToggleCompare}
          className={`border px-3 py-2 text-xs font-semibold ${
            selected
              ? "border-amber bg-amber/20 text-amber"
              : "border-white/20 text-white/80"
          }`}
        >
          {selected ? "In compare" : "Compare"}
        </button>
        <Link
          href={tour.bookingPath}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="bg-amber px-3 py-2 text-xs font-semibold text-ink hover:bg-amber-deep"
        >
          Book on Viator →
        </Link>
      </div>
    </article>
  );
}

function SideBySide({ tours }: { tours: ScoredTour[] }) {
  const rows: { label: string; cell: (t: ScoredTour) => string }[] = [
    { label: "Match", cell: (t) => `${t.matchPercent}%` },
    { label: "From price", cell: (t) => formatFromPrice(t) },
    { label: "Group est.", cell: (t) => t.groupPriceLabel },
    { label: "Duration", cell: (t) => formatDuration(t.durationMinutes) },
    {
      label: "Rating",
      cell: (t) =>
        t.rating != null
          ? `${t.rating.toFixed(1)}★ (${t.reviewCount.toLocaleString()})`
          : "—",
    },
    { label: "Hotel pickup", cell: (t) => triLabel(t.hotelPickup) },
    { label: "Admission", cell: (t) => triLabel(t.admissionIncluded) },
    { label: "Guide", cell: (t) => triLabel(t.guideIncluded) },
    { label: "Ellis Island", cell: (t) => triLabel(t.ellisIsland) },
    { label: "Cancellation", cell: (t) => triLabel(t.flexibleCancellation) },
  ];

  return (
    <div className="overflow-x-auto border border-white/10">
      <p className="border-b border-white/10 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-amber">
        See the difference · side-by-side
      </p>
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-wider text-white/45">
              Field
            </th>
            {tours.map((t) => (
              <th key={t.id} className="max-w-[12rem] px-3 py-3 font-semibold text-white">
                {t.title.slice(0, 42)}
                {t.title.length > 42 ? "…" : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-white/10">
              <td className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider text-white/45">
                {row.label}
              </td>
              {tours.map((t) => (
                <td key={t.id} className="px-3 py-2.5 text-white/80">
                  {row.cell(t)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="px-3 py-3" />
            {tours.map((t) => (
              <td key={t.id} className="px-3 py-3">
                <Link
                  href={t.bookingPath}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="text-xs font-semibold text-amber hover:underline"
                >
                  Book →
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
