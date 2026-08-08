"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlaceBySlug } from "@/lib/nyc-places";
import {
  buildPlanFromSelections,
  MAX_TRIP_DAYS,
  suggestedDaysForSelections,
} from "@/lib/scoreboard-plan";
import { useNycWants } from "@/lib/use-nyc-wants";

export function PersonalPlanBuilder() {
  const router = useRouter();
  const { wants, days, ready, toggle, clear, removeMany, setDays } =
    useNycWants();
  /** Dropdown override — ignored again once wants change. */
  const [manualOverride, setManualOverride] = useState(false);
  const wantsKey = wants.join("|");

  const neededDays = useMemo(
    () => suggestedDaysForSelections(wants),
    [wants],
  );

  useEffect(() => {
    setManualOverride(false);
  }, [wantsKey]);

  // Match scoreboard projection: days = packed plan length.
  useEffect(() => {
    if (!ready || !wants.length || manualOverride) return;
    if (neededDays !== days) setDays(neededDays);
  }, [ready, wants.length, wantsKey, neededDays, days, setDays, manualOverride]);

  useEffect(() => {
    if (!ready) return;
    router.replace(`/new-york/plan?days=${days}`, { scroll: false });
  }, [ready, days, router]);

  const plan = useMemo(
    () => buildPlanFromSelections(wants, days),
    [wants, days],
  );

  const filledDays = useMemo(
    () => plan.days.filter((d) => d.stops.length > 0).length,
    [plan.days],
  );

  if (!ready) {
    return <p className="text-ink-soft">Loading your selections…</p>;
  }

  if (!wants.length) {
    return (
      <div className="border border-ink/10 bg-white p-8 text-center">
        <p className="font-display text-2xl text-ink">No places selected yet</p>
        <p className="mt-2 text-ink-soft">
          Go back to the scoreboard and tap Want to go on places you like.
        </p>
        <Link
          href="/new-york#board"
          className="mt-6 inline-block bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-soft"
        >
          Open New York Scoreboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-deep">
            Your New York plan
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink">
            Built from {wants.length} wants
          </h1>
          <p className="mt-3 max-w-2xl text-ink-soft">{plan.note}</p>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Days adjust automatically when you add or remove places. You can
            still override the length with the dropdown.
          </p>
        </div>
        <label className="block text-sm">
          <span className="text-ink-soft">Trip length (auto-fits wants)</span>
          <select
            value={days}
            onChange={(e) => {
              setManualOverride(true);
              setDays(Number(e.target.value));
            }}
            className="mt-1 block border border-ink/15 bg-white px-3 py-2 outline-none focus:border-amber"
          >
            {Array.from({ length: MAX_TRIP_DAYS }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>
                  {n} day{n === 1 ? "" : "s"}
                  {n === neededDays ? " · suggested" : ""}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {manualOverride && filledDays >= 1 && filledDays < days ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-amber/40 bg-amber/[0.1] px-4 py-3">
          <p className="text-sm text-ink">
            You set {days} days, but the plan only fills {filledDays}. Use the
            fitted length?
          </p>
          <button
            type="button"
            onClick={() => {
              setManualOverride(false);
              setDays(filledDays);
            }}
            className="bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            Use {filledDays} days
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Selected hours" value={`${plan.selectedHours}h`} />
        <Stat label="Trip capacity" value={`${plan.capacityHours}h`} />
        <Stat
          label="In the plan"
          value={`${plan.recommended.length}/${wants.length}`}
        />
      </div>

      <div className="space-y-4">
        {plan.days.map((day) => (
          <section
            key={day.dayIndex}
            className="border border-ink/10 bg-white p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl text-ink">{day.title}</h2>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-xs text-stone">
                  ~{day.hours}h · grouped to reduce travel
                </p>
                {day.stops.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const slugs = day.stops.map((s) => s.slug);
                      removeMany(slugs);
                      // Clearing a later day should also shorten the trip.
                      if (day.dayIndex === days && days > 1) {
                        setDays(days - 1);
                      }
                    }}
                    className="text-xs font-semibold text-ink-soft underline decoration-ink/20 hover:text-ink"
                  >
                    Clear this day
                  </button>
                ) : null}
              </div>
            </div>
            {day.stops.length === 0 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-soft">
                  Empty day — clear it from the trip length, or add wants.
                </p>
                {day.dayIndex > 1 ? (
                  <button
                    type="button"
                    onClick={() => setDays(day.dayIndex - 1)}
                    className="text-sm font-semibold text-amber-deep hover:underline"
                  >
                    Drop to {day.dayIndex - 1} days
                  </button>
                ) : null}
              </div>
            ) : (
              <ol className="mt-4 space-y-2">
                {day.stops.map((s, i) => (
                  <li
                    key={s.slug}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 py-2 last:border-0"
                  >
                    <div>
                      <span className="font-mono text-xs text-amber-deep">
                        {i + 1}.
                      </span>{" "}
                      <Link
                        href={`/new-york/${s.slug}`}
                        className="font-display text-lg text-ink hover:text-amber-deep"
                      >
                        {s.name}
                      </Link>
                      <p className="text-xs text-ink-soft">
                        {s.neighborhood} · ~{s.hours}h · TIW {s.tiwScore}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(s.slug)}
                      className="text-xs text-stone hover:text-ink"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>

      {plan.overflow.length ? (
        <section className="border border-ink/10 bg-paper-deep/40 p-5 sm:p-6">
          <h2 className="font-display text-2xl text-ink">Hard to fit</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Still in your wants — keep them for a longer trip, or remove to
            clean the list.
          </p>
          <ul className="mt-4 space-y-2">
            {plan.overflow.map((s) => (
              <li
                key={s.slug}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  <span className="font-display text-lg text-ink">{s.name}</span>
                  <span className="ml-2 text-sm text-ink-soft">
                    TIW {s.tiwScore} · ~{s.hours}h
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => toggle(s.slug)}
                  className="text-xs text-stone hover:text-ink"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border border-ink/10 bg-white p-5">
        <h2 className="font-display text-xl text-ink">All your wants</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {wants.map((slug) => {
            const p = getPlaceBySlug(slug);
            return (
              <li key={slug}>
                <button
                  type="button"
                  onClick={() => toggle(slug)}
                  className="border border-amber bg-amber/15 px-3 py-1.5 text-sm text-ink"
                  title="Remove"
                >
                  ✓ {p?.name || slug}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/new-york#board"
            className="border border-ink/20 px-4 py-2 text-sm font-semibold hover:border-amber"
          >
            Add more from scoreboard
          </Link>
          <button
            type="button"
            onClick={clear}
            className="text-sm text-stone hover:text-ink"
          >
            Clear all wants
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink/10 bg-white p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-stone">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
