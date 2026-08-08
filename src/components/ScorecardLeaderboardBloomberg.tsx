"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  buildScorecardLeaderboards,
  leaderboardTickerLines,
  type LeaderboardRow,
  type ScorecardLeaderboard,
} from "@/lib/scorecard-leaderboards";

const ROTATE_MS = 5200;

const rowGrid =
  "grid grid-cols-[2rem_minmax(0,1.4fr)_3.1rem_3.1rem_3.4rem] items-center gap-x-2 sm:grid-cols-[2.5rem_minmax(0,1.6fr)_3.5rem_3.5rem_4rem] sm:gap-x-3";

function formatChg(n: number | undefined) {
  if (typeof n !== "number") return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}`;
}

export function ScorecardLeaderboardBloomberg() {
  const boards = useMemo(() => buildScorecardLeaderboards(), []);
  const tape = useMemo(() => {
    const lines = leaderboardTickerLines(boards);
    return [...lines, ...lines];
  }, [boards]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || boards.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % boards.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, boards.length]);

  const active = boards[index]!;

  return (
    <section
      className="overflow-hidden border border-[#2a2a2a] bg-[#0b0d10] text-[#e8e6e1] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      aria-label="Bloomberg-style destination leaderboard"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#2a2a2a] bg-[#111418] px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#ff9100] shadow-[0_0_8px_#ff9100]" />
          <span className="text-[#ff9100]">TIW</span>
          <span className="text-white/35">|</span>
          <span className="text-white/70">Scoreboard terminal</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
          {active.live ? "Live" : "Preview"} · delay 0s
        </p>
      </div>

      <div className="overflow-hidden border-b border-[#2a2a2a] bg-black/40">
        <div className="ticker-track flex gap-8 whitespace-nowrap py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ff9100]/80">
          {tape.map((line, i) => (
            <span key={`${line}-${i}`} className="inline-flex items-center gap-8">
              <span className="text-white/25">◆</span>
              {line}
            </span>
          ))}
        </div>
      </div>

      <div
        className="flex gap-1 overflow-x-auto overscroll-x-contain border-b border-[#2a2a2a] bg-[#0f1216] px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Markets"
      >
        {boards.map((b, i) => {
          const on = i === index;
          return (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setIndex(i)}
              className={`shrink-0 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
                on
                  ? "bg-[#ff9100] text-black"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {b.city === "New York City"
                ? "NYC"
                : b.city.slice(0, 3).toUpperCase()}{" "}
              {shortTitle(b.title)}
            </button>
          );
        })}
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <TerminalTable board={active} />
        <aside className="border-t border-[#2a2a2a] bg-[#0e1115] p-3 sm:p-4 lg:border-l lg:border-t-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff9100]">
            {active.region} / {active.city}
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-white/85">
            {active.title}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/45">{active.blurb}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
            <div className="border border-[#2a2a2a] px-2 py-2">
              <dt className="text-white/35">Names</dt>
              <dd className="mt-1 text-[#ff9100]">{active.rows.length}</dd>
            </div>
            <div className="border border-[#2a2a2a] px-2 py-2">
              <dt className="text-white/35">Status</dt>
              <dd className="mt-1 text-white/80">
                {active.live ? "Open" : "Soon"}
              </dd>
            </div>
          </dl>
          {active.href ? (
            <Link
              href={active.href}
              className="mt-4 inline-flex w-full items-center justify-center bg-[#ff9100] px-3 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-black hover:bg-[#ffb040]"
            >
              Open board →
            </Link>
          ) : (
            <p className="mt-4 border border-dashed border-white/15 px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
              Market not open
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function shortTitle(title: string) {
  return title
    .replace("Most liked right now", "LIKED")
    .replace("Preview · most explored", "PREV")
    .replace("Family favorites", "FAM")
    .replace("First-timer musts", "1ST")
    .slice(0, 8);
}

function TerminalTable({ board }: { board: ScorecardLeaderboard }) {
  return (
    <div className="min-w-0 overflow-x-auto px-2 py-2 sm:px-3">
      <div
        className={`${rowGrid} border-b border-[#2a2a2a] px-1 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#ff9100]/90`}
      >
        <span>#</span>
        <span>Name</span>
        <span>Tiw</span>
        <span>Chg</span>
        <span className="text-right">Vol</span>
      </div>
      <ul>
        {board.rows.map((row) => (
          <li key={`${board.id}-${row.rank}-${row.name}`}>
            <RowShell href={row.href}>
              <RowCells row={row} />
            </RowShell>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RowShell({
  href,
  children,
}: {
  href: string | null;
  children: ReactNode;
}) {
  const className = `${rowGrid} border-b border-[#1c2128] px-1 py-2 font-mono text-[11px] transition hover:bg-[#ff9100]/08 sm:text-xs`;
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={`${className} opacity-80`}>{children}</div>;
}

function RowCells({ row }: { row: LeaderboardRow }) {
  const chg = row.change ?? 0;
  const chgClass =
    chg > 0 ? "text-[#3dd68c]" : chg < 0 ? "text-[#ff5c5c]" : "text-white/50";

  return (
    <>
      <span className="text-[#ff9100]">{row.rank}</span>
      <span className="min-w-0 truncate text-white/90">
        <span className="text-white/35">{row.symbol}</span> {row.name}
      </span>
      <span className="tabular-nums text-white/85">
        {typeof row.score === "number" ? row.score.toFixed(1) : "—"}
      </span>
      <span className={`tabular-nums ${chgClass}`}>{formatChg(row.change)}</span>
      <span className="text-right tabular-nums text-white/55">
        {row.volumeLabel || "—"}
      </span>
    </>
  );
}
