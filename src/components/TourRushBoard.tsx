"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatCountdown,
  formatMoney,
  tourRushLots,
  type TourRushLot,
} from "@/lib/tour-rush";
import { toDateKey } from "@/lib/sample-tours";

type LiveLot = TourRushLot & {
  secondsLeft: number;
  justClaimed?: boolean;
};

type UrgencyFilter = "all" | "ending_soon" | "filling_fast" | "hot" | "open";

const urgencyTabs: { id: UrgencyFilter; label: string }[] = [
  { id: "all", label: "All lots" },
  { id: "ending_soon", label: "Ending soon" },
  { id: "filling_fast", label: "Filling fast" },
  { id: "hot", label: "Hot" },
  { id: "open", label: "Still open" },
];

export function TourRushBoard({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [lots, setLots] = useState<LiveLot[]>(() =>
    tourRushLots.map((lot) => ({
      ...lot,
      secondsLeft: lot.endsInMinutes * 60,
    })),
  );
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [filter, setFilter] = useState<UrgencyFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    tourRushLots[0]?.id ?? null,
  );
  const today = toDateKey(new Date());

  useEffect(() => {
    const tick = window.setInterval(() => {
      setLots((current) =>
        current.map((lot) => ({
          ...lot,
          secondsLeft: Math.max(lot.secondsLeft - 1, 0),
          justClaimed: false,
        })),
      );
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const rush = window.setInterval(() => {
      setLots((current) => {
        const open = current.filter((lot) => lot.spacesLeft > 0);
        if (open.length === 0) return current;
        const target = open[Math.floor(Math.random() * open.length)];
        setPulseId(target.id);

        return current.map((lot) => {
          if (lot.id !== target.id) return lot;
          const claim = Math.random() > 0.55 && lot.spacesLeft > 1;
          return {
            ...lot,
            interested: lot.interested + (Math.random() > 0.3 ? 1 : 0),
            watching: lot.watching + (Math.random() > 0.5 ? 1 : 0),
            spacesLeft: claim ? lot.spacesLeft - 1 : lot.spacesLeft,
            justClaimed: claim,
          };
        });
      });
    }, 5200);

    return () => window.clearInterval(rush);
  }, []);

  useEffect(() => {
    if (!pulseId) return;
    const id = window.setTimeout(() => setPulseId(null), 1200);
    return () => window.clearTimeout(id);
  }, [pulseId]);

  const endingSoonCount = useMemo(
    () => lots.filter((lot) => lot.secondsLeft < 2 * 60 * 60).length,
    [lots],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return lots;
    return lots.filter((lot) => lot.urgency === filter);
  }, [lots, filter]);

  const selected =
    filtered.find((lot) => lot.id === selectedId) || filtered[0] || null;

  useEffect(() => {
    if (selected && selectedId !== selected.id) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const filled = selected
    ? ((selected.spacesTotal - selected.spacesLeft) / selected.spacesTotal) *
      100
    : 0;
  const critical = selected
    ? selected.secondsLeft < 90 * 60 || selected.spacesLeft <= 2
    : false;

  return (
    <section
      id={embedded ? undefined : "rush"}
      className={
        embedded
          ? "overflow-x-hidden text-white"
          : "scroll-mt-0 overflow-x-hidden border-b border-white/10 bg-ink text-white"
      }
    >
      <div
        className={
          embedded
            ? "w-full"
            : "mx-auto w-full max-w-[90rem] px-5 py-10 sm:px-8 sm:py-12"
        }
      >
        {!embedded ? (
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber">
              Tour Rush · live now
            </p>
            <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl">
              Seats are filling. Timers are running.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">
              Countdown, scarcity, and live interest — claim a seat before
              someone else does.
            </p>
          </div>
        ) : (
          <p className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-rose-300">
            <span className="live-dot !bg-rose-500" aria-hidden />
            {endingSoonCount} lots ending within 2 hrs
          </p>
        )}

        <div className={`${embedded ? "" : "mt-6 "}border border-amber/30 bg-amber/5 p-4 sm:p-5`}>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
            1 · Which lots do you want to see?
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [touch-action:pan-x] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {urgencyTabs.map((tab) => {
              const active = filter === tab.id;
              const count =
                tab.id === "all"
                  ? lots.length
                  : lots.filter((l) => l.urgency === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`shrink-0 border px-3 py-2.5 text-left transition ${
                    active
                      ? "border-amber bg-amber text-ink"
                      : "border-white/15 text-white hover:border-white/35"
                  }`}
                >
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider opacity-70">
                    {count} lots
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <div className="order-2 min-w-0 border border-white/10 bg-white/[0.03] lg:order-1">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Live seats
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                {filtered.length} shown
              </p>
            </div>
            <ul className="divide-y divide-white/10 lg:max-h-[34rem] lg:overflow-y-auto lg:overscroll-contain">
              {filtered.map((lot) => {
                const selectedRow = selected?.id === lot.id;
                const flashing = pulseId === lot.id;
                const rowCritical =
                  lot.secondsLeft < 90 * 60 || lot.spacesLeft <= 2;
                return (
                  <li key={lot.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(lot.id)}
                      className={`flex w-full gap-3 px-4 py-3.5 text-left transition ${
                        selectedRow
                          ? "bg-amber/15"
                          : flashing
                            ? "bg-white/10"
                            : "hover:bg-white/[0.06]"
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          rowCritical ? "bg-rose-500" : "bg-amber"
                        }`}
                        style={{
                          boxShadow: rowCritical
                            ? "0 0 10px #f43f5e88"
                            : "0 0 10px #f5c54288",
                        }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber">
                            {lot.badge || lot.urgency.replace("_", " ")}
                          </span>
                          <span
                            className={`font-mono text-[10px] tabular-nums uppercase tracking-wider ${
                              rowCritical ? "text-rose-300" : "text-white/40"
                            }`}
                          >
                            {formatCountdown(lot.secondsLeft)}
                          </span>
                        </span>
                        <span className="mt-0.5 block font-semibold text-white [overflow-wrap:anywhere]">
                          {lot.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-white/55">
                          {lot.spacesLeft} seats · {lot.interested} interested
                          {lot.justClaimed ? " · +1 claimed" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 self-center font-mono text-sm text-amber">
                        {formatMoney(lot.priceFrom, lot.currency)}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-white/50">
                  No lots for this filter. Try All lots.
                </li>
              ) : null}
            </ul>
          </div>

          <div className="order-1 min-w-0 lg:order-2">
            {selected ? (
              <div className="overflow-hidden border border-white/10 bg-[#0a1520]">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={selected.image}
                    alt={selected.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,27,42,0.2)_0%,rgba(12,27,42,0.85)_100%)]" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">
                        Time left
                      </p>
                      <p
                        className={`font-mono text-2xl tabular-nums text-white ${
                          critical ? "countdown-urgent" : ""
                        }`}
                      >
                        {formatCountdown(selected.secondsLeft)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">
                        From
                      </p>
                      <p className="font-display text-3xl text-white">
                        {formatMoney(selected.priceFrom, selected.currency)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
                    2 · Claim this lot
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-white">
                    {selected.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/55">
                    Meet at {selected.meetup}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/10 py-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                        Interested
                      </p>
                      <p className="mt-1 font-mono text-lg tabular-nums text-white">
                        {selected.interested}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                        Watching
                      </p>
                      <p className="mt-1 font-mono text-lg tabular-nums text-white">
                        {selected.watching}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                        Seats left
                      </p>
                      <p
                        className={`mt-1 font-mono text-lg tabular-nums ${
                          selected.spacesLeft <= 2
                            ? "text-rose-400"
                            : "text-white"
                        }`}
                      >
                        {selected.spacesLeft}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
                      <span>Seat fill</span>
                      <span>{Math.round(filled)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden bg-white/10">
                      <div
                        className={`h-full transition-all duration-700 ${
                          filled > 70 ? "bg-rose-500" : "bg-amber"
                        }`}
                        style={{ width: `${filled}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/tours/${selected.tourSlug}?date=${today}`}
                      className={`inline-flex flex-1 items-center justify-center px-4 py-3 text-sm font-semibold transition ${
                        critical
                          ? "bg-rose-700 text-white hover:bg-rose-800"
                          : "bg-amber text-ink hover:bg-amber-deep"
                      }`}
                    >
                      {selected.spacesLeft <= 1
                        ? "View & claim last seat"
                        : "View tour details"}
                    </Link>
                    <Link
                      href={`/request?tour=${selected.tourSlug}&date=${today}`}
                      className="inline-flex flex-1 items-center justify-center border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:border-amber/50"
                    >
                      Request this tour
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-white/15 p-8 text-center text-sm text-white/50">
                Select a lot from the list.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
