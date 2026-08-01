"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BROWSE_MONTHS_AHEAD,
  formatDisplayDate,
  getToursForDate,
  listTourMetros,
  toDateKey,
} from "@/lib/sample-tours";
import { catalogStats } from "@/lib/us-tour-catalog";

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
  const metros = listTourMetros();
  const stats = catalogStats();
  const [citySlug, setCitySlug] = useState("new-york");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [interest, setInterest] = useState<string>("all");

  const tours = useMemo(() => {
    const list = getToursForDate(selectedDate, citySlug);
    if (interest === "all") return list;
    return list.filter((tour) => tour.interest === interest);
  }, [selectedDate, citySlug, interest]);

  const interests = useMemo(() => {
    const set = new Set(
      getToursForDate(selectedDate, citySlug).map((t) => t.interest),
    );
    return ["all", ...Array.from(set)];
  }, [selectedDate, citySlug]);

  const isToday = selectedDate === todayKey;
  const shortcuts = quickOffsets();
  const activeMetro = metros.find((m) => m.slug === citySlug);
  const cityCounts = stats.byCity.filter((c) => c.count > 0).slice(0, 8);

  return (
    <div>
      <div className="mb-8 overflow-hidden border border-ink/10 bg-ink text-white">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amber">
            <span className="live-dot mr-2 align-middle" aria-hidden />
            USA starter catalog
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
            {stats.total} tours · {stats.cities} cities
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {cityCounts.map((metro) => (
            <button
              key={metro.slug}
              type="button"
              onClick={() => setCitySlug(metro.slug)}
              className={`border-t border-white/10 px-4 py-4 text-left transition sm:border-t-0 sm:border-l sm:border-white/10 sm:first:border-l-0 sm:px-5 ${
                citySlug === metro.slug ? "bg-white/10" : "hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{metro.name}</p>
                <span className="font-mono text-[10px] tracking-wider text-amber">
                  {metro.stateCode}
                </span>
              </div>
              <p className="mt-2 font-display text-3xl tabular-nums">
                {metro.count}
              </p>
              <p className="mt-1 text-xs text-white/55">starter tours</p>
            </button>
          ))}
        </div>
      </div>

      <div className="border border-ink/10 bg-white/80 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink">City</span>
            <select
              value={citySlug}
              onChange={(e) => setCitySlug(e.target.value)}
              className="mt-2 w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
            >
              <option value="all">All USA cities</option>
              {metros.map((metro) => (
                <option key={metro.slug} value={metro.slug}>
                  {metro.name}, {metro.stateCode}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">
              When are you travelling?
            </span>
            <input
              type="date"
              value={selectedDate}
              min={todayKey}
              max={maxDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-2 w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
            />
          </label>
        </div>

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

        <div className="mt-4 flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [touch-action:pan-x]">
          {interests.map((item) => {
            const active = interest === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setInterest(item)}
                className={`shrink-0 border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  active
                    ? "border-skyline bg-skyline text-white"
                    : "border-ink/15 text-ink-soft hover:border-ink/35"
                }`}
              >
                {item === "all" ? "All types" : item}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-ink-soft">
          Showing{" "}
          <span className="font-medium text-ink">
            {activeMetro
              ? `${activeMetro.name} tours`
              : "tours across the USA"}
          </span>{" "}
          for{" "}
          <span className="font-medium text-ink">
            {formatDisplayDate(selectedDate)}
          </span>
          . Starter inventory while operators publish live listings — request a
          quote anytime.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {tours.length === 0 ? (
          <div className="border border-dashed border-ink/20 bg-mist/40 p-6 sm:p-8">
            <h2 className="font-display text-2xl text-ink">
              No scheduled tours on this date yet
            </h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              Operators may still run something for{" "}
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
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-skyline">
                    {tour.cityName}, {tour.stateCode}
                  </p>
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
                <h2 className="mt-1 font-display text-2xl text-ink">
                  <Link
                    href={`/tours/${tour.slug}?date=${tour.date}`}
                    className="transition hover:text-skyline"
                  >
                    {tour.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  {tour.departsLabel} · {tour.duration} · Meet at {tour.meetup} ·{" "}
                  {tour.spaces} spaces left · From {tour.priceFrom}
                </p>
                <p className="mt-2 text-sm text-ink-soft">{tour.summary}</p>
              </div>
              <Link
                href={`/tours/${tour.slug}?date=${tour.date}`}
                className="inline-flex items-center justify-center bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
              >
                View details
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
          Don&apos;t see the exact experience? Request a custom tour for your
          travel dates — local operators quote you as they join ToursIWant.
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
