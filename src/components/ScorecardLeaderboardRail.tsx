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
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-3 py-1.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="live-dot shrink-0" aria-hidden />
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-amber-deep">
            Leaderboards
            <span className="text-ink/25"> · </span>
            <span className="text-stone">
              {active.city}
              <span className="hidden sm:inline">
                {" "}
                · {active.title}
              </span>
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {active.href ? (
            <Link
              href={active.href}
              className="hidden text-xs font-semibold text-ink underline-offset-2 hover:text-amber-deep hover:underline sm:inline"
            >
              Open →
            </Link>
          ) : null}
          <div
            className="flex items-center gap-1"
            role="tablist"
            aria-label="Boards"
          >
            {boards.map((b, i) => (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${b.city}: ${b.title}`}
                onClick={() => setIndex(i)}
                className={`h-1 w-4 transition ${
                  i === index ? "bg-amber" : "bg-ink/15 hover:bg-ink/30"
                }`}
              />
            ))}
          </div>
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
              className="w-full shrink-0 px-3 py-2 sm:px-4"
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
    <ol className="divide-y divide-ink/8">
      {board.rows.map((row) => {
        const inner = (
          <>
            <span className="w-6 shrink-0 font-mono text-[11px] text-amber-deep">
              #{row.rank}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink">
              {row.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-stone">
              {row.meta}
            </span>
          </>
        );

        return (
          <li key={`${board.id}-${row.rank}-${row.name}`}>
            {row.href ? (
              <Link
                href={row.href}
                className="flex items-center gap-2 py-1.5 transition hover:bg-paper"
              >
                {inner}
              </Link>
            ) : (
              <div className="flex items-center gap-2 py-1.5 opacity-80">
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
