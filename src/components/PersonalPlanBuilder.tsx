"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPlaceBySlug } from "@/lib/nyc-places";
import {
  buildPlanFromSelections,
  MAX_TRIP_DAYS,
  suggestedDaysForSelections,
} from "@/lib/scoreboard-plan";
import { NYC_PLAN_TEMPLATE_SLUG } from "@/lib/saved-trip-kinds";
import { useNycWants } from "@/lib/use-nyc-wants";

export function PersonalPlanBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const savedIdParam = searchParams.get("saved");
  const {
    wants,
    days,
    ready,
    toggle,
    clear,
    removeMany,
    setDays,
    setWants,
  } = useNycWants();
  /** Dropdown override — ignored again once wants change. */
  const [manualOverride, setManualOverride] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [tripTitle, setTripTitle] = useState("My New York trip");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [loadingSaved, setLoadingSaved] = useState(Boolean(savedIdParam));
  const wantsKey = wants.join("|");

  const neededDays = useMemo(
    () => suggestedDaysForSelections(wants),
    [wants],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user?: { id: string } | null }) => {
        if (!cancelled) setSignedIn(Boolean(data.user));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!savedIdParam) {
      setLoadingSaved(false);
      return;
    }

    let cancelled = false;
    setLoadingSaved(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/saved-trips?id=${encodeURIComponent(savedIdParam)}`,
        );
        if (!res.ok) {
          if (!cancelled) {
            setStatus(
              res.status === 401
                ? "Sign in to open this saved trip."
                : "Could not load that saved trip.",
            );
          }
          return;
        }
        const data = (await res.json()) as {
          trip?: {
            id: string;
            title: string;
            placeSlugs?: string[];
            planDays?: number;
            templateSlug?: string;
          };
        };
        if (cancelled || !data.trip) return;
        if (data.trip.templateSlug !== NYC_PLAN_TEMPLATE_SLUG) {
          setStatus("That saved trip is a template — open it from My trips.");
          return;
        }
        const slugs = (data.trip.placeSlugs || []).filter(Boolean);
        setWants(slugs);
        if (data.trip.planDays) {
          setManualOverride(true);
          setDays(data.trip.planDays);
        }
        setSavedTripId(data.trip.id);
        setTripTitle(data.trip.title || "My New York trip");
        setStatus(`Loaded “${data.trip.title}”.`);
      } catch {
        if (!cancelled) setStatus("Could not load that saved trip.");
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, savedIdParam, setWants, setDays]);

  useEffect(() => {
    if (loadingSaved) return;
    setManualOverride(false);
  }, [wantsKey, loadingSaved]);

  // Match scoreboard projection: days = packed plan length.
  useEffect(() => {
    if (!ready || loadingSaved || !wants.length || manualOverride) return;
    if (neededDays !== days) setDays(neededDays);
  }, [
    ready,
    loadingSaved,
    wants.length,
    wantsKey,
    neededDays,
    days,
    setDays,
    manualOverride,
  ]);

  useEffect(() => {
    if (!ready || loadingSaved) return;
    const params = new URLSearchParams();
    params.set("days", String(days));
    if (savedTripId) params.set("saved", savedTripId);
    router.replace(`/new-york/plan?${params.toString()}`, { scroll: false });
  }, [ready, loadingSaved, days, savedTripId, router]);

  const plan = useMemo(
    () => buildPlanFromSelections(wants, days),
    [wants, days],
  );

  const filledDays = useMemo(
    () => plan.days.filter((d) => d.stops.length > 0).length,
    [plan.days],
  );

  async function saveTrip(asNew = false) {
    if (signedIn === false) {
      const next = encodeURIComponent(
        `/new-york/plan?days=${days}${savedTripId ? `&saved=${savedTripId}` : ""}`,
      );
      window.location.href = `/join?next=${next}`;
      return;
    }

    setBusy(true);
    setStatus("");
    try {
      const routeNodes = plan.days
        .filter((d) => d.stops.length > 0)
        .map((d) => ({
          id: `day-${d.dayIndex}`,
          label: d.title,
          kind: "day" as const,
          dayIndex: d.dayIndex,
          dayLabel: d.title,
          stops: d.stops.map((s) => ({ id: s.slug, label: s.name })),
        }));

      const title =
        tripTitle.trim() ||
        `New York · ${filledDays || days} day${(filledDays || days) === 1 ? "" : "s"}`;

      const updating = Boolean(savedTripId) && !asNew;
      const res = await fetch("/api/saved-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          updating
            ? {
                action: "update",
                id: savedTripId,
                title,
                route: `${filledDays || days} days · ${wants.length} places`,
                placeSlugs: wants,
                planDays: days,
                routeNodes,
              }
            : {
                action: "create",
                templateSlug: NYC_PLAN_TEMPLATE_SLUG,
                templateTitle: "New York scoreboard plan",
                title,
                route: `${filledDays || days} days · ${wants.length} places`,
                region: "New York",
                cityCodes: ["NYC"],
                placeSlugs: wants,
                planDays: days,
                routeNodes,
              },
        ),
      });
      const data = (await res.json()) as {
        trip?: { id: string; title: string };
        error?: string;
      };
      if (!res.ok || !data.trip) {
        if (res.status === 401) {
          const next = encodeURIComponent(`/new-york/plan?days=${days}`);
          window.location.href = `/join?next=${next}`;
          return;
        }
        throw new Error(data.error || "Could not save trip");
      }
      setSavedTripId(data.trip.id);
      setTripTitle(data.trip.title);
      setStatus(
        updating
          ? "Trip updated — find it under My trips."
          : "Saved — find it under My trips in the menu.",
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save trip");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || loadingSaved) {
    return <p className="text-ink-soft">Loading your plan…</p>;
  }

  if (!wants.length) {
    return (
      <div className="border border-ink/10 bg-white p-8 text-center">
        <p className="font-display text-2xl text-ink">No places selected yet</p>
        <p className="mt-2 text-ink-soft">
          Go back to the scoreboard and tap Want to go on places you like.
        </p>
        {status ? (
          <p className="mt-3 text-sm text-amber-deep">{status}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/new-york#board"
            className="inline-block bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-soft"
          >
            Open New York Scoreboard
          </Link>
          <Link
            href="/account#my-trips"
            className="inline-block border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:border-amber"
          >
            My saved trips
          </Link>
        </div>
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

      <section className="border border-ink/10 bg-ink px-5 py-6 text-white sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
          Save this trip
        </p>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          You can keep as many New York plans as you want — give each one a
          different name (e.g. First-timers, Food crawl, With kids). They all
          show up under My trips.
        </p>
        {savedTripId ? (
          <p className="mt-2 text-sm text-amber/90">
            Editing a saved trip. Use <span className="font-semibold">Update</span>{" "}
            to overwrite it, or <span className="font-semibold">Save as new</span>{" "}
            to keep the old one and add another.
          </p>
        ) : null}
        <label className="mt-4 block max-w-md">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
            Trip name
          </span>
          <input
            value={tripTitle}
            onChange={(e) => setTripTitle(e.target.value)}
            placeholder="e.g. NYC first-timers · 5 days"
            className="w-full border border-white/25 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => saveTrip(false)}
            className="bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-60"
          >
            {busy
              ? "Saving…"
              : signedIn === false
                ? "Sign in to save"
                : savedTripId
                  ? "Update this trip"
                  : "Save as my trip"}
          </button>
          {savedTripId ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => saveTrip(true)}
              className="border border-white/25 px-4 py-2.5 text-sm hover:border-amber hover:text-amber disabled:opacity-60"
            >
              Save as a new trip
            </button>
          ) : null}
          <Link
            href="/account#my-trips"
            className="border border-white/25 px-4 py-2.5 text-sm hover:border-amber hover:text-amber"
          >
            View all My trips
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 border-t border-white/15 pt-4">
          <button
            type="button"
            onClick={() => {
              setSavedTripId(null);
              setTripTitle("My New York trip");
              setStatus(
                "Detached from the saved trip. Rename, tweak places, then Save as my trip for another entry in My trips.",
              );
              router.replace(`/new-york/plan?days=${days}`, { scroll: false });
            }}
            className="text-sm text-white/70 underline-offset-2 hover:text-amber hover:underline"
          >
            Start another trip (keep these places)
          </button>
          <button
            type="button"
            onClick={() => {
              clear();
              setSavedTripId(null);
              setTripTitle("My New York trip");
              setStatus("");
              router.push("/new-york#board");
            }}
            className="text-sm text-white/70 underline-offset-2 hover:text-amber hover:underline"
          >
            Clear &amp; pick a fresh set on the scoreboard
          </button>
        </div>
        {status ? (
          <p className="mt-3 text-sm text-amber">{status}</p>
        ) : null}
      </section>

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
                {day.stops.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setManualOverride(true);
                      setDays(Math.max(1, day.dayIndex - 1));
                    }}
                    className="text-xs font-semibold text-amber-deep hover:underline"
                  >
                    Drop empty days from here
                  </button>
                ) : null}
              </div>
            </div>
            {day.stops.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">
                Empty day — clear it from the trip length, or add wants.
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {day.stops.map((s, i) => (
                  <li
                    key={s.slug}
                    className="flex flex-wrap items-start justify-between gap-3 border-t border-ink/10 pt-3 first:border-0 first:pt-0"
                  >
                    <div>
                      <p className="font-mono text-[11px] text-stone">
                        Stop {i + 1}
                      </p>
                      <Link
                        href={`/new-york/${s.slug}`}
                        className="font-display text-xl text-ink hover:text-amber-deep"
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
            const name = p?.name || slug;
            return (
              <li
                key={slug}
                className="inline-flex items-center gap-1 border border-amber bg-amber/15 text-sm text-ink"
              >
                <Link
                  href={`/new-york/${slug}`}
                  className="px-3 py-1.5 hover:text-amber-deep"
                >
                  {name}
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(slug)}
                  className="border-l border-amber/50 px-2 py-1.5 text-stone hover:bg-amber/25 hover:text-ink"
                  aria-label={`Remove ${name}`}
                  title="Remove"
                >
                  ×
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
