"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  rankCityPlaces,
  type RankedCityPlace,
} from "@/lib/places/registry";
import type { CityPlace } from "@/lib/places/types";
import {
  interestLenses,
  practicalLenses,
  scoreboardLenses,
  type ScoreboardLens,
} from "@/lib/tiw-score";

type SortKey = "rank" | "score" | "name" | "cost";
type SortDir = "asc" | "desc";

export function CityScoreboard({
  citySlug,
  cityName,
  places,
  initialLens = "overall",
}: {
  citySlug: string;
  cityName: string;
  places: CityPlace[];
  initialLens?: ScoreboardLens;
}) {
  const [lens, setLens] = useState<ScoreboardLens>(initialLens);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const ranked = useMemo(() => rankCityPlaces(places, lens), [places, lens]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = ranked;
    if (q) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.bestFor.some((b) => b.toLowerCase().includes(q)),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "rank") cmp = a.rank - b.rank;
      else if (sortKey === "cost")
        cmp = costValue(a.cost) - costValue(b.cost);
      else cmp = a.tiwScore - b.tiwScore;
      return cmp * dir || a.name.localeCompare(b.name);
    });
  }, [ranked, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "name" ? "asc" : "desc");
  }

  const active = scoreboardLenses.find((l) => l.id === lens);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-deep">
            Scorecard · {filtered.length} places
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">
            {lens === "overall"
              ? `Top places in ${cityName}`
              : `Best for ${active?.label || "you"}`}
          </h2>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places…"
          className="w-full border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber sm:max-w-xs"
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone">
          Practical lenses
        </p>
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {practicalLenses.map((id) => {
            const meta = scoreboardLenses.find((l) => l.id === id);
            const on = lens === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setLens(id)}
                className={`shrink-0 border px-3 py-1.5 text-sm ${
                  on
                    ? "border-amber bg-amber text-ink"
                    : "border-ink/15 bg-white text-ink-soft hover:border-amber"
                }`}
              >
                {meta?.label || id}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone">
          Interest lenses
        </p>
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {interestLenses.map((id) => {
            const meta = scoreboardLenses.find((l) => l.id === id);
            const on = lens === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setLens(id)}
                className={`shrink-0 border px-3 py-1.5 text-sm ${
                  on
                    ? "border-amber bg-amber text-ink"
                    : "border-ink/15 bg-white text-ink-soft hover:border-amber"
                }`}
              >
                {meta?.label || id}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden border border-ink/10 bg-white">
        <div className="hidden grid-cols-[3.5rem_1fr_4.5rem_5.5rem] gap-3 border-b border-ink/10 bg-paper-deep/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] sm:grid sm:px-5">
          {(
            [
              ["rank", "Rank", "text-left"],
              ["name", "Place", "text-left"],
              ["score", "TIW", "text-right"],
              ["cost", "Cost", "text-right"],
            ] as Array<[SortKey, string, string]>
          ).map(([key, label, align]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={`${align} transition hover:text-ink ${
                sortKey === key ? "text-amber-deep" : "text-stone"
              }`}
            >
              {label}
              {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          ))}
        </div>
        <ol>
          {filtered.map((p, i) => (
            <PlaceRow
              key={p.slug}
              place={p}
              citySlug={citySlug}
              zebra={i % 2 === 1}
            />
          ))}
        </ol>
        {!filtered.length ? (
          <p className="p-6 text-sm text-ink-soft">No places match that search.</p>
        ) : null}
      </div>
    </div>
  );
}

function costValue(cost: CityPlace["cost"]) {
  if (cost === "free") return 0;
  if (cost === "under_50") return 1;
  return 2;
}

function PlaceRow({
  place,
  citySlug,
  zebra,
}: {
  place: RankedCityPlace;
  citySlug: string;
  zebra: boolean;
}) {
  return (
    <li
      className={`grid grid-cols-1 gap-2 border-b border-ink/8 px-4 py-4 sm:grid-cols-[3.5rem_1fr_4.5rem_5.5rem] sm:items-center sm:gap-3 sm:px-5 ${
        zebra ? "bg-paper/40" : "bg-white"
      }`}
    >
      <p className="font-mono text-sm text-amber-deep">#{place.rank}</p>
      <div className="min-w-0">
        <Link
          href={`/city/${citySlug}/${place.slug}`}
          className="font-display text-lg text-ink hover:text-amber-deep sm:text-xl"
        >
          {place.name}
        </Link>
        <p className="text-xs text-ink-soft">{place.neighborhood}</p>
        <p className="mt-1 text-sm text-ink-soft line-clamp-2">{place.summary}</p>
      </div>
      <p className="font-display text-xl text-ink sm:text-right">{place.tiwScore}</p>
      <p className="text-sm text-ink-soft sm:text-right">
        {place.typicalCostLabel}
      </p>
    </li>
  );
}
