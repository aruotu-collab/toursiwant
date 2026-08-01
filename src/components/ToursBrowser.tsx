"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ToursCityMap } from "@/components/ToursCityMap";
import {
  BROWSE_MONTHS_AHEAD,
  formatDisplayDate,
  listTourMetros,
  toDateKey,
  type TourDeparture,
} from "@/lib/sample-tours";
import { catalogStats, type CatalogTour } from "@/lib/us-tour-catalog";
import {
  citiesInState,
  deriveThemes,
  listTourStates,
  searchToursForTraveller,
  themeColor,
  tourThemeDefs,
  type TourThemeId,
} from "@/lib/tour-themes";

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

export function ToursBrowser({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const todayKey = toDateKey(new Date());
  const maxDate = toDateKey(addMonths(new Date(), BROWSE_MONTHS_AHEAD));
  const metros = listTourMetros();
  const states = listTourStates();
  const stats = catalogStats();
  const [theme, setTheme] = useState<TourThemeId>("all");
  const [stateCode, setStateCode] = useState("all");
  const [citySlug, setCitySlug] = useState("all");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [operatorTours, setOperatorTours] = useState<CatalogTour[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data: { tours?: CatalogTour[] }) => {
        if (!cancelled) setOperatorTours(data.tours || []);
      })
      .catch(() => {
        if (!cancelled) setOperatorTours([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const citiesForState = useMemo(
    () => citiesInState(stateCode),
    [stateCode],
  );

  const tours = useMemo(
    () =>
      searchToursForTraveller({
        dateKey: selectedDate,
        theme,
        stateCode,
        citySlug,
        query,
        extraTours: operatorTours,
      }),
    [selectedDate, theme, stateCode, citySlug, query, operatorTours],
  );

  const shortcuts = quickOffsets();
  const activeMetro = metros.find((m) => m.slug === citySlug);
  const activeState = states.find((s) => s.code === stateCode);

  const mapPins = useMemo(() => {
    if (citySlug === "all" && stateCode === "all" && theme === "all" && !query) {
      return citiesForState.slice(0, 18).map((metro) => ({
        id: metro.slug,
        label: metro.name,
        color: "#5b9bd5",
        selected: false,
      }));
    }
    return tours.slice(0, 18).map((tour) => ({
      id: tour.slug,
      label: tour.title,
      color: themeColor(deriveThemes(tour)[0] || "city"),
      selected: selectedSlug === tour.slug,
    }));
  }, [citySlug, stateCode, theme, query, citiesForState, tours, selectedSlug]);

  function selectTour(tour: TourDeparture) {
    setSelectedSlug(tour.slug);
  }

  function onMapSelect(id: string) {
    if (citySlug === "all" && stateCode === "all" && theme === "all" && !query) {
      const metro = metros.find((m) => m.slug === id);
      if (metro) {
        setStateCode(metro.stateCode);
        setCitySlug(metro.slug);
      }
      return;
    }
    setSelectedSlug(id);
  }

  const list = embedded ? tours.slice(0, 16) : tours;
  const placeLabel =
    citySlug !== "all"
      ? activeMetro?.name || "City"
      : stateCode !== "all"
        ? activeState?.name || stateCode
        : "All USA";

  return (
    <section className="overflow-x-hidden text-white">
      {!embedded ? (
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-white/55">
          <span className="live-dot mr-2 align-middle" aria-hidden />
          Search from anywhere · {stats.total} tours · {stats.cities} cities
        </p>
      ) : (
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-white/55">
          {placeLabel} · {tours.length} tours · {formatDisplayDate(selectedDate)}
        </p>
      )}

      {/* 1 · Theme */}
      <div className="border border-amber/30 bg-amber/5 p-4 sm:p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          1 · What kind of tour? (theme)
        </p>
        <p className="mt-1 text-sm text-white/55">
          Religious, museum, beach, food… — search even if you&apos;re not in
          that city yet.
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [touch-action:pan-x] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tourThemeDefs.map((item) => {
            const active = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTheme(item.id);
                  setSelectedSlug(null);
                }}
                className={`shrink-0 border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-amber bg-amber text-ink"
                    : "border-white/15 text-white hover:border-white/35"
                }`}
              >
                <span
                  className="mb-1.5 block h-1.5 w-6"
                  style={{ background: item.color }}
                  aria-hidden
                />
                <span className="block text-xs font-semibold uppercase tracking-wider">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 · State + city + keyword */}
      <div className="mt-4 border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          2 · Where? (state → city → name search)
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
              State
            </span>
            <select
              value={stateCode}
              onChange={(e) => {
                setStateCode(e.target.value);
                setCitySlug("all");
                setSelectedSlug(null);
              }}
              className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-amber/50"
            >
              <option value="all">All US states</option>
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name} ({state.code}) · {state.count}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
              City
            </span>
            <select
              value={citySlug}
              onChange={(e) => {
                setCitySlug(e.target.value);
                setSelectedSlug(null);
              }}
              className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-amber/50"
            >
              <option value="all">All cities in scope</option>
              {citiesForState.map((metro) => (
                <option key={metro.slug} value={metro.slug}>
                  {metro.name}, {metro.stateCode}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
              Search by name
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Patterson, Bethel, Jehovah…"
              className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber/50"
            />
          </label>
        </div>
        {stateCode !== "all" || citySlug !== "all" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {citiesForState.map((metro) => {
              const active = citySlug === metro.slug;
              return (
                <button
                  key={metro.slug}
                  type="button"
                  onClick={() => {
                    setCitySlug(metro.slug);
                    setStateCode(metro.stateCode);
                    setSelectedSlug(null);
                  }}
                  className={`border px-2.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-amber bg-amber text-ink"
                      : "border-white/15 text-white/70 hover:border-white/35"
                  }`}
                >
                  {metro.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* 3 · When */}
      <div className="mt-4 border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          3 · Browse a date (optional)
        </p>
        <p className="mt-1 text-sm text-white/55">
          This only previews what&apos;s listed that day. When you request a tour,
          you choose your own travel date on the next screen.
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

      {/* List + map */}
      <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <div className="order-2 min-w-0 border border-white/10 bg-white/[0.03] lg:order-1">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Matches
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              {tours.length} found
            </p>
          </div>
          <ul className="divide-y divide-white/10 lg:max-h-[34rem] lg:overflow-y-auto lg:overscroll-contain">
            {list.map((tour) => {
              const selected = selectedSlug === tour.slug;
              const themes = deriveThemes(tour);
              return (
                <li key={`${tour.slug}-${tour.date}`}>
                  <div
                    className={`flex w-full gap-3 px-4 py-3.5 transition ${
                      selected ? "bg-amber/15" : "hover:bg-white/[0.06]"
                    }`}
                    onMouseEnter={() => setSelectedSlug(tour.slug)}
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: themeColor(themes[0] || "city"),
                        boxShadow: `0 0 10px ${themeColor(themes[0] || "city")}88`,
                      }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber">
                          {tour.cityName}, {tour.stateCode}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                          {themes.slice(0, 2).join(" · ")}
                        </span>
                      </p>
                      <Link
                        href={`/tours/${tour.slug}?date=${tour.date}`}
                        onClick={() => selectTour(tour)}
                        className="mt-0.5 block font-semibold text-white [overflow-wrap:anywhere] hover:text-amber"
                      >
                        {tour.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-white/55 [overflow-wrap:anywhere]">
                        {tour.departsLabel} · {tour.duration} · {tour.meetup}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/tours/${tour.slug}?date=${tour.date}`}
                          className="border border-white/20 px-2.5 py-1 text-xs font-semibold text-white hover:border-amber/50"
                        >
                          View
                        </Link>
                        <Link
                          href={`/request?tour=${tour.slug}&suggested=${tour.date}`}
                          className="bg-amber px-2.5 py-1 text-xs font-semibold text-ink hover:bg-amber-deep"
                        >
                          Request · pick your date
                        </Link>
                      </div>
                    </div>
                    <p className="shrink-0 self-start font-mono text-sm text-amber">
                      {tour.priceFrom}
                    </p>
                  </div>
                </li>
              );
            })}
            {list.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-white/50">
                No matches. Try another theme/state, or{" "}
                <Link
                  href={`/request?date=${selectedDate}`}
                  className="font-semibold text-amber hover:underline"
                >
                  request a custom tour
                </Link>
                .
              </li>
            ) : null}
          </ul>
          {embedded && tours.length > list.length ? (
            <div className="border-t border-white/10 px-4 py-3">
              <Link
                href="/tours"
                className="text-sm font-semibold text-amber hover:underline"
              >
                See all {tours.length} matches →
              </Link>
            </div>
          ) : null}
        </div>

        <div className="order-1 min-w-0 space-y-4 overflow-visible lg:order-2">
          <div className="overflow-visible border border-white/10 bg-[#0a1520]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                Discovery map
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                {placeLabel}
              </p>
            </div>
            <ToursCityMap
              cityLabel={placeLabel}
              stateCode={
                citySlug !== "all"
                  ? activeMetro?.stateCode
                  : stateCode !== "all"
                    ? stateCode
                    : "USA"
              }
              pins={mapPins}
              mode={
                citySlug === "all" && !query && theme === "all"
                  ? "cities"
                  : "tours"
              }
              onSelect={onMapSelect}
            />
          </div>

          <div className="border border-dashed border-white/15 bg-white/[0.02] p-4">
            <p className="font-display text-lg text-white">
              Found it? Request a seat.
            </p>
            <p className="mt-1 text-sm text-white/55">
              Example: Religious → New York → search &quot;Patterson&quot; →
              request the Bethel visitor tour — from anywhere in the world.
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
