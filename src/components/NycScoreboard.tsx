"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  costBandSortValue,
  placeMatchesCategory,
  rankNycPlaces,
  type RankedPlace,
} from "@/lib/nyc-places";
import { normalizeGroupCode } from "@/lib/scoreboard-group-plan";
import { suggestedDaysForSelections } from "@/lib/scoreboard-plan";
import { saveNycPlanTrip } from "@/lib/save-nyc-plan";
import { formatLikeCount, sampleLikeBase } from "@/lib/sample-likes";
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

type SortKey =
  | "rank"
  | "score"
  | "likes"
  | "bestFor"
  | "cost"
  | "category"
  | "name";
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
  const [groupMode, setGroupMode] = useState<"create" | "join">("create");
  const [groupTitle, setGroupTitle] = useState("New York Friends Trip");
  const [hostName, setHostName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
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
        case "likes":
          cmp =
            sampleLikeBase(a.slug, a.tiwScore) -
            sampleLikeBase(b.slug, b.tiwScore);
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

  function signInForGroup(nextPath: string) {
    window.location.href = `/join?next=${encodeURIComponent(nextPath)}`;
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
      if (res.status === 401) {
        signInForGroup("/new-york#board");
        return;
      }
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

  async function joinGroupByCode() {
    setJoining(true);
    setGroupError("");
    try {
      const code = normalizeGroupCode(joinCode);
      if (code.length < 4) {
        throw new Error("Enter the invite code from your host.");
      }
      const res = await fetch(`/api/scoreboard-groups/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          name: joinName || "Traveller",
        }),
      });
      const data = (await res.json()) as {
        group?: { shareCode: string };
        voterKey?: string;
        error?: string;
      };
      if (res.status === 401) {
        signInForGroup(`/new-york/group/${code}`);
        return;
      }
      if (!res.ok || !data.group || !data.voterKey) {
        throw new Error(data.error || "Group not found — check the code.");
      }
      localStorage.setItem(
        `tiw_group_voter_${data.group.shareCode}`,
        data.voterKey,
      );
      window.location.href = `/new-york/group/${data.group.shareCode}`;
    } catch (e) {
      setGroupError(e instanceof Error ? e.message : "Could not join");
      setJoining(false);
    }
  }

  return (
    <div className="max-w-full space-y-4 overflow-x-clip pb-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-deep">
            Scorecard · {filtered.length} places
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">
            {categoryFilter
              ? experienceCategoryLabel[categoryFilter]
              : lens === "overall"
                ? "Top places"
                : active?.group === "interest"
                  ? `${active.label} in New York`
                  : `Best for ${active?.label || "you"}`}
          </h2>
        </div>
        <div className="flex w-full flex-col gap-2 sm:max-w-xs">
          <label className="block">
            <span className="sr-only">Search the board</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search places…"
              className="w-full border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber"
            />
          </label>
          <button
            type="button"
            onClick={() => setGroupOpen((v) => !v)}
            className="border border-ink/20 bg-white px-3 py-1.5 text-left text-xs font-semibold text-ink hover:border-amber sm:text-sm"
          >
            Planning with friends?
          </button>
        </div>
      </div>

      {groupOpen ? (
        <div className="border border-amber/40 bg-amber/[0.08] p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setGroupMode("create");
                setGroupError("");
              }}
              className={`border px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                groupMode === "create"
                  ? "border-amber bg-amber text-ink"
                  : "border-ink/15 bg-white text-ink-soft"
              }`}
            >
              Create group
            </button>
            <button
              type="button"
              onClick={() => {
                setGroupMode("join");
                setGroupError("");
              }}
              className={`border px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                groupMode === "join"
                  ? "border-amber bg-amber text-ink"
                  : "border-ink/15 bg-white text-ink-soft"
              }`}
            >
              Join with code
            </button>
          </div>

          {groupMode === "create" ? (
            <>
              <p className="mt-4 font-display text-xl text-ink">
                Create group scoreboard
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Sign in required. Share one link or code — friends sign in, vote
                Want / Maybe / Skip, then build and save the trip to My trips.
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
            </>
          ) : (
            <>
              <p className="mt-4 font-display text-xl text-ink">
                Join a group scoreboard
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Sign in required. Enter the invite code your host shared, then
                vote — saving the trip still goes to My trips on your account.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-ink-soft">Invite code</span>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. a1b2c3"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="mt-1 w-full border border-ink/15 bg-white px-3 py-2 font-mono uppercase outline-none focus:border-amber"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-soft">Your name</span>
                  <input
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Sam"
                    className="mt-1 w-full border border-ink/15 bg-white px-3 py-2 outline-none focus:border-amber"
                  />
                </label>
              </div>
              {groupError ? (
                <p className="mt-2 text-sm text-red-700">{groupError}</p>
              ) : null}
              <button
                type="button"
                disabled={joining}
                onClick={joinGroupByCode}
                className="mt-4 bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-50"
              >
                {joining ? "Joining…" : "Join group"}
              </button>
            </>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-deep">
            Personalize categories
          </p>
          <ChipScrollRow>
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={`shrink-0 border px-3 py-1.5 text-sm transition ${
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
                  className={`shrink-0 border px-3 py-1.5 text-sm transition ${
                    on
                      ? "border-amber bg-amber text-ink"
                      : "border-ink/15 bg-white text-ink-soft hover:border-amber hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </ChipScrollRow>
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
            Sort by interest
          </p>
          <ChipScrollRow>
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
                  className={`shrink-0 border px-3 py-1.5 text-sm transition ${
                    on
                      ? "border-ink bg-ink text-white"
                      : "border-ink/15 bg-white text-ink-soft hover:border-amber hover:text-ink"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </ChipScrollRow>
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
            Or sort by who / practical
          </p>
          <ChipScrollRow>
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
                  className={`shrink-0 border px-3 py-1.5 text-sm transition ${
                    on
                      ? "border-ink bg-ink text-white"
                      : "border-ink/15 bg-white text-ink-soft hover:border-amber hover:text-ink"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </ChipScrollRow>
        </div>
      </div>

      {/* Mobile / narrow: tap-friendly cards. Wide screens: full table. */}
      <div className="lg:hidden">
        <ChipScrollRow>
          {(
            [
              ["score", "TIW Score"],
              ["rank", "Rank"],
              ["likes", "Liked by"],
              ["cost", "Free / Paid"],
              ["bestFor", "Best for"],
              ["name", "A–Z"],
            ] as Array<[SortKey, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={`shrink-0 border px-3 py-1.5 text-xs font-semibold transition ${
                sortKey === key
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 bg-white text-ink-soft"
              }`}
            >
              Sort: {label}
              {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          ))}
        </ChipScrollRow>
        <ol className="mt-3 space-y-2">
          {filtered.map((place) => (
            <ScoreCard
              key={place.slug}
              place={place}
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
          <p className="px-2 py-10 text-center text-sm text-ink-soft">
            No places match these filters. Try All categories or Overall.
          </p>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto border border-ink/10 bg-white lg:block">
        <div className="min-w-[66rem]">
          <div className="grid grid-cols-[5.5rem_4rem_minmax(12rem,1.3fr)_5.5rem_7rem_5.5rem_7.5rem_8.5rem] gap-3 border-b border-ink/10 bg-paper-deep/60 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-stone sm:px-5">
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
              hint="ToursIWant"
              title="TIW = ToursIWant — our 0–100 quality rating"
              active={sortKey === "score"}
              dir={sortDir}
              onClick={() => toggleSort("score")}
              align="right"
            />
            <SortHeading
              label="Liked by"
              active={sortKey === "likes"}
              dir={sortDir}
              onClick={() => toggleSort("likes")}
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

      <p className="hidden text-xs leading-relaxed text-stone lg:block">
        TIW = ToursIWant — our 0–100 quality rating for each place. Best for =
        who it suits (Families, Couples, First-time visitors…). Free / Paid is
        cost. Personalize matches trip day types. Click headings to sort.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/15 bg-ink text-white shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-8">
          {clearAsk && wants.length ? (
            <div className="space-y-3">
              <div>
                <p className="font-display text-lg">
                  Start a new trip — save this one first?
                </p>
                <p className="mt-1 text-sm text-white/65">
                  Nothing is deleted until you choose. Save these{" "}
                  {wants.length} places to My trips, or discard them and start
                  over.
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
                      setClearStatus(
                        `Saved “${trip.title}” — ready for a new selection.`,
                      );
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
                  {clearBusy ? "Saving…" : "Save to My trips & start new"}
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
                  Discard & start new
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
                  Keep selecting
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
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <p className="font-display text-base sm:text-lg">
                  {wants.length} place{wants.length === 1 ? "" : "s"} selected
                  {wants.length ? (
                    <span className="text-amber">
                      {" "}
                      · {projectedDays} day{projectedDays === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </p>
                {wants.length ? (
                  <p className="mt-0.5 hidden text-xs text-white/50 sm:block">
                    Build when ready — or save this selection first.
                  </p>
                ) : (
                  <p className="text-xs text-white/55">
                    Tap Want on places you like.
                  </p>
                )}
                {clearStatus ? (
                  <p className="mt-0.5 text-sm text-amber">{clearStatus}</p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {wants.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      setClearTitle(`New York · ${projectedDays} days`);
                      setClearStatus("");
                      setClearAsk(true);
                    }}
                    title="Does not delete immediately — you can save this selection to My trips first"
                    className="border border-white/25 px-3 py-2.5 text-sm hover:border-amber hover:text-amber sm:py-2"
                  >
                    Save / start new
                  </button>
                ) : (
                  <span className="sm:hidden" />
                )}
                <Link
                  href={
                    wants.length
                      ? `/new-york/plan?days=${projectedDays}`
                      : "/new-york/plan"
                  }
                  className={`px-4 py-2.5 text-center text-sm font-semibold sm:py-2 ${
                    wants.length
                      ? "col-span-2 bg-amber text-ink hover:bg-amber-deep sm:col-span-1"
                      : "col-span-2 cursor-not-allowed bg-white/20 text-white/50 sm:col-span-1"
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

function ChipScrollRow({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-full overflow-x-auto overscroll-x-contain touch-pan-x pb-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
      <div className="flex w-max gap-2 pr-1">{children}</div>
    </div>
  );
}

function SortHeading({
  label,
  hint,
  title,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  hint?: string;
  title?: string;
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
      title={
        title ||
        `Sort by ${label} (${active ? (dir === "asc" ? "ascending — click for descending" : "descending — click for ascending") : "click to sort"})`
      }
    >
      <span className="block">
        {label}
        {arrow}
      </span>
      {hint ? (
        <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-stone">
          {hint}
        </span>
      ) : null}
    </button>
  );
}

/** Phone / tablet portrait: one place per card, big tap targets. */
function ScoreCard({
  place,
  lens,
  wanted,
  onToggle,
  onCategoryClick,
}: {
  place: RankedPlace;
  lens: ScoreboardLens;
  wanted: boolean;
  onToggle: () => void;
  onCategoryClick: (cat: ExperienceCategory) => void;
}) {
  return (
    <li className="border border-ink/10 bg-white p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-semibold text-amber-deep">
            #{place.rank}
            <span className="ml-2 font-normal text-stone">
              {place.neighborhood}
            </span>
          </p>
          <Link
            href={`/new-york/${place.slug}?lens=${lens}`}
            className="mt-0.5 block font-display text-xl leading-snug text-ink"
          >
            {place.name}
          </Link>
          <p className="mt-1 text-xs text-ink-soft">
            {place.typicalCostLabel} · {place.audience}
          </p>
        </div>
        <Link
          href={`/new-york/${place.slug}?lens=${lens}`}
          className="shrink-0 text-right"
          title="TIW Score = ToursIWant quality rating (0–100)"
        >
          <span className="block font-display text-3xl leading-none text-ink">
            {place.tiwScore}
          </span>
          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-stone">
            TIW
          </span>
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`border px-2 py-0.5 font-semibold ${
            place.costBand === "Free"
              ? "border-amber/40 bg-amber/15 text-amber-deep"
              : "border-ink/10 text-ink-soft"
          }`}
        >
          {place.costBand}
        </span>
        <LikedByCounter
          slug={place.slug}
          tiwScore={place.tiwScore}
          compact
        />
        {place.categories.slice(0, 2).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryClick(cat)}
            className="border border-ink/10 px-2 py-0.5 text-ink-soft"
          >
            {shortCategory(experienceCategoryLabel[cat])}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={`min-h-11 border px-3 py-2.5 text-sm font-semibold transition ${
            wanted
              ? "border-amber bg-amber text-ink"
              : "border-ink/20 bg-paper text-ink"
          }`}
          aria-pressed={wanted}
        >
          {wanted ? "✓ In my trip" : "♡ Want"}
        </button>
        <Link
          href={`/new-york/${place.slug}?lens=${lens}`}
          className="flex min-h-11 items-center justify-center border border-ink/15 px-3 py-2.5 text-sm font-semibold text-ink"
        >
          Details
        </Link>
      </div>
    </li>
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
      className={`grid grid-cols-[5.5rem_4rem_minmax(12rem,1.3fr)_5.5rem_7rem_5.5rem_7.5rem_8.5rem] items-center gap-3 border-b border-ink/8 px-4 py-3 sm:px-5 sm:py-4 ${
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
        title="TIW Score = ToursIWant quality rating (0–100)"
      >
        <span className="font-display text-2xl text-ink sm:text-3xl">
          {place.tiwScore}
        </span>
        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-stone">
          /100 TIW
        </span>
      </Link>

      <LikedByCounter slug={place.slug} tiwScore={place.tiwScore} />

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

/** Sample social-proof counter — ticks up slowly while the board is open. */
function LikedByCounter({
  slug,
  tiwScore,
  compact = false,
}: {
  slug: string;
  tiwScore: number;
  compact?: boolean;
}) {
  const base = sampleLikeBase(slug, tiwScore);
  const [count, setCount] = useState(base);

  useEffect(() => {
    setCount(base);
    const id = window.setInterval(() => {
      setCount((n) => n + (Math.random() < 0.55 ? 1 : 2));
    }, 3500 + (base % 2500));
    return () => window.clearInterval(id);
  }, [base, slug]);

  if (compact) {
    return (
      <span
        className="border border-ink/10 px-2 py-0.5 tabular-nums text-ink-soft"
        title="Sample interest counter — for demo atmosphere"
      >
        Liked by {formatLikeCount(count)}
      </span>
    );
  }

  return (
    <div
      className="text-right tabular-nums"
      title="Sample interest counter — for demo atmosphere"
    >
      <span className="block font-display text-lg text-ink sm:text-xl">
        {formatLikeCount(count)}
      </span>
      <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-stone">
        liked by
      </span>
    </div>
  );
}
