"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  rankNycPlaces,
  type RankedPlace,
} from "@/lib/nyc-places";
import {
  scoreboardLenses,
  type ScoreboardLens,
} from "@/lib/tiw-score";

export function NycScoreboard({
  initialLens = "overall",
}: {
  initialLens?: ScoreboardLens;
}) {
  const [lens, setLens] = useState<ScoreboardLens>(initialLens);
  const [query, setQuery] = useState("");

  const ranked = useMemo(() => rankNycPlaces(lens), [lens]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.bestFor.some((b) => b.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.includes(q)),
    );
  }, [ranked, query]);

  const active = scoreboardLenses.find((l) => l.id === lens);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-deep">
            Places · {filtered.length} ranked
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            {lens === "overall"
              ? "New York Top Places"
              : `Best for ${active?.label || "you"}`}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft sm:text-base">
            {active?.blurb}. Change the lens — the scoreboard re-ranks from the
            same transparent factors.
          </p>
        </div>
        <label className="block w-full sm:max-w-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone">
            Search the board
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Central Park, food, views…"
            className="mt-1 w-full border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {scoreboardLenses.map((l) => {
          const on = l.id === lens;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setLens(l.id)}
              className={`border px-3 py-1.5 text-sm transition ${
                on
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 bg-white text-ink-soft hover:border-amber hover:text-ink"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden border border-ink/10 bg-white">
        <div className="hidden grid-cols-[4rem_1fr_5.5rem_8rem] gap-3 border-b border-ink/10 bg-paper-deep/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-stone sm:grid sm:px-5">
          <span>Rank</span>
          <span>Place / experience</span>
          <span className="text-right">TIW Score</span>
          <span className="text-right">Best for</span>
        </div>
        <ol>
          {filtered.map((place, i) => (
            <ScoreRow
              key={place.slug}
              place={place}
              stripe={i % 2 === 1}
              lens={lens}
            />
          ))}
        </ol>
        {!filtered.length ? (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">
            No places match this lens and search. Try Overall or clear the
            search.
          </p>
        ) : null}
      </div>

      <p className="text-xs leading-relaxed text-stone">
        TIW Score is a 0–100 rating from traveller satisfaction, popularity,
        value, uniqueness, convenience, and first-visit importance. Category
        boards change the weights — they are not paid placements. Full
        methodology on each place page.
      </p>
    </div>
  );
}

function ScoreRow({
  place,
  stripe,
  lens,
}: {
  place: RankedPlace;
  stripe: boolean;
  lens: ScoreboardLens;
}) {
  const best = place.bestFor[0] || place.tags[0] || "—";
  return (
    <li>
      <Link
        href={`/new-york/${place.slug}?lens=${lens}`}
        className={`grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 border-b border-ink/8 px-4 py-4 transition hover:bg-amber/[0.07] sm:grid-cols-[4rem_1fr_5.5rem_8rem] sm:gap-3 sm:px-5 ${
          stripe ? "bg-paper/40" : "bg-white"
        }`}
      >
        <span className="font-mono text-sm font-semibold text-amber-deep sm:text-base">
          #{place.rank}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-lg text-ink sm:text-xl">
            {place.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-soft sm:text-sm">
            {place.neighborhood} · {place.typicalCostLabel}
          </span>
          <span className="mt-1 block text-xs text-ink-soft sm:hidden">
            Best for {best}
          </span>
        </span>
        <span className="text-right">
          <span className="font-display text-2xl text-ink sm:text-3xl">
            {place.tiwScore}
          </span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-stone">
            /100
          </span>
        </span>
        <span className="hidden truncate text-right text-sm text-ink-soft sm:block">
          {best}
        </span>
      </Link>
    </li>
  );
}
