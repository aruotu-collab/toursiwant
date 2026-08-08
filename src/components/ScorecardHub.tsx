"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  scorecardCities,
  scorecardCountries,
  scorecardDestinations,
  scorecardStates,
} from "@/lib/scorecard-destinations";

export function ScorecardHub() {
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");

  const countries = useMemo(() => scorecardCountries(), []);
  const states = useMemo(() => scorecardStates(country || undefined), [country]);
  const cities = useMemo(
    () => scorecardCities(country || undefined, state || undefined),
    [country, state],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scorecardDestinations.filter((d) => {
      if (country && d.country !== country) return false;
      if (state && d.state !== state) return false;
      if (city && d.city !== city) return false;
      if (!q) return true;
      return (
        d.city.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.blurb.toLowerCase().includes(q)
      );
    });
  }, [country, state, city, query]);

  return (
    <div className="space-y-10">
      <section className="border border-ink/10 bg-white p-5 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-deep">
          Find a destination
        </p>
        <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
          Country, state, then city
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Pick where you&apos;re going. Live scorecards open the full TIW board;
          others show as coming soon.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone">
              Country
            </span>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setState("");
                setCity("");
              }}
              className="mt-1.5 w-full border border-ink/15 bg-paper px-3 py-2.5 outline-none focus:border-amber"
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone">
              State / region
            </span>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setCity("");
              }}
              className="mt-1.5 w-full border border-ink/15 bg-paper px-3 py-2.5 outline-none focus:border-amber"
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone">
              City
            </span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1.5 w-full border border-ink/15 bg-paper px-3 py-2.5 outline-none focus:border-amber"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 flex w-full flex-col gap-1.5 text-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone">
            Or search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="New York, California, Miami…"
            className="w-full border border-ink/15 bg-paper px-3 py-2.5 outline-none focus:border-amber"
          />
        </label>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-2xl text-ink">Destinations</h2>
          <p className="font-mono text-xs text-stone">
            {filtered.length} shown
          </p>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {filtered.map((d) => {
            const live = Boolean(d.href);
            const body = (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-deep">
                  {d.country}
                  <span className="text-stone"> · </span>
                  {d.state}
                </p>
                <h3 className="mt-2 font-display text-2xl text-ink">{d.city}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {d.blurb}
                </p>
                {live && d.stats ? (
                  <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-stone">
                    <span>{d.stats.placesLabel}</span>
                    <span>{d.stats.likesLabel}</span>
                    <span>{d.stats.explorersLabel}</span>
                    {d.stats.topScoreLabel ? (
                      <span className="text-amber-deep">{d.stats.topScoreLabel}</span>
                    ) : null}
                  </p>
                ) : null}
                <p className="mt-4 text-sm font-semibold">
                  {live ? (
                    <span className="text-amber-deep">
                      {d.cta || "Open scorecard"} →
                    </span>
                  ) : (
                    <span className="text-stone">Coming soon</span>
                  )}
                </p>
              </>
            );

            return (
              <li key={d.id}>
                {live && d.href ? (
                  <Link
                    href={d.href}
                    className="block h-full border border-ink/10 bg-white p-5 transition hover:border-amber"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="h-full border border-ink/10 bg-paper-deep/30 p-5 opacity-80">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!filtered.length ? (
          <p className="mt-8 text-sm text-ink-soft">
            No destinations match. Try another state or clear the search.
          </p>
        ) : null}
      </section>
    </div>
  );
}
