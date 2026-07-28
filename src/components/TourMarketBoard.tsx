"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  activityFeedSeed,
  activityVerb,
  demandLabel,
  marketHeadlines,
  nycDestinationSignals,
  type ActivityEvent,
  type DestinationSignal,
} from "@/lib/tour-intelligence";

function jitter(base: number, spread: number) {
  return Math.max(1, base + Math.round((Math.random() - 0.4) * spread));
}

function seedCount() {
  return activityFeedSeed.length;
}

export function TourMarketBoard() {
  const [signals, setSignals] = useState(nycDestinationSignals);
  const [feed, setFeed] = useState(activityFeedSeed);
  const [liveCount, setLiveCount] = useState(0);
  const [mockCount, setMockCount] = useState(seedCount());
  const [clock, setClock] = useState("");
  const [flashId, setFlashId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const planned = signals.reduce((sum, row) => sum + row.planned, 0);
    const seats = signals.reduce((sum, row) => sum + row.seatsFilling, 0);
    return { planned, seats, destinations: signals.length };
  }, [signals]);

  useEffect(() => {
    async function loadLiveActivity() {
      try {
        const response = await fetch("/api/requests", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          liveCount?: number;
          mockCount?: number;
          activity?: ActivityEvent[];
        };
        if (payload.activity?.length) {
          setFeed(payload.activity.slice(0, 10));
        }
        setLiveCount(payload.liveCount || 0);
        setMockCount(payload.mockCount || seedCount());
      } catch {
        // Keep seeded feed if API is unavailable.
      }
    }

    loadLiveActivity();
    const refresh = window.setInterval(loadLiveActivity, 15000);
    return () => window.clearInterval(refresh);
  }, []);

  useEffect(() => {
    function tickClock() {
      setClock(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "America/New_York",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }
    tickClock();
    const clockId = window.setInterval(tickClock, 1000);
    return () => window.clearInterval(clockId);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSignals((current) => {
        const index = Math.floor(Math.random() * current.length);
        const next = current.map((row, i) => {
          if (i !== index) return row;
          const planned = jitter(row.planned, 2);
          const seatsFilling = jitter(row.seatsFilling, 3);
          return {
            ...row,
            planned,
            seatsFilling,
            changePct: Number(
              (row.changePct + (Math.random() - 0.45) * 1.2).toFixed(1),
            ),
          };
        });
        setFlashId(next[index].id);
        return next;
      });

      setFeed((current) =>
        current.map((item) => ({
          ...item,
          minutesAgo: item.minutesAgo + 1,
        })),
      );
    }, 4200);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!flashId) return;
    const id = window.setTimeout(() => setFlashId(null), 900);
    return () => window.clearTimeout(id);
  }, [flashId]);

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,23,0.14),transparent_45%),linear-gradient(180deg,rgba(31,78,121,0.25),transparent_40%)]" />
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light" />

      <div className="relative">
        <LiveTicker />

        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 md:py-16">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber">
                Tour intelligence · New York
              </p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl">
                The live market for what travellers want.
              </h2>
              <p className="mt-3 max-w-2xl text-white/70">
                Not a brochure — a demand board. See what&apos;s being planned,
                where seats are filling, and which New York experiences are
                heating up before you book.
              </p>
            </div>
            <div className="font-mono text-right text-xs text-white/55">
              <p>NYC {clock || "--:--:--"}</p>
              <p className="mt-1 flex items-center justify-end gap-2 text-amber">
                <span className="live-dot" aria-hidden />
                {liveCount > 0
                  ? `${liveCount} LIVE · ${mockCount} SEED`
                  : `${mockCount} SEED REQUESTS`}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Metric
              label="Groups planning"
              value={totals.planned}
              hint="across top destinations"
            />
            <Metric
              label="Seats filling"
              value={totals.seats}
              hint="shared + private demand"
            />
            <Metric
              label="Hot spots tracked"
              value={totals.destinations}
              hint="New York board"
            />
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="overflow-hidden border border-white/10 bg-white/[0.03]">
              <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.55fr] gap-2 border-b border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 sm:px-5">
                <span>Destination</span>
                <span className="text-right">Planned</span>
                <span className="text-right">Seats</span>
                <span className="text-right">Signal</span>
              </div>
              <ul>
                {signals.map((row) => (
                  <DestinationRow
                    key={row.id}
                    row={row}
                    flashing={flashId === row.id}
                  />
                ))}
              </ul>
            </div>

            <div className="border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 sm:px-5">
                Activity tape
              </div>
              <ul className="divide-y divide-white/10">
                {feed.map((event) => (
                  <li key={event.id} className="px-4 py-3.5 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-amber">
                        {activityVerb(event.kind)}
                        {event.source === "live" ? " · LIVE" : ""}
                      </span>
                      <span className="font-mono text-[10px] text-white/40">
                        {event.minutesAgo === 0
                          ? "just now"
                          : `${event.minutesAgo}m ago`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white">{event.destination}</p>
                    <p className="mt-0.5 text-sm text-white/55">{event.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm text-white/60">
              Board starts with seeded New York demand, then grows as real
              travellers submit requests. Live captures gradually replace the
              demo tape.
            </p>
            <Link
              href="/tours"
              className="inline-flex items-center justify-center bg-amber px-6 py-3.5 text-sm font-semibold tracking-wide text-ink transition hover:bg-amber-deep"
            >
              Enter the tour board
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{hint}</p>
    </div>
  );
}

function DestinationRow({
  row,
  flashing,
}: {
  row: DestinationSignal;
  flashing: boolean;
}) {
  const up = row.changePct >= 0;
  return (
    <li
      className={`grid grid-cols-[1.2fr_0.7fr_0.7fr_0.55fr] gap-2 border-b border-white/5 px-4 py-3.5 transition sm:px-5 ${
        flashing ? "bg-amber/10" : "hover:bg-white/[0.04]"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-white">{row.name}</p>
        <p className="mt-0.5 font-mono text-[10px] tracking-wider text-white/40">
          {row.shortName} · {row.window}
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-xl tabular-nums text-white">
          {row.planned}
        </p>
        <p
          className={`font-mono text-[10px] ${
            up ? "text-emerald-300/90" : "text-rose-300/90"
          }`}
        >
          {up ? "+" : ""}
          {row.changePct}%
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-xl tabular-nums text-white">
          {row.seatsFilling}
        </p>
        <p className="font-mono text-[10px] text-white/40">filling</p>
      </div>
      <div className="flex items-start justify-end">
        <span
          className={`font-mono text-[10px] font-semibold tracking-[0.14em] ${
            row.level === "hot"
              ? "text-amber"
              : row.level === "rising"
                ? "text-emerald-300"
                : "text-white/55"
          }`}
        >
          {demandLabel(row.level)}
        </span>
      </div>
    </li>
  );
}

function LiveTicker() {
  const tape = [...marketHeadlines, ...marketHeadlines];

  return (
    <div className="border-b border-white/10 bg-black/25">
      <div className="ticker-track flex gap-10 whitespace-nowrap py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/75">
        {tape.map((line, index) => (
          <span key={`${line}-${index}`} className="inline-flex items-center gap-10">
            <span className="text-amber">◆</span>
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
