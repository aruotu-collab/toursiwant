"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  rankNycPlaces,
  type RankedPlace,
} from "@/lib/nyc-places";
import {
  interestLenses,
  practicalLenses,
  scoreboardLenses,
  type ScoreboardLens,
} from "@/lib/tiw-score";
import { useNycWants } from "@/lib/use-nyc-wants";

function lensMeta(id: ScoreboardLens) {
  return scoreboardLenses.find((l) => l.id === id);
}

export function NycScoreboard({
  initialLens = "overall",
}: {
  initialLens?: ScoreboardLens;
}) {
  const [lens, setLens] = useState<ScoreboardLens>(initialLens);
  const [query, setQuery] = useState("");
  const { wants, ready, toggle, clear, isWanted } = useNycWants();
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("New York Friends Trip");
  const [hostName, setHostName] = useState("");
  const [creating, setCreating] = useState(false);
  const [groupError, setGroupError] = useState("");

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

  async function createGroup() {
    setCreating(true);
    setGroupError("");
    try {
      const res = await fetch("/api/scoreboard-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: groupTitle,
          hostName: hostName || "Host",
        }),
      });
      const data = (await res.json()) as {
        group?: { shareCode: string };
        voterKey?: string;
        error?: string;
      };
      if (!res.ok || !data.group || !data.voterKey) {
        throw new Error(data.error || "Could not create group");
      }
      localStorage.setItem(
        `tiw_group_voter_${data.group.shareCode}`,
        data.voterKey,
      );
      // Seed host wants into group votes if they already selected
      if (wants.length) {
        const votes = Object.fromEntries(wants.map((s) => [s, "want" as const]));
        await fetch(`/api/scoreboard-groups/${data.group.shareCode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "vote",
            voterKey: data.voterKey,
            votes,
          }),
        });
      }
      window.location.href = `/new-york/group/${data.group.shareCode}`;
    } catch (e) {
      setGroupError(e instanceof Error ? e.message : "Something went wrong");
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8 pb-28">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-deep">
            Places · {filtered.length} ranked
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            {lens === "overall"
              ? "New York Top Places"
              : active?.group === "interest"
                ? `${active.label} in New York`
                : `Best for ${active?.label || "you"}`}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft sm:text-base">
            Sort by interest — e.g. History, then Art &amp; culture — pick what
            you want from each list. Your selections stay in the tray below.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:max-w-xs">
          <label className="block">
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
          <button
            type="button"
            onClick={() => setGroupOpen((v) => !v)}
            className="border border-ink/20 bg-white px-3 py-2 text-left text-sm font-semibold text-ink hover:border-amber"
          >
            Planning with friends?
          </button>
        </div>
      </div>

      {groupOpen ? (
        <div className="border border-amber/40 bg-amber/[0.08] p-4 sm:p-5">
          <p className="font-display text-xl text-ink">Create group scoreboard</p>
          <p className="mt-1 text-sm text-ink-soft">
            Share one link. Everyone picks what they want. You see the group
            ranking live.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-ink-soft">Trip name</span>
              <input
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                className="mt-1 w-full border border-ink/15 bg-white px-3 py-2 outline-none focus:border-amber"
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink-soft">Your name</span>
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Alex"
                className="mt-1 w-full border border-ink/15 bg-white px-3 py-2 outline-none focus:border-amber"
              />
            </label>
          </div>
          {groupError ? (
            <p className="mt-2 text-sm text-red-700">{groupError}</p>
          ) : null}
          <button
            type="button"
            disabled={creating}
            onClick={createGroup}
            className="mt-4 bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create & get invite link"}
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-deep">
            Sort by interest
          </p>
          <div className="flex flex-wrap gap-2">
            {interestLenses.map((id) => {
              const l = lensMeta(id);
              if (!l) return null;
              const on = lens === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLens(id)}
                  className={`border px-3 py-1.5 text-sm transition ${
                    on
                      ? "border-amber bg-amber text-ink"
                      : "border-ink/15 bg-white text-ink-soft hover:border-amber hover:text-ink"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
            Or sort by who / practical
          </p>
          <div className="flex flex-wrap gap-2">
            {practicalLenses.map((id) => {
              const l = lensMeta(id);
              if (!l) return null;
              const on = lens === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLens(id)}
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
        </div>
      </div>

      <div className="overflow-hidden border border-ink/10 bg-white">
        <div className="hidden grid-cols-[5.5rem_4rem_1fr_5.5rem_7rem] gap-3 border-b border-ink/10 bg-paper-deep/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-stone sm:grid sm:px-5">
          <span>Select</span>
          <span>Rank</span>
          <span>Place / experience</span>
          <button
            type="button"
            onClick={() => setLens("overall")}
            className="text-right transition hover:text-ink"
            title="Sort by TIW Score (overall)"
          >
            TIW Score{lens === "overall" ? " ↓" : ""}
          </button>
          <div className="relative text-right">
            <label className="sr-only" htmlFor="best-for-sort">
              Sort by interest
            </label>
            <select
              id="best-for-sort"
              value={interestLenses.includes(lens) ? lens : ""}
              onChange={(e) => {
                const v = e.target.value as ScoreboardLens | "";
                if (v) setLens(v);
              }}
              className="w-full cursor-pointer appearance-none bg-transparent text-right font-mono text-[10px] uppercase tracking-[0.14em] text-stone outline-none hover:text-ink"
            >
              <option value="">Best for</option>
              {interestLenses.map((id) => {
                const l = lensMeta(id);
                return (
                  <option key={id} value={id}>
                    {l?.label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <ol>
          {filtered.map((place, i) => (
            <ScoreRow
              key={place.slug}
              place={place}
              stripe={i % 2 === 1}
              lens={lens}
              wanted={ready && isWanted(place.slug)}
              onToggle={() => toggle(place.slug)}
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
        value, uniqueness, convenience, and first-visit importance. Your
        selections become a personal plan — or a group scoreboard when you
        invite friends.
      </p>

      {/* Persistent selection tray */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/15 bg-ink text-white shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div>
            <p className="font-display text-lg">
              {wants.length} place{wants.length === 1 ? "" : "s"} selected
            </p>
            <p className="text-xs text-white/55">
              {wants.length
                ? "Build a trip from your wants — or start a group vote."
                : "Tap Want to go on places you like."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {wants.length ? (
              <button
                type="button"
                onClick={clear}
                className="border border-white/25 px-3 py-2 text-sm hover:border-amber hover:text-amber"
              >
                Clear
              </button>
            ) : null}
            <Link
              href={
                wants.length
                  ? `/new-york/plan?days=3`
                  : "/new-york/plan"
              }
              className={`px-4 py-2 text-sm font-semibold ${
                wants.length
                  ? "bg-amber text-ink hover:bg-amber-deep"
                  : "cursor-not-allowed bg-white/20 text-white/50"
              }`}
              aria-disabled={!wants.length}
              onClick={(e) => {
                if (!wants.length) e.preventDefault();
              }}
            >
              Build my trip
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({
  place,
  stripe,
  lens,
  wanted,
  onToggle,
}: {
  place: RankedPlace;
  stripe: boolean;
  lens: ScoreboardLens;
  wanted: boolean;
  onToggle: () => void;
}) {
  const best = place.bestFor[0] || place.tags[0] || "—";
  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-ink/8 px-3 py-3 sm:grid-cols-[5.5rem_4rem_1fr_5.5rem_7rem] sm:gap-3 sm:px-5 sm:py-4 ${
        stripe ? "bg-paper/40" : "bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`shrink-0 border px-2 py-1.5 text-left text-xs font-semibold transition sm:px-2.5 sm:text-sm ${
          wanted
            ? "border-amber bg-amber text-ink"
            : "border-ink/20 bg-white text-ink-soft hover:border-amber hover:text-ink"
        }`}
        aria-pressed={wanted}
      >
        {wanted ? "✓ In my trip" : "♡ Want"}
      </button>

      <Link
        href={`/new-york/${place.slug}?lens=${lens}`}
        className="contents"
      >
        <span className="font-mono text-sm font-semibold text-amber-deep sm:text-base">
          #{place.rank}
        </span>
        <span className="col-span-2 min-w-0 sm:col-span-1">
          <span className="block truncate font-display text-base text-ink sm:text-xl">
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
