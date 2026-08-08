"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildScorecardLeaderboards,
  type ScorecardLeaderboard,
} from "@/lib/scorecard-leaderboards";

const SLIDE_MS = 5600;

export function ScorecardLeaderboardRail() {
  const boards = useMemo(() => buildScorecardLeaderboards(), []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || boards.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % boards.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [paused, boards.length]);

  const active = boards[index]!;

  return (
    <section
      className="border border-ink/10 bg-white"
      aria-roledescription="carousel"
      aria-label="Destination leaderboards"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="live-dot" aria-hidden />
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-deep">
            Leaderboards
          </p>
        </div>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Boards">
          {boards.map((b, i) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${b.city}: ${b.title}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 w-5 transition ${
                i === index ? "bg-amber" : "bg-ink/15 hover:bg-ink/30"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {boards.map((board) => (
            <div
              key={board.id}
              className="w-full shrink-0 px-4 py-5 sm:px-5 sm:py-6"
              aria-hidden={board.id !== active.id}
            >
              <BoardPanel board={board} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BoardPanel({ board }: { board: ScorecardLeaderboard }) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone">
            {board.region}
            <span className="text-ink/25"> · </span>
            {board.live ? "Live" : "Coming soon"}
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink sm:text-[1.75rem]">
            {board.city}
          </h2>
          <p className="mt-1 text-sm font-semibold text-amber-deep">{board.title}</p>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">{board.blurb}</p>
        </div>
        {board.href ? (
          <Link
            href={board.href}
            className="shrink-0 text-sm font-semibold text-ink underline-offset-2 hover:text-amber-deep hover:underline"
          >
            Open scorecard →
          </Link>
        ) : (
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-stone">
            Preview
          </span>
        )}
      </div>

      <ol className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
        {board.rows.map((row) => {
          const inner = (
            <>
              <span className="w-8 shrink-0 font-mono text-xs text-amber-deep">
                #{row.rank}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-ink">
                {row.name}
              </span>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-stone">
                {row.meta}
              </span>
            </>
          );

          return (
            <li key={`${board.id}-${row.rank}-${row.name}`}>
              {row.href ? (
                <Link
                  href={row.href}
                  className="flex items-center gap-3 py-2.5 text-sm transition hover:bg-paper"
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex items-center gap-3 py-2.5 text-sm opacity-80">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
