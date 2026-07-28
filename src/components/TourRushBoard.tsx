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

function urgencyClass(urgency: TourRushLot["urgency"]) {
  switch (urgency) {
    case "ending_soon":
      return "text-rose-700 bg-rose-100";
    case "filling_fast":
      return "text-amber-deep bg-amber/20";
    case "hot":
      return "text-skyline bg-mist";
    default:
      return "text-ink-soft bg-paper-deep";
  }
}

export function TourRushBoard() {
  const [lots, setLots] = useState<LiveLot[]>(() =>
    tourRushLots.map((lot) => ({
      ...lot,
      secondsLeft: lot.endsInMinutes * 60,
    })),
  );
  const [pulseId, setPulseId] = useState<string | null>(null);
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

  return (
    <section
      id="rush"
      className="scroll-mt-0 border-b border-ink/10 bg-[linear-gradient(180deg,var(--paper)_0%,#efe8da_100%)]"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 md:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-skyline">
              Tour Rush · live now
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
              Seats are filling. Timers are running.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ink-soft sm:text-base">
              Countdown, scarcity, and live interest — claim a New York seat
              before someone else does.
            </p>
          </div>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">
            <p className="flex items-center gap-2 text-rose-700">
              <span className="live-dot !bg-rose-600" aria-hidden />
              {endingSoonCount} lots ending within 2 hrs
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:items-stretch">
          {lots.map((lot) => {
            const filled =
              ((lot.spacesTotal - lot.spacesLeft) / lot.spacesTotal) * 100;
            const critical = lot.secondsLeft < 90 * 60 || lot.spacesLeft <= 2;
            const flashing = pulseId === lot.id;

            return (
              <article
                key={lot.id}
                className={`group flex h-full flex-col overflow-hidden border bg-white transition duration-300 ${
                  flashing
                    ? "border-amber shadow-[0_0_0_1px_rgba(212,160,23,0.45)]"
                    : "border-ink/10 hover:border-ink/25"
                }`}
              >
                <div className="relative aspect-[16/10] shrink-0 overflow-hidden">
                  <Image
                    src={lot.image}
                    alt={lot.imageAlt}
                    fill
                    priority={
                      lot.id === "rush-met" || lot.id === "rush-brooklyn"
                    }
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,27,42,0.15)_0%,rgba(12,27,42,0.55)_100%)]" />
                  {lot.badge ? (
                    <span
                      className={`absolute left-3 top-3 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${urgencyClass(lot.urgency)}`}
                    >
                      {lot.badge}
                    </span>
                  ) : null}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">
                        Time left
                      </p>
                      <p
                        className={`font-mono text-lg tabular-nums text-white ${
                          critical ? "countdown-urgent" : ""
                        }`}
                      >
                        {formatCountdown(lot.secondsLeft)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70">
                        From
                      </p>
                      <p className="font-display text-2xl text-white">
                        {formatMoney(lot.priceFrom, lot.currency)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="min-h-[2.75rem] font-display text-lg leading-snug text-ink line-clamp-2 sm:text-xl">
                    {lot.title}
                  </h3>
                  <p className="mt-1 truncate text-sm text-ink-soft">
                    Meet at {lot.meetup}
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-y border-ink/10 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-medium uppercase leading-none tracking-[0.08em] text-ink/45">
                        Interested
                      </p>
                      <p className="mt-1 font-mono text-sm tabular-nums leading-none text-ink">
                        {lot.interested}
                        {lot.justClaimed ? (
                          <span className="ml-1 text-amber-deep">+1</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-medium uppercase leading-none tracking-[0.08em] text-ink/45">
                        Watching
                      </p>
                      <p className="mt-1 font-mono text-sm tabular-nums leading-none text-ink">
                        {lot.watching}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-medium uppercase leading-none tracking-[0.08em] text-ink/45">
                        Seats left
                      </p>
                      <p
                        className={`mt-1 font-mono text-sm tabular-nums leading-none ${
                          lot.spacesLeft <= 2 ? "text-rose-700" : "text-ink"
                        }`}
                      >
                        {lot.spacesLeft}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      <span>Seat fill</span>
                      <span>{Math.round(filled)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden bg-paper-deep">
                      <div
                        className={`h-full transition-all duration-700 ${
                          filled > 70 ? "bg-rose-600" : "bg-amber"
                        }`}
                        style={{ width: `${filled}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/request?tour=${lot.tourSlug}&date=${today}`}
                    className={`mt-auto flex w-full items-center justify-center px-4 py-3 text-sm font-semibold tracking-wide transition ${
                      critical
                        ? "bg-rose-700 text-white hover:bg-rose-800"
                        : "bg-ink text-white hover:bg-ink-soft"
                    }`}
                  >
                    {lot.spacesLeft <= 1 ? "Claim last seat" : "Claim a seat"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-6 text-sm text-ink-soft">
          Live rush floor for New York. Timers and interest counts will connect
          to real traveller activity as operators go live.
        </p>
      </div>
    </section>
  );
}
