"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ToursCityMap } from "@/components/ToursCityMap";
import {
  BROWSE_MONTHS_AHEAD,
  formatDisplayDate,
  getToursForDate,
  listTourMetros,
  toDateKey,
  type TourDeparture,
} from "@/lib/sample-tours";
import { catalogStats } from "@/lib/us-tour-catalog";
import type { TourInterest } from "@/lib/tour-types";

const interestColor: Record<TourInterest | "all", string> = {
  all: "#f5c542",
  "City highlights": "#5b9bd5",
  "Food & markets": "#fb7185",
  "Museums & culture": "#60a5fa",
  Nightlife: "#c084fc",
  "Neighborhood walk": "#86efac",
  "Private driver": "#d4a017",
  "Cruise shore excursion": "#7dd3c0",
  "Airport / hotel transfer": "#f97316",
  "Something custom": "#f59e0b",
};

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
      label: "Weekend",
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
      label: "+3 months",
      date: toDateKey(addMonths(today, 3)),
    },
  ];
}

function colorFor(interest: string) {
  return interestColor[interest as TourInterest] || "#5b9bd5";
}

export function ToursBrowser({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const todayKey = toDateKey(new Date());
  const maxDate = toDateKey(addMonths(new Date(), BROWSE_MONTHS_AHEAD));
  const metros = listTourMetros();
  const stats = catalogStats();
  const [citySlug, setCitySlug] = useState("new-york");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [interest, setInterest] = useState<string>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const tours = useMemo(() => {
    const list = getToursForDate(selectedDate, citySlug);
    if (interest === "all") return list;
    return list.filter((tour) => tour.interest === interest);
  }, [selectedDate, citySlug, interest]);

  const interests = useMemo(() => {
    const set = new Set(
      getToursForDate(selectedDate, citySlug).map((t) => t.interest),
    );
    return ["all", ...Array.from(set)] as string[];
  }, [selectedDate, citySlug]);

  const shortcuts = quickOffsets();
  const activeMetro = metros.find((m) => m.slug === citySlug);
  const cityCounts = stats.byCity.filter((c) => c.count > 0);

  const mapPins = useMemo(() => {
    if (citySlug === "all") {
      return cityCounts.map((metro) => ({
        id: metro.slug,
        label: metro.name,
        color: metro.slug === citySlug ? "#f5c542" : "#5b9bd5",
        selected: false,
      }));
    }
    return tours.map((tour) => ({
      id: tour.slug,
      label: tour.title,
      color: colorFor(tour.interest),
      selected: selectedSlug === tour.slug,
    }));
  }, [citySlug, cityCounts, tours, selectedSlug]);

  function selectTour(tour: TourDeparture) {
    setSelectedSlug(tour.slug);
  }

  function onMapSelect(id: string) {
    if (citySlug === "all") {
      setCitySlug(id);
      setSelectedSlug(null);
      return;
    }
    setSelectedSlug(id);
  }

  const list = embedded ? tours.slice(0, 16) : tours;
  const cityLabel =
    citySlug === "all" ? "All USA" : activeMetro?.name || "City";

  return (
    <section className="overflow-x-hidden text-white">
      {!embedded ? (
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-white/55">
          <span className="live-dot mr-2 align-middle" aria-hidden />
          {stats.total} starter tours · {stats.cities} cities ·{" "}
          {formatDisplayDate(selectedDate)}
        </p>
      ) : (
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-white/55">
          {cityLabel} · {tours.length} tours · {formatDisplayDate(selectedDate)}
        </p>
      )}

      {/* 1 · Where */}
      <div className="border border-amber/30 bg-amber/5 p-4 sm:p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          1 · Where are you going?
        </p>
        <p className="mt-1 text-sm text-white/55">
          Pick a US city — the map and list update together.
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [touch-action:pan-x] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => {
              setCitySlug("all");
              setSelectedSlug(null);
            }}
            className={`shrink-0 border px-3 py-2.5 text-left transition ${
              citySlug === "all"
                ? "border-amber bg-amber text-ink"
                : "border-white/15 text-white hover:border-white/35"
            }`}
          >
            <span className="block text-sm font-semibold">All USA</span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider opacity-70">
              {stats.total} tours
            </span>
          </button>
          {cityCounts.map((metro) => {
            const active = citySlug === metro.slug;
            return (
              <button
                key={metro.slug}
                type="button"
                onClick={() => {
                  setCitySlug(metro.slug);
                  setSelectedSlug(null);
                }}
                className={`shrink-0 border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-amber bg-amber text-ink"
                    : "border-white/15 text-white hover:border-white/35"
                }`}
              >
                <span className="block text-sm font-semibold">{metro.name}</span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider opacity-70">
                  {metro.stateCode} · {metro.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 · When */}
      <div className="mt-4 border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          2 · When are you travelling?
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {shortcuts.map((shortcut) => {
            const active = selectedDate === shortcut.date;
            return (
              <button
                key={shortcut.label}
                type="button"
                onClick={() => setSelectedDate(shortcut.date)}
                className={`border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-amber bg-amber text-ink"
                    : "border-white/15 text-white/75 hover:border-white/35 hover:text-white"
                }`}
              >
                {shortcut.label}
              </button>
            );
          })}
          <label className="ml-auto block min-w-[10rem]">
            <span className="sr-only">Travel date</span>
            <input
              type="date"
              value={selectedDate}
              min={todayKey}
              max={maxDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full border border-white/15 bg-ink/70 px-3 py-2 text-sm text-white outline-none [color-scheme:dark] focus:border-amber/50"
            />
          </label>
        </div>
      </div>

      {/* 3 · What */}
      <div className="mt-4 border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          3 · What kind of tour?
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [touch-action:pan-x] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {interests.map((item) => {
            const active = interest === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setInterest(item)}
                className={`shrink-0 border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-amber bg-amber text-ink"
                    : "border-white/15 text-white hover:border-white/35"
                }`}
              >
                <span
                  className="mb-1.5 block h-1.5 w-6"
                  style={{ background: colorFor(item) }}
                  aria-hidden
                />
                <span className="block text-xs font-semibold uppercase tracking-wider">
                  {item === "all" ? "All types" : item}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List + map */}
      <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <div className="order-2 min-w-0 border border-white/10 bg-white/[0.03] lg:order-1">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Live listing
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              {tours.length} shown
            </p>
          </div>
          <ul className="divide-y divide-white/10 lg:max-h-[34rem] lg:overflow-y-auto lg:overscroll-contain">
            {list.map((tour) => {
              const selected = selectedSlug === tour.slug;
              return (
                <li key={`${tour.slug}-${tour.date}`}>
                  <Link
                    href={`/tours/${tour.slug}?date=${tour.date}`}
                    onClick={() => selectTour(tour)}
                    onMouseEnter={() => setSelectedSlug(tour.slug)}
                    onFocus={() => setSelectedSlug(tour.slug)}
                    className={`flex w-full gap-3 px-4 py-3.5 text-left transition active:bg-white/10 ${
                      selected ? "bg-amber/15" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: colorFor(tour.interest),
                        boxShadow: `0 0 10px ${colorFor(tour.interest)}88`,
                      }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber">
                          {tour.cityName}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                          {tour.joinable
                            ? "Joinable"
                            : tour.schedule === "flexible"
                              ? "On request"
                              : tour.interest}
                        </span>
                      </span>
                      <span className="mt-0.5 block font-semibold text-white [overflow-wrap:anywhere]">
                        {tour.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-white/55 [overflow-wrap:anywhere]">
                        {tour.departsLabel} · {tour.duration} · {tour.meetup}
                        {tour.joinable ? " · open to join" : ""}
                      </span>
                    </span>
                    <span className="shrink-0 self-center font-mono text-sm text-amber">
                      {tour.priceFrom}
                    </span>
                  </Link>
                </li>
              );
            })}
            {list.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-white/50">
                No scheduled tours for this filter.{" "}
                <Link
                  href={`/request?date=${selectedDate}`}
                  className="font-semibold text-amber hover:underline"
                >
                  Request a custom tour
                </Link>
              </li>
            ) : null}
          </ul>
          {embedded && tours.length > list.length ? (
            <div className="border-t border-white/10 px-4 py-3">
              <Link
                href="/tours"
                className="text-sm font-semibold text-amber hover:underline"
              >
                See all {tours.length} tours →
              </Link>
            </div>
          ) : null}
        </div>

        <div className="order-1 min-w-0 space-y-4 overflow-visible lg:order-2">
          <div className="overflow-visible border border-white/10 bg-[#0a1520]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                {citySlug === "all" ? "USA map" : "City map"}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                {citySlug === "all" ? "Tap a city" : "Tap a pin"}
              </p>
            </div>
            <ToursCityMap
              cityLabel={cityLabel}
              stateCode={
                citySlug === "all" ? "USA" : activeMetro?.stateCode
              }
              pins={mapPins}
              mode={citySlug === "all" ? "cities" : "tours"}
              onSelect={onMapSelect}
            />
          </div>

          <div className="border border-dashed border-white/15 bg-white/[0.02] p-4">
            <p className="font-display text-lg text-white">
              Don&apos;t see the exact day?
            </p>
            <p className="mt-1 text-sm text-white/55">
              Request a custom tour for {formatDisplayDate(selectedDate)} —
              local operators quote as they join.
            </p>
            <Link
              href={`/request?date=${selectedDate}`}
              className="mt-3 inline-flex bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep"
            >
              Request a custom tour
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
