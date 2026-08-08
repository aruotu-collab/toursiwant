"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  costBandSortValue,
  placeMatchesCategory,
  rankNycPlaces,
  type RankedPlace,
} from "@/lib/nyc-places";
import { suggestedDaysForSelections } from "@/lib/scoreboard-plan";
import { saveNycPlanTrip } from "@/lib/save-nyc-plan";
import {
  interestLenses,
  practicalLenses,
  scoreboardLenses,
  type ScoreboardLens,
} from "@/lib/tiw-score";
import {
  experienceCategoryLabel,
  personalizeOptions,
  type ExperienceCategory,
} from "@/lib/trip-templates";
import { useNycWants } from "@/lib/use-nyc-wants";

function lensMeta(id: ScoreboardLens) {
  return scoreboardLenses.find((l) => l.id === id);
}

type SortKey = "rank" | "score" | "bestFor" | "cost" | "category" | "name";
type SortDir = "asc" | "desc";

export function NycScoreboard({
  initialLens = "overall",
}: {
  initialLens?: ScoreboardLens;
}) {
  const [lens, setLens] = useState<ScoreboardLens>(initialLens);
  const [categoryFilter, setCategoryFilter] = useState<ExperienceCategory | "">(
    "",
  );
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [query, setQuery] = useState("");
  const {
    wants,
    days,
    dayAssignments,
    ready,
    toggle,
    clear,
    isWanted,
    setDays,
  } = useNycWants();
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("New York Friends Trip");
  const [hostName, setHostName] = useState("");
  const [creating, setCreating] = useState(false);
  const [groupError, setGroupError] = useState("");
  const [clearAsk, setClearAsk] = useState(false);
  const [clearTitle, setClearTitle] = useState("");
  const [clearBusy, setClearBusy] = useState(false);
  const [clearStatus, setClearStatus] = useState("");

  const projectedDays = useMemo(
    () => (wants.length ? suggestedDaysForSelections(wants) : days),
    [wants, days],
  );

  // Keep saved trip length in sync while picking on the scoreboard.
  useEffect(() => {
    if (!ready || !wants.length) return;
    if (projectedDays !== days) setDays(projectedDays);
  }, [ready, wants, projectedDays, days, setDays]);

  const ranked = useMemo(() => rankNycPlaces(lens), [lens]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ranked;
    if (categoryFilter) {
      list = list.filter((p) => placeMatchesCategory(p, categoryFilter));
    }
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.neighborhood.toLowerCase().includes(q) ||
          p.bestFor.some((b) => b.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.includes(q)) ||
          p.categories.some((c) =>
            experienceCategoryLabel[c].toLowerCase().includes(q),
          ),
      );
    }

    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rank":
          cmp = a.rank - b.rank;
          break;
        case "score":
          cmp = a.tiwScore - b.tiwScore;
          break;
        case "bestFor":
          cmp = a.audience.localeCompare(b.audience);
          break;
        case "cost":
          cmp = costBandSortValue(a) - costBandSortValue(b);
          break;
        case "category":
          cmp = a.primaryCategoryLabel.localeCompare(b.primaryCategoryLabel);
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        default:
          cmp = 0;
      }
      if (cmp !== 0) return cmp * dir;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [ranked, query, categoryFilter, sortKey, sortDir]);

  const active = scoreboardLenses.find((l) => l.id === lens);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // Text columns default ascending; numbers default descending (high first)
    setSortDir(
      key === "bestFor" || key === "category" || key === "name" || key === "cost"
        ? "asc"
        : "desc",
    );
  }

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
            Places · {filtered.length} shown
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            {categoryFilter
              ? experienceCategoryLabel[categoryFilter]
              : lens === "overall"
                ? "New York Top Places"
                : active?.group === "interest"
                  ? `${active.label} in New York`
                  : `Best for ${active?.label || "you"}`}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft sm:text-base">
            Use personalize categories and column headers to sort. Click a
            heading again to flip ascending / descending. Your wants stay in
            the tray.
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
            Personalize categories
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={`border px-3 py-1.5 text-sm transition ${
                !categoryFilter
                  ? "border-amber bg-amber text-ink"
                  : "border-ink/15 bg-white text-ink-soft hover:border-amber"
              }`}
            >
              All categories
            </button>
            {personalizeOptions.map((opt) => {
              const on = categoryFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(opt.id);
                    setSortKey("score");
                    setSortDir("desc");
                  }}
                  className={`border px-3 py-1.5 text-sm transition ${
                    on
                      ? "border-amber bg-amber text-ink"
                      : "border-ink/15 bg-white text-ink-soft hover:border-amber hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
            Sort by interest
          </p>
          <div className="flex flex-wrap gap-2">
            {interestLenses.map((id) => {
              const l = lensMeta(id);
              if (!l) return null;
              const on = lens === id && !categoryFilter;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setLens(id);
                    setCategoryFilter("");
                  }}
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

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
            Or sort by who / practical
          </p>
          <div className="flex flex-wrap gap-2">
            {practicalLenses.map((id) => {
              const l = lensMeta(id);
              if (!l) return null;
              const on = lens === id && !categoryFilter;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setLens(id);
                    setCategoryFilter("");
                  }}
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

      <div className="overflow-x-auto border border-ink/10 bg-white">
        <div className="min-w-[58rem]">
          <div className="grid grid-cols-[5.5rem_4rem_minmax(12rem,1.3fr)_5.5rem_5.5rem_7.5rem_8.5rem] gap-3 border-b border-ink/10 bg-paper-deep/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-stone sm:px-5">
            <span className="self-center">Select</span>
            <SortHeading
              label="Rank"
              active={sortKey === "rank"}
              dir={sortDir}
              onClick={() => toggleSort("rank")}
            />
            <SortHeading
              label="Place / experience"
              active={sortKey === "name"}
              dir={sortDir}
              onClick={() => toggleSort("name")}
              align="left"
            />
            <SortHeading
              label="TIW Score"
              active={sortKey === "score"}
              dir={sortDir}
              onClick={() => toggleSort("score")}
              align="right"
            />
            <SortHeading
              label="Free / Paid"
              active={sortKey === "cost"}
              dir={sortDir}
              onClick={() => toggleSort("cost")}
              align="right"
            />
            <SortHeading
              label="Best for"
              active={sortKey === "bestFor"}
              dir={sortDir}
              onClick={() => toggleSort("bestFor")}
              align="right"
            />
            <SortHeading
              label="Personalize"
              active={sortKey === "category"}
              dir={sortDir}
              onClick={() => toggleSort("category")}
              align="right"
            />
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
                onCategoryClick={(cat) => {
                  setCategoryFilter(cat);
                  setSortKey("score");
                  setSortDir("desc");
                }}
              />
            ))}
          </ol>
          {!filtered.length ? (
            <p className="px-5 py-10 text-center text-sm text-ink-soft">
              No places match these filters. Try All categories or Overall.
            </p>
          ) : null}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-stone">
        Best for = who it suits (Families, Couples, First-time visitors…). Free
        / Paid is cost. Personalize matches trip day types. Click headings to
        sort ascending or descending.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/15 bg-ink text-white shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-8">
          {clearAsk && wants.length ? (
            <div className="space-y-3">
              <div>
                <p className="font-display text-lg">Save before starting fresh?</p>
                <p className="mt-1 text-sm text-white/65">
                  Keep these {wants.length} places in My trips, then clear the
                  tray so you can build another New York trip.
                </p>
              </div>
              <label className="block max-w-md">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                  Trip name
                </span>
                <input
                  value={clearTitle}
                  onChange={(e) => setClearTitle(e.target.value)}
                  className="w-full border border-white/25 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber"
                  placeholder={`New York · ${projectedDays} days`}
                />
              </label>
              {clearStatus ? (
                <p className="text-sm text-amber">{clearStatus}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={clearBusy}
                  onClick={async () => {
                    setClearBusy(true);
                    setClearStatus("");
                    try {
                      const trip = await saveNycPlanTrip({
                        title:
                          clearTitle.trim() ||
                          `New York · ${projectedDays} days`,
                        placeSlugs: wants,
                        planDays: projectedDays,
                        dayAssignments,
                      });
                      clear();
                      setClearAsk(false);
                      setClearStatus(`Saved “${trip.title}” — tray cleared.`);
                    } catch (e) {
                      if (e instanceof Error && e.message === "SIGN_IN_REQUIRED") {
                        const next = encodeURIComponent("/new-york#board");
                        window.location.href = `/join?next=${next}`;
                        return;
                      }
                      setClearStatus(
                        e instanceof Error ? e.message : "Could not save trip",
                      );
                    } finally {
                      setClearBusy(false);
                    }
                  }}
                  className="bg-amber px-4 py-2 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-60"
                >
                  {clearBusy ? "Saving…" : "Save & clear"}
                </button>
                <button
                  type="button"
                  disabled={clearBusy}
                  onClick={() => {
                    clear();
                    setClearAsk(false);
                    setClearStatus("");
                  }}
                  className="border border-white/25 px-3 py-2 text-sm hover:border-amber hover:text-amber disabled:opacity-60"
                >
                  Clear without saving
                </button>
                <button
                  type="button"
                  disabled={clearBusy}
                  onClick={() => {
                    setClearAsk(false);
                    setClearStatus("");
                  }}
                  className="px-3 py-2 text-sm text-white/70 hover:text-white disabled:opacity-60"
                >
                  Cancel
                </button>
                <Link
                  href="/account#my-trips"
                  className="px-3 py-2 text-sm text-white/70 underline-offset-2 hover:text-amber hover:underline"
                >
                  View My trips
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg">
                  {wants.length} place{wants.length === 1 ? "" : "s"} selected
                </p>
                {wants.length ? (
                  <p className="mt-0.5 text-sm text-amber">
                    Your trip is now {projectedDays} day
                    {projectedDays === 1 ? "" : "s"} to fit all selections
                  </p>
                ) : (
                  <p className="text-xs text-white/55">
                    Tap Want to go on places you like.
                  </p>
                )}
                {wants.length ? (
                  <p className="mt-0.5 text-xs text-white/50">
                    Days update as you select — then build when you&apos;re
                    ready.
                  </p>
                ) : clearStatus ? (
                  <p className="mt-0.5 text-sm text-amber">{clearStatus}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {wants.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      setClearTitle(`New York · ${projectedDays} days`);
                      setClearStatus("");
                      setClearAsk(true);
                    }}
                    className="border border-white/25 px-3 py-2 text-sm hover:border-amber hover:text-amber"
                  >
                    Clear
                  </button>
                ) : null}
                <Link
                  href={
                    wants.length
                      ? `/new-york/plan?days=${projectedDays}`
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
                  Build my {projectedDays}-day trip
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortHeading({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  const arrow = active ? (dir === "asc" ? " ↑" : " ↓") : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`self-center transition hover:text-ink ${
        align === "right" ? "text-right" : "text-left"
      } ${active ? "font-semibold text-ink" : ""}`}
      title={`Sort by ${label} (${active ? (dir === "asc" ? "ascending — click for descending" : "descending — click for ascending") : "click to sort"})`}
    >
      {label}
      {arrow}
    </button>
  );
}

function ScoreRow({
  place,
  stripe,
  lens,
  wanted,
  onToggle,
  onCategoryClick,
}: {
  place: RankedPlace;
  stripe: boolean;
  lens: ScoreboardLens;
  wanted: boolean;
  onToggle: () => void;
  onCategoryClick: (cat: ExperienceCategory) => void;
}) {
  return (
    <li
      className={`grid grid-cols-[5.5rem_4rem_minmax(12rem,1.3fr)_5.5rem_5.5rem_7.5rem_8.5rem] items-center gap-3 border-b border-ink/8 px-4 py-3 sm:px-5 sm:py-4 ${
        stripe ? "bg-paper/40" : "bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`shrink-0 border px-2 py-1.5 text-left text-xs font-semibold transition sm:text-sm ${
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
        className="font-mono text-sm font-semibold text-amber-deep sm:text-base"
      >
        #{place.rank}
      </Link>

      <Link href={`/new-york/${place.slug}?lens=${lens}`} className="min-w-0">
        <span className="block truncate font-display text-base text-ink sm:text-xl">
          {place.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-soft sm:text-sm">
          {place.neighborhood} · {place.typicalCostLabel}
        </span>
      </Link>

      <Link
        href={`/new-york/${place.slug}?lens=${lens}`}
        className="text-right"
      >
        <span className="font-display text-2xl text-ink sm:text-3xl">
          {place.tiwScore}
        </span>
        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-stone">
          /100
        </span>
      </Link>

      <span
        className={`truncate text-right text-sm font-semibold ${
          place.costBand === "Free"
            ? "text-amber-deep"
            : place.costBand === "Under $50"
              ? "text-ink"
              : "text-ink-soft"
        }`}
      >
        {place.costBand}
      </span>

      <span className="truncate text-right text-sm text-ink-soft">
        {place.audience}
      </span>

      <div className="flex flex-wrap justify-end gap-1">
        {place.categories.slice(0, 2).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryClick(cat)}
            className="max-w-full truncate border border-ink/10 bg-white px-1.5 py-0.5 text-[10px] text-ink-soft hover:border-amber hover:text-ink"
            title={experienceCategoryLabel[cat]}
          >
            {shortCategory(experienceCategoryLabel[cat])}
          </button>
        ))}
      </div>
    </li>
  );
}

function shortCategory(label: string) {
  return label
    .replace("Museums / culture", "Culture")
    .replace("Live entertainment / show", "Shows")
    .replace("Children’s activities", "Family")
    .replace("Religious / spiritual sites", "Spiritual")
    .replace("Free time / slow day", "Free time")
    .replace("Waterpark / theme park", "Water")
    .replace("Private group dinner", "Private dinner")
    .replace("Relaxation / spa", "Relax")
    .replace("Famous sights", "Sights")
    .replace("Nature / parks day", "Nature")
    .replace("Food tour", "Food")
    .replace("Shopping day", "Shopping");
}
