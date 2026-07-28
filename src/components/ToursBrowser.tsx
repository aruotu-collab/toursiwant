"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BROWSE_MONTHS_AHEAD,
  formatDisplayDate,
  getToursForDate,
  toDateKey,
} from "@/lib/sample-tours";
import {
  demandLabel,
  nycDestinationSignals,
} from "@/lib/tour-intelligence";

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function quickOffsets() {
  const today = new Date();
  return [
    { label: "Today", date: toDateKey(today) },
    {
      label: "Tomorrow",
      date: toDateKey(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      ),
    },
    {
      label: "This weekend",
      date: (() => {
        const day = today.getDay();
        const daysUntilSaturday = (6 - day + 7) % 7 || 7;
        return toDateKey(
          new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + daysUntilSaturday,
          ),
        );
      })(),
    },
    {
      label: "In 3 months",
      date: toDateKey(addMonths(today, 3)),
    },
  ];
}

export function ToursBrowser() {
  const todayKey = toDateKey(new Date());
  const maxDate = toDateKey(addMonths(new Date(), BROWSE_MONTHS_AHEAD));
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const tours = useMemo(
    () => getToursForDate(selectedDate),
    [selectedDate],
  );

  const isToday = selectedDate === todayKey;
  const shortcuts = quickOffsets();
  const hotSignals = nycDestinationSignals.slice(0, 4);

  return (
    <div>
      <div className="mb-8 overflow-hidden border border-ink/10 bg-ink text-white">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amber">
            <span className="live-dot mr-2 align-middle" aria-hidden />
            NYC demand snapshot
          </p>
          <Link
            href="/#market"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55 hover:text-white"
          >
            Full board →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {hotSignals.map((signal) => (
            <div
              key={signal.id}
              className="border-t border-white/10 px-4 py-4 sm:border-t-0 sm:border-l sm:border-white/10 sm:first:border-l-0 sm:px-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{signal.name}</p>
                <span className="font-mono text-[10px] tracking-wider text-amber">
                  {demandLabel(signal.level)}
                </span>
              </div>
              <p className="mt-2 font-display text-3xl tabular-nums">
                {signal.planned}
              </p>
              <p className="mt-1 text-xs text-white/55">
                groups planning · {signal.window}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-ink/10 bg-white/80 p-5 sm:p-6">
        <label className="block">
          <span className="text-sm font-medium text-ink">
            When are you visiting New York?
          </span>
          <input
            type="date"
            value={selectedDate}
            min={todayKey}
            max={maxDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="mt-2 w-full max-w-xs border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => {
            const active = selectedDate === shortcut.date;
            return (
              <button
                key={shortcut.label}
                type="button"
                onClick={() => setSelectedDate(shortcut.date)}
                className={`border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-ink/20 bg-paper/50 text-ink-soft hover:border-ink/40"
                }`}
              >
                {shortcut.label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-ink-soft">
          Showing tours for{" "}
          <span className="font-medium text-ink">
            {formatDisplayDate(selectedDate)}
          </span>
          . Browse up to {BROWSE_MONTHS_AHEAD} months ahead — operators publish
          schedules in advance; if nothing fits, request a custom tour for that
          date.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {tours.length === 0 ? (
          <div className="border border-dashed border-ink/20 bg-mist/40 p-6 sm:p-8">
            <h2 className="font-display text-2xl text-ink">
              No scheduled tours on this date yet
            </h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              Operators may still be able to run something for{" "}
              {formatDisplayDate(selectedDate)}. Tell them what you want.
            </p>
            <Link
              href={`/request?date=${selectedDate}`}
              className="mt-5 inline-flex bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
            >
              Request a tour for this date
            </Link>
          </div>
        ) : (
          tours.map((tour) => (
            <article
              key={`${tour.slug}-${tour.date}`}
              className="grid gap-4 border border-ink/10 bg-white/80 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-2xl text-ink">{tour.title}</h2>
                  {tour.joinable ? (
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-deep">
                      Joinable
                    </span>
                  ) : null}
                  {tour.schedule === "flexible" ? (
                    <span className="text-xs font-semibold uppercase tracking-wider text-skyline">
                      On request
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-ink-soft">
                  {tour.departsLabel} · {tour.duration} · Meet at {tour.meetup} ·{" "}
                  {tour.spaces} spaces left · From {tour.priceFrom}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-skyline">
                  {tour.spaces <= 3
                    ? `Demand signal · only ${tour.spaces} seats left`
                    : `${tour.spaces} travellers can still join this departure`}
                </p>
              </div>
              <Link
                href={`/request?tour=${tour.slug}&date=${tour.date}`}
                className="inline-flex items-center justify-center bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
              >
                I want this tour
              </Link>
            </article>
          ))
        )}
      </div>

      <div className="mt-12 border border-dashed border-ink/20 bg-mist/50 p-6 sm:p-8">
        <h2 className="font-display text-2xl text-ink">
          Planning ahead
          {isToday ? "" : ` for ${formatDisplayDate(selectedDate)}`}?
        </h2>
        <p className="mt-2 max-w-xl text-ink-soft">
          Don&apos;t see the exact experience? Request a custom New York tour
          for your travel dates and local operators will quote you.
        </p>
        <Link
          href={`/request?date=${selectedDate}`}
          className="mt-5 inline-flex bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
        >
          Request a custom tour for this date
        </Link>
      </div>
    </div>
  );
}
