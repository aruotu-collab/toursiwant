"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { rankNycPlaces } from "@/lib/nyc-places";
import {
  selectGroupPlanSlugs,
  voterDisplay,
} from "@/lib/scoreboard-group-plan";
import {
  buildPlanFromSelections,
  MAX_TRIP_DAYS,
} from "@/lib/scoreboard-plan";
import type {
  GroupPlaceRank,
  ScoreboardGroup,
  ScoreboardVote,
} from "@/lib/scoreboard-groups";

type Props = { code: string };

type SortKey = "vote" | "place" | "tiw" | "group" | "fit";
type SortDir = "asc" | "desc";

const voteRank: Record<ScoreboardVote | "", number> = {
  want: 3,
  maybe: 2,
  skip: 1,
  "": 0,
};

export function GroupScoreboardClient({ code }: Props) {
  const [group, setGroup] = useState<ScoreboardGroup | null>(null);
  const [ranks, setRanks] = useState<GroupPlaceRank[]>([]);
  const [voterKey, setVoterKey] = useState("");
  const [myEmail, setMyEmail] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [days, setDays] = useState(3);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("fit");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const storageKey = `tiw_group_voter_${code}`;

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/scoreboard-groups/${code}`);
    const data = (await res.json()) as {
      group?: ScoreboardGroup;
      ranks?: GroupPlaceRank[];
      error?: string;
    };
    if (!res.ok || !data.group) {
      setError(data.error || "Group not found");
      setLoading(false);
      return;
    }
    setGroup(data.group);
    setRanks(data.ranks || []);
    setLoading(false);
  }, [code]);

  useEffect(() => {
    const existing = localStorage.getItem(storageKey) || "";
    if (existing) setVoterKey(existing);

    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = (await meRes.json()) as {
          user?: { id: string; email?: string } | null;
        };
        if (cancelled) return;
        if (!meData.user) {
          setSignedIn(false);
          setJoined(false);
          return;
        }
        setSignedIn(true);
        setMyEmail(meData.user.email || "");
        // Auto-join with the signed-in email — no name step.
        const res = await fetch(`/api/scoreboard-groups/${code}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "join",
            voterKey: existing || undefined,
          }),
        });
        const data = (await res.json()) as {
          group?: ScoreboardGroup;
          voterKey?: string;
          ranks?: GroupPlaceRank[];
        };
        if (res.ok && data.voterKey) {
          localStorage.setItem(storageKey, data.voterKey);
          setVoterKey(data.voterKey);
          if (data.group) setGroup(data.group);
          if (data.ranks) setRanks(data.ranks);
          setJoined(true);
        }
      } catch {
        /* keep join panel */
      }
    })();

    refresh();
    const t = setInterval(refresh, 8000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [refresh, storageKey, code]);

  const me = group?.voters.find((v) => v.key === voterKey);
  const myVotes = me?.votes || {};

  const board = useMemo(() => rankNycPlaces("overall"), []);

  const groupBoard = useMemo(() => {
    const bySlug = new Map(ranks.map((r) => [r.slug, r]));
    // Include all places; unvoted show 0
    const rows = board.map((p) => {
      const g = bySlug.get(p.slug);
      const want = g?.wantCount || 0;
      const maybe = g?.maybeCount || 0;
      const voters = group?.voters.length || 1;
      const support = g?.supportPercent ?? 0;
      const groupFit = Math.round(p.tiwScore * 0.45 + support * 0.55);
      return {
        ...p,
        wantCount: want,
        maybeCount: maybe,
        skipCount: g?.skipCount || 0,
        supportPercent: support,
        groupFit,
        votersTotal: voters,
      };
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "vote":
          cmp =
            voteRank[myVotes[a.slug] || ""] - voteRank[myVotes[b.slug] || ""];
          break;
        case "place":
          cmp = a.name.localeCompare(b.name);
          break;
        case "tiw":
          cmp = a.tiwScore - b.tiwScore;
          break;
        case "group":
          cmp =
            a.wantCount - b.wantCount ||
            a.maybeCount - b.maybeCount ||
            a.supportPercent - b.supportPercent;
          break;
        case "fit":
        default:
          cmp =
            a.groupFit - b.groupFit ||
            a.wantCount - b.wantCount ||
            a.tiwScore - b.tiwScore;
          break;
      }
      if (cmp !== 0) return cmp * dir;
      return a.name.localeCompare(b.name);
    });
  }, [board, ranks, group?.voters.length, sortKey, sortDir, myVotes]);

  const favourites = useMemo(
    () =>
      [...groupBoard]
        .filter((p) => p.wantCount > 0)
        .sort(
          (a, b) =>
            b.wantCount - a.wantCount ||
            b.groupFit - a.groupFit ||
            b.tiwScore - a.tiwScore,
        ),
    [groupBoard],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(
      key === "place" || key === "vote" ? "asc" : "desc",
    );
  }
  const planSlugs = useMemo(
    () => selectGroupPlanSlugs(groupBoard),
    [groupBoard],
  );
  const plan = useMemo(
    () => buildPlanFromSelections(planSlugs, days),
    [planSlugs, days],
  );

  function signInToVote() {
    window.location.href = `/join?next=${encodeURIComponent(
      `/new-york/group/${code}`,
    )}`;
  }

  async function vote(slug: string, vote: ScoreboardVote) {
    if (!voterKey) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/scoreboard-groups/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vote",
          voterKey,
          votes: { [slug]: vote },
        }),
      });
      const data = (await res.json()) as {
        group?: ScoreboardGroup;
        ranks?: GroupPlaceRank[];
        error?: string;
      };
      if (res.status === 401) {
        signInToVote();
        return;
      }
      if (!res.ok) {
        setError(data.error || "Could not save vote — sign in and try again.");
        return;
      }
      if (data.group) setGroup(data.group);
      if (data.ranks) setRanks(data.ranks);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/new-york/group/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <p className="text-ink-soft">Loading group scoreboard…</p>;
  }
  if (!group) {
    return (
      <div className="border border-ink/10 bg-white p-8 text-center">
        <p className="font-display text-2xl">{error || "Group not found"}</p>
        <Link href="/new-york" className="mt-4 inline-block text-amber-deep">
          Back to New York Scoreboard
        </Link>
      </div>
    );
  }

  const votedCount = group.voters.filter(
    (v) => Object.keys(v.votes).length > 0,
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-deep">
            Group scoreboard · New York
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink">{group.title}</h1>
          <p className="mt-2 text-ink-soft">
            {votedCount} of {group.voters.length} people have voted · Host{" "}
            {voterDisplay(
              group.voters.find((v) => v.key === group.hostKey) || {
                name: group.hostName,
              },
            )}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <p className="font-mono text-sm text-ink">
            Code{" "}
            <span className="bg-amber/20 px-2 py-1 font-semibold uppercase tracking-wider text-ink">
              {group.shareCode}
            </span>
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            {copied ? "Link copied" : "Copy invite link"}
          </button>
        </div>
      </div>

      {signedIn === false ? (
        <div className="border border-amber/40 bg-amber/[0.08] p-5">
          <p className="font-display text-xl text-ink">
            Sign in with email to vote
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Use the same email each time — no name or password. After the magic
            link, you&apos;ll land back here ready to vote.
          </p>
          <button
            type="button"
            onClick={signInToVote}
            className="mt-4 bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            Continue with email
          </button>
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </div>
      ) : !joined ? (
        <p className="text-sm text-ink-soft">
          {signedIn
            ? `Joining as ${myEmail || "your email"}…`
            : "Checking sign-in…"}
        </p>
      ) : (
        <p className="text-sm text-ink-soft">
          Voting as{" "}
          <span className="font-semibold text-ink">
            {me ? voterDisplay(me) : myEmail || "you"}
          </span>
          {saving ? " · saving…" : ""}
          {error ? (
            <span className="mt-1 block text-red-700">{error}</span>
          ) : null}
        </p>
      )}

      <div className="border border-ink/10 bg-white p-5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-amber-deep">
          Who&apos;s in this group
        </p>
        <ul className="mt-3 space-y-2">
          {group.voters.map((v) => {
            const votes = Object.keys(v.votes).length;
            const wants = Object.values(v.votes).filter((x) => x === "want")
              .length;
            const isHost = v.key === group.hostKey;
            return (
              <li
                key={v.key}
                className="flex flex-wrap items-baseline justify-between gap-2 border-t border-ink/8 pt-2 first:border-0 first:pt-0"
              >
                <span className="min-w-0">
                  <span className="font-medium text-ink break-all">
                    {voterDisplay(v)}
                  </span>
                  {isHost ? (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-amber-deep">
                      Host
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-xs text-stone">
                  {votes === 0
                    ? "Not voted yet"
                    : `${wants} want · ${votes} voted`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Group favourites strip */}
      {favourites.length ? (
        <div className="border border-ink/10 bg-white p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-amber-deep">
            Current group favourites
          </p>
          <ol className="mt-3 space-y-2">
            {favourites.slice(0, 6).map((p, i) => (
              <li
                key={p.slug}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  <span className="font-mono text-amber-deep">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>{" "}
                  <span className="font-display text-lg text-ink">{p.name}</span>
                  {p.wantCount === group.voters.length && group.voters.length > 1 ? (
                    <span className="ml-2 text-xs text-amber-deep">
                      Everyone wants this
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-sm text-ink-soft">
                  {p.wantCount}/{group.voters.length} · Fit {p.groupFit}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="overflow-hidden border border-ink/10 bg-white">
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain border-b border-ink/10 bg-paper-deep/40 px-3 py-2 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              ["vote", "Your vote"],
              ["place", "Place"],
              ["tiw", "TIW"],
              ["group", "Group"],
              ["fit", "Group Fit"],
            ] as Array<[SortKey, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={`shrink-0 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${
                sortKey === key
                  ? "border-amber bg-amber text-ink"
                  : "border-ink/15 bg-white text-stone"
              }`}
            >
              {label}
              {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          ))}
        </div>
        <div className="hidden grid-cols-[5.5rem_1fr_4.5rem_5.5rem_7rem] gap-3 border-b border-ink/10 bg-paper-deep/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-stone sm:grid sm:px-5">
          {(
            [
              ["vote", "Your vote", "text-left"],
              ["place", "Place", "text-left"],
              ["tiw", "TIW", "text-right"],
              ["group", "Group", "text-right"],
              ["fit", "Group Fit", "text-right"],
            ] as Array<[SortKey, string, string]>
          ).map(([key, label, align]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={`${align} font-mono text-[10px] uppercase tracking-[0.14em] transition hover:text-ink ${
                sortKey === key ? "text-amber-deep" : "text-stone"
              }`}
            >
              {label}
              {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
            </button>
          ))}
        </div>
        <ol>
          {groupBoard.map((p, i) => {
            const mine = myVotes[p.slug];
            return (
              <li
                key={p.slug}
                className={`grid grid-cols-1 gap-2 border-b border-ink/8 px-4 py-4 sm:grid-cols-[5.5rem_1fr_4.5rem_5.5rem_7rem] sm:items-center sm:gap-3 sm:px-5 ${
                  i % 2 ? "bg-paper/40" : "bg-white"
                }`}
              >
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["want", "Want"],
                      ["maybe", "Maybe"],
                      ["skip", "Skip"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      disabled={!joined}
                      onClick={() => vote(p.slug, v)}
                      className={`border px-2 py-1 text-[11px] font-semibold disabled:opacity-40 ${
                        mine === v
                          ? v === "want"
                            ? "border-amber bg-amber text-ink"
                            : v === "maybe"
                              ? "border-ink bg-ink text-white"
                              : "border-stone bg-stone text-white"
                          : "border-ink/15 text-ink-soft hover:border-amber"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink sm:text-xl">
                    <Link
                      href={`/new-york/${p.slug}`}
                      className="hover:text-amber-deep"
                    >
                      {p.name}
                    </Link>
                  </p>
                  <p className="text-xs text-ink-soft">{p.neighborhood}</p>
                </div>
                <p className="text-left font-display text-xl text-ink sm:text-right">
                  {p.tiwScore}
                </p>
                <p className="text-left text-sm text-ink-soft sm:text-right">
                  {p.wantCount}/{group.voters.length} want
                  {p.maybeCount ? ` · ${p.maybeCount} maybe` : ""}
                </p>
                <p className="text-left font-display text-xl text-ink sm:text-right">
                  {p.groupFit}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      {favourites.length >= 2 ? (
        <section className="border border-ink/10 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink">
                Build our trip from group favourites
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Uses places with ~50%+ group support (or top picks if still
                early). Open the full plan editor to rearrange days and save.
              </p>
            </div>
            <label className="text-sm">
              Days{" "}
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="ml-1 border border-ink/15 bg-white px-2 py-1"
              >
                {Array.from({ length: MAX_TRIP_DAYS }, (_, i) => i + 1).map(
                  (n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <p className="mt-3 text-sm text-ink-soft">{plan.note}</p>
          <div className="mt-4 space-y-3">
            {plan.days.map((day) => (
              <div key={day.dayIndex} className="border border-ink/10 p-4">
                <p className="font-display text-lg text-ink">{day.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                  {day.stops.map((s) => (
                    <li key={s.slug}>
                      {s.name}{" "}
                      <span className="text-stone">
                        · TIW {s.tiwScore}
                      </span>
                    </li>
                  ))}
                  {!day.stops.length ? <li>Open / buffer</li> : null}
                </ul>
              </div>
            ))}
          </div>
          <Link
            href={`/new-york/plan?group=${encodeURIComponent(code)}&days=${days}`}
            className="mt-5 inline-flex bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
          >
            Open full plan builder →
          </Link>
        </section>
      ) : null}

      <p className="text-xs text-stone">
        TIW = ToursIWant quality rating (0–100). Group column = how many of you
        want it. Group Fit blends both so you can see agreement + quality
        together.
      </p>
    </div>
  );
}
