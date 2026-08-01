"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UsaRadialMap } from "@/components/UsaRadialMap";
import {
  adjacentZones,
  boardingKindLabel,
  experienceTypeColor,
  experienceTypeTabs,
  getNearMePlace,
  matchesExperienceType,
  stopsNearPlace,
  type BoardingStop,
  type ExperienceType,
  type NearMePlace,
} from "@/lib/near-me";
import type { UsaNearbySpot, UsaStay } from "@/lib/places-usa";
import { toDateKey } from "@/lib/sample-tours";
import {
  activityHref,
  pulseCategoryColor,
  pulseStatusLabel,
  pulseZones,
  seedPulseActivities,
  zoneActivityStats,
  type PulseActivity,
  type PulseCategory,
  type PulseZone,
  type PulseZoneId,
} from "@/lib/tour-pulse";

type FilterId = ExperienceType;

type Suggestion = {
  id: string;
  name: string;
  subtitle: string;
  source: "curated" | "google";
  placeId?: string;
  zoneId?: PulseZoneId;
  t?: number;
};

/** Cubic path Harbor (SW) → Airports (NE) in viewBox 0 0 400 520 */
const CORRIDOR_D =
  "M 48 470 C 90 400, 70 340, 110 290 C 160 230, 200 210, 230 160 C 265 105, 300 80, 350 42";

function pointOnCorridor(t: number): { x: number; y: number } {
  // Sample the path with a hidden SVG path for accuracy isn't available in SSR;
  // use piecewise lerp along control-ish waypoints matching the curve.
  const pts = [
    { x: 48, y: 470 },
    { x: 70, y: 400 },
    { x: 95, y: 330 },
    { x: 130, y: 270 },
    { x: 180, y: 210 },
    { x: 230, y: 160 },
    { x: 290, y: 95 },
    { x: 350, y: 42 },
  ];
  const scaled = Math.max(0, Math.min(1, t)) * (pts.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  const a = pts[i];
  const b = pts[Math.min(i + 1, pts.length - 1)];
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
  };
}

function dominantCategory(activities: PulseActivity[]): PulseCategory {
  const counts: Partial<Record<PulseCategory, number>> = {};
  for (const a of activities) {
    counts[a.category] = (counts[a.category] || 0) + 1;
  }
  let best: PulseCategory = "tour";
  let n = 0;
  for (const [cat, c] of Object.entries(counts) as [PulseCategory, number][]) {
    if (c > n) {
      n = c;
      best = cat;
    }
  }
  return best;
}

export function TourPulseBoard({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const today = toDateKey(new Date());
  const [filter, setFilter] = useState<FilterId>("all");
  const [activities, setActivities] = useState(seedPulseActivities);
  const [selectedZoneId, setSelectedZoneId] = useState<PulseZoneId | null>(
    null,
  );
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
  );
  const [tickFlash, setTickFlash] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [usaEnabled, setUsaEnabled] = useState(false);
  const [usaStay, setUsaStay] = useState<UsaStay | null>(null);
  const [usaSpots, setUsaSpots] = useState<UsaNearbySpot[]>([]);
  const [usaActivities, setUsaActivities] = useState<PulseActivity[] | null>(
    null,
  );
  const [useCorridor, setUseCorridor] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const nearPlace = placeId ? getNearMePlace(placeId) || null : null;
  const hasStay = Boolean(nearPlace || usaStay);

  useEffect(() => {
    fetch("/api/places/status")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => setUsaEnabled(Boolean(d.enabled)))
      .catch(() => setUsaEnabled(false));
  }, []);

  useEffect(() => {
    if (usaStay || placeId) {
      setSuggestions([]);
      return;
    }
    const q = locationQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { places?: Suggestion[]; enabled?: boolean }) => {
          setSuggestions(d.places || []);
          if (typeof d.enabled === "boolean") setUsaEnabled(d.enabled);
        })
        .catch(() => setSuggestions([]));
    }, 280);
    return () => window.clearTimeout(handle);
  }, [locationQuery, usaStay, placeId]);

  const nearbyStops = useMemo(() => {
    if (usaSpots.length > 0) {
      return usaSpots.filter(
        (s) =>
          filter === "all" || s.experienceTypes.includes(filter),
      );
    }
    if (!placeId) return [];
    return stopsNearPlace(placeId, filter);
  }, [usaSpots, placeId, filter]);

  const nearZones = useMemo(() => {
    if (usaStay?.zoneId) return adjacentZones(usaStay.zoneId);
    if (nearPlace) return adjacentZones(nearPlace.zoneId);
    return null;
  }, [nearPlace, usaStay]);

  const localActivities = useMemo(() => {
    if (usaActivities) return usaActivities;
    if (!nearZones) return [];
    return activities.filter((a) => nearZones.includes(a.zoneId));
  }, [activities, nearZones, usaActivities]);

  const filtered = useMemo(() => {
    return localActivities.filter((a) => matchesExperienceType(a, filter));
  }, [localActivities, filter]);

  const selectedZone = pulseZones.find((z) => z.id === selectedZoneId) || null;
  const zoneItems = useMemo(
    () =>
      selectedZoneId
        ? filtered.filter((a) => a.zoneId === selectedZoneId)
        : [],
    [filtered, selectedZoneId],
  );

  const selectedActivity =
    localActivities.find((a) => a.id === selectedActivityId) ||
    activities.find((a) => a.id === selectedActivityId) ||
    null;

  const nextUp = useMemo(() => {
    const soon = filtered
      .filter((a) =>
        ["preparing", "departing_soon", "en_route"].includes(a.status),
      )
      .sort((a, b) => a.minutesAgo - b.minutesAgo)[0];
    return soon || filtered[0] || null;
  }, [filtered]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: localActivities.length,
    };
    for (const tab of experienceTypeTabs) {
      if (tab.id === "all") continue;
      counts[tab.id] = localActivities.filter((a) =>
        matchesExperienceType(a, tab.id),
      ).length;
    }
    return counts;
  }, [localActivities]);

  const typeCards = useMemo(() => {
    return experienceTypeTabs
      .filter((tab) => tab.id !== "all")
      .map((tab) => ({
        ...tab,
        count: filterCounts[tab.id] ?? 0,
        stopCount: nearbyStops.filter(
          (s) =>
            "experienceTypes" in s &&
            (s as { experienceTypes: ExperienceType[] }).experienceTypes.includes(
              tab.id,
            ),
        ).length ||
          (placeId && !usaSpots.length
            ? stopsNearPlace(placeId, tab.id).length
            : usaSpots.filter((s) => s.experienceTypes.includes(tab.id)).length),
      }))
      .filter((tab) => tab.count > 0 || tab.stopCount > 0);
  }, [filterCounts, placeId, usaSpots, nearbyStops]);

  // Soft live tick — only for seeded pulse, not Google snapshots
  useEffect(() => {
    if (usaActivities) return;
    const id = window.setInterval(() => {
      setActivities((current) => {
        const idx = Math.floor(Math.random() * current.length);
        const target = current[idx];
        setTickFlash(target.id);
        return current.map((a, i) => {
          if (i !== idx) {
            return { ...a, minutesAgo: a.minutesAgo + 1 };
          }
          return {
            ...a,
            minutesAgo: 0,
            travellers:
              a.travellers + (Math.random() > 0.45 && a.joinable ? 1 : 0),
          };
        });
      });
    }, 6800);
    return () => window.clearInterval(id);
  }, [usaActivities]);

  useEffect(() => {
    if (!tickFlash) return;
    const t = window.setTimeout(() => setTickFlash(null), 900);
    return () => window.clearTimeout(t);
  }, [tickFlash]);

  function selectZone(zoneId: PulseZoneId) {
    setSelectedZoneId(zoneId);
    const inZone = filtered.filter((a) => a.zoneId === zoneId);
    setSelectedActivityId(inZone[0]?.id ?? null);
    setSelectedStopId(null);
  }

  function selectActivity(activity: PulseActivity) {
    setSelectedZoneId(activity.zoneId);
    setSelectedActivityId(activity.id);
    setSelectedStopId(null);
  }

  async function loadNearby(payload: {
    curatedId?: string;
    placeId?: string;
    name?: string;
  }) {
    setNearbyLoading(true);
    setNearbyError(null);
    try {
      const res = await fetch("/api/places/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        stay?: UsaStay;
        useCorridor?: boolean;
        spots?: UsaNearbySpot[];
        activities?: PulseActivity[] | null;
      };
      if (!res.ok) {
        setNearbyError(data.error || "Could not load places near this stay.");
        return;
      }
      if (!data.stay) return;
      setUsaStay(data.stay);
      setUsaSpots(data.spots || []);
      setUsaActivities(data.activities || null);
      setUseCorridor(Boolean(data.useCorridor));
      setSelectedZoneId(data.stay.zoneId || "midtown");
      setSelectedStopId(null);
      setFilter("all");
      const first = (data.activities || [])[0];
      setSelectedActivityId(first?.id ?? null);
    } catch {
      setNearbyError("Network error loading nearby places.");
    } finally {
      setNearbyLoading(false);
    }
  }

  function chooseCurated(place: NearMePlace) {
    setPlaceId(place.id);
    setLocationQuery(place.name);
    setUsaStay(null);
    setUsaSpots([]);
    setUsaActivities(null);
    setUseCorridor(true);
    setSelectedZoneId(place.zoneId);
    setSelectedStopId(null);
    setFilter("all");
    const inZone = activities.filter((a) => a.zoneId === place.zoneId);
    setSelectedActivityId(inZone[0]?.id ?? null);
    void loadNearby({ curatedId: place.id });
  }

  function chooseSuggestion(item: Suggestion) {
    setLocationQuery(item.name);
    setSuggestions([]);
    if (item.source === "curated") {
      const place = getNearMePlace(item.id);
      if (place) chooseCurated(place);
      return;
    }
    if (item.placeId) {
      setPlaceId(null);
      void loadNearby({ placeId: item.placeId, name: item.name });
    }
  }

  function clearPlace() {
    setPlaceId(null);
    setLocationQuery("");
    setSelectedStopId(null);
    setFilter("all");
    setSelectedZoneId(null);
    setSelectedActivityId(null);
    setUsaStay(null);
    setUsaSpots([]);
    setUsaActivities(null);
    setUseCorridor(true);
    setNearbyError(null);
  }

  const spotlight = useMemo(() => {
    if (selectedZoneId) {
      const inZone = filtered.filter((a) => a.zoneId === selectedZoneId);
      return {
        zone: pulseZones.find((z) => z.id === selectedZoneId) || null,
        activity: selectedActivity?.zoneId === selectedZoneId
          ? selectedActivity
          : inZone[0] || null,
        count: inZone.length,
      };
    }
    if (nextUp) {
      return {
        zone: pulseZones.find((z) => z.id === nextUp.zoneId) || null,
        activity: nextUp,
        count: filtered.filter((a) => a.zoneId === nextUp.zoneId).length,
      };
    }
    return { zone: null, activity: null, count: 0 };
  }, [selectedZoneId, selectedActivity, filtered, nextUp]);

  return (
    <section
      id={embedded ? undefined : "pulse"}
      className={
        embedded
          ? "overflow-x-hidden text-white"
          : "scroll-mt-0 overflow-x-hidden border-b border-ink/10 bg-ink text-white"
      }
    >
      <div
        className={
          embedded
            ? "w-full"
            : "mx-auto w-full max-w-[90rem] px-5 py-10 sm:px-8 sm:py-12 md:py-14"
        }
      >
        {!embedded ? (
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber">
              Near you · New York
            </p>
            <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl">
              Start with where you’re staying
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">
              Enter your hotel — then pick what’s around you: bus tours,
              museums, pizza, Chinese food, and more on the corridor map.
            </p>
          </div>
        ) : (
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-white/55">
            {hasStay
              ? `Staying · ${usaStay?.name || nearPlace?.name} · ${filtered.length} nearby`
              : usaEnabled
                ? "Step 1 · any hotel in the USA"
                : "Step 1 · enter where you’re staying"}
          </p>
        )}

        <div className="mt-4 border border-amber/30 bg-amber/5 p-4 sm:mt-5 sm:p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
            1 · Where are you staying?
          </p>
          <label className="mt-2 block">
            <span className="sr-only">Hotel or stay</span>
            <input
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                if (hasStay) clearPlace();
              }}
              placeholder={
                usaEnabled
                  ? "Any US hotel — Miami, Chicago, Vegas, Aliz NYC…"
                  : "e.g. Aliz Hotel Times Square…"
              }
              className="w-full border border-white/15 bg-ink/70 px-3 py-3 text-base text-white outline-none placeholder:text-white/35 focus:border-amber/50"
              autoComplete="off"
            />
          </label>
          {!hasStay && suggestions.length > 0 ? (
            <ul className="mt-2 border border-white/10 bg-[#0a1520]">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => chooseSuggestion(item)}
                    className="flex w-full flex-col px-3 py-2.5 text-left hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      {item.name}
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                        {item.source === "google" ? "USA" : "NYC"}
                      </span>
                    </span>
                    <span className="text-xs text-white/50">{item.subtitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {hasStay ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="border border-amber/40 bg-amber/15 px-2.5 py-1 text-xs font-semibold text-amber">
                Staying · {usaStay?.name || nearPlace?.name}
                {usaStay?.metro ? ` · ${usaStay.metro}` : ""}
              </span>
              <button
                type="button"
                onClick={clearPlace}
                className="text-xs font-semibold text-white/55 underline-offset-2 hover:text-white hover:underline"
              >
                Change stay
              </button>
              {nearbyLoading ? (
                <span className="text-xs text-white/45">Finding what’s around you…</span>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/45">
              {usaEnabled
                ? "USA-wide hotel search is on. Pick a stay to see bus tours, museums, pizza, Chinese food, and more nearby."
                : "Curated NYC stays work now. Add GOOGLE_PLACES_API_KEY on Vercel to unlock hotels across the USA."}
            </p>
          )}
          {nearbyError ? (
            <p className="mt-2 text-xs text-amber-deep">{nearbyError}</p>
          ) : null}
        </div>

        {hasStay ? (
          <div className="mt-4 border border-white/10 bg-white/[0.03] p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
              2 · What’s around you?
            </p>
            <p className="mt-1 text-sm text-white/55">
              Tap a type — the map and list update for this stay.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`border px-3 py-3 text-left transition ${
                  filter === "all"
                    ? "border-amber bg-amber text-ink"
                    : "border-white/15 text-white hover:border-white/35"
                }`}
              >
                <span className="block text-sm font-semibold">All nearby</span>
                <span className="mt-0.5 block text-xs opacity-70">
                  {localActivities.length} activities
                </span>
              </button>
              {typeCards.map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`border px-3 py-3 text-left transition ${
                      active
                        ? "border-amber bg-amber text-ink"
                        : "border-white/15 text-white hover:border-white/35"
                    }`}
                  >
                    <span
                      className="mb-1.5 block h-1.5 w-6"
                      style={{
                        background: active
                          ? "#0c1b2a"
                          : experienceTypeColor[tab.id],
                      }}
                      aria-hidden
                    />
                    <span className="block text-sm font-semibold">
                      {tab.label}
                    </span>
                    <span className="mt-0.5 block text-xs opacity-70">
                      {tab.count} live
                      {tab.stopCount ? ` · ${tab.stopCount} spots` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {hasStay ? (
        <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          {/* Live list — below map on mobile, left column on desktop */}
          <div className="order-2 min-w-0 border border-white/10 bg-white/[0.03] lg:order-1">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Live listing
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                {filtered.length} shown
              </p>
            </div>
            <ul className="divide-y divide-white/10 lg:max-h-[34rem] lg:overflow-y-auto lg:overscroll-contain">
              {filtered.map((activity) => {
                const zone = pulseZones.find((z) => z.id === activity.zoneId);
                const selected = selectedActivityId === activity.id;
                const flashed = tickFlash === activity.id;
                return (
                  <li key={activity.id}>
                    <button
                      type="button"
                      onClick={() => selectActivity(activity)}
                      className={`flex w-full gap-3 px-4 py-3.5 text-left transition active:bg-white/10 ${
                        selected
                          ? "bg-amber/15"
                          : flashed
                            ? "bg-white/10"
                            : "hover:bg-white/[0.06]"
                      }`}
                    >
                      <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background: pulseCategoryColor[activity.category],
                          boxShadow: `0 0 10px ${pulseCategoryColor[activity.category]}88`,
                        }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber">
                            {zone?.shortLabel}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                            {pulseStatusLabel[activity.status]}
                          </span>
                        </span>
                        <span className="mt-0.5 block font-semibold text-white [overflow-wrap:anywhere]">
                          {activity.title}
                        </span>
                        <span className="mt-0.5 block text-sm text-white/55 [overflow-wrap:anywhere]">
                          {activity.detail}
                          {activity.joinable ? " · open to join" : ""}
                          {" · "}
                          {activity.travellers} travellers
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-white/35">
                        {activity.minutesAgo === 0
                          ? "now"
                          : `${activity.minutesAgo}m`}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-white/50">
                  No signals for this filter. Try All or Tours.
                </li>
              ) : null}
            </ul>
          </div>

          {/* Corridor map — first on mobile */}
          <div className="order-1 min-w-0 space-y-4 overflow-visible lg:order-2">
            <div className="overflow-visible border border-white/10 bg-[#0a1520]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  Corridor map
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                  {filtered.length} of {activities.length} · by zone
                </p>
              </div>

              {/* Swipe filters — experience types around your stay */}
              <div className="border-b border-white/10 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                  3 · Corridor map · swipe filters →
                </p>
                <div className="mt-2 flex gap-4 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden">
                  {experienceTypeTabs.map((tab) => {
                    const active = filter === tab.id;
                    const count = filterCounts[tab.id] ?? 0;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilter(tab.id)}
                        className={`shrink-0 border-b-2 pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                          active
                            ? "border-amber text-amber"
                            : "border-transparent text-white/45 hover:text-white/80"
                        }`}
                      >
                        {tab.label}
                        <span className="ml-1 opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tap a pulse → info card (like fuel stop detail) */}
              {spotlight.zone && spotlight.activity ? (
                <div className="flex gap-3 border-b border-white/10 px-4 py-3">
                  <span className="w-1 shrink-0 bg-amber" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber">
                      {selectedZoneId ? "Selected" : "Next up"} ·{" "}
                      {spotlight.zone.shortLabel}
                      {spotlight.count > 1 ? ` · ${spotlight.count} signals` : ""}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white [overflow-wrap:anywhere]">
                      <span className="uppercase tracking-wide text-white/50">
                        {spotlight.activity.category}{" "}
                      </span>
                      {spotlight.activity.title}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50 [overflow-wrap:anywhere]">
                      {pulseStatusLabel[spotlight.activity.status]} ·{" "}
                      {spotlight.activity.detail}
                      {spotlight.activity.joinable ? " · open to join" : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={activityHref(spotlight.activity, today)}
                        className="bg-amber px-3 py-1.5 text-xs font-semibold text-ink hover:bg-amber-deep"
                      >
                        {spotlight.activity.joinable
                          ? "View / join"
                          : "View details"}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("pulse-zone-detail");
                          el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }}
                        className="border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                      >
                        More in this zone
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-sm text-white/50">
                    Tap a glowing circle on the corridor for zone details.
                  </p>
                </div>
              )}

              {useCorridor ? (
                <CorridorMap
                  filter={filter}
                  activities={filtered}
                  selectedZoneId={selectedZoneId}
                  onSelectZone={selectZone}
                  youAreHere={
                    usaStay?.t != null
                      ? {
                          id: usaStay.id,
                          name: usaStay.name,
                          aliases: [],
                          zoneId: usaStay.zoneId || "midtown",
                          t: usaStay.t,
                          blurb: usaStay.address,
                        }
                      : nearPlace
                  }
                  boardingStops={nearbyStops.map((stop) => ({
                    id: stop.id,
                    name: stop.name,
                    kind:
                      "kind" in stop && typeof stop.kind === "string"
                        ? (stop.kind as BoardingStop["kind"])
                        : "walking_meetup",
                    experienceTypes:
                      "experienceTypes" in stop
                        ? stop.experienceTypes
                        : (["all"] as ExperienceType[]),
                    zoneId: stop.zoneId,
                    t: stop.t,
                    addressHint: stop.addressHint,
                    howToBoard: stop.howToBoard,
                    walkFrom: {},
                    walkMinutes: stop.walkMinutes,
                    operatorsHint:
                      "operatorsHint" in stop ? stop.operatorsHint : undefined,
                  }))}
                  selectedStopId={selectedStopId}
                  onSelectStop={(stop) => {
                    setSelectedStopId(stop.id);
                    setSelectedZoneId(stop.zoneId);
                    setSelectedActivityId(null);
                  }}
                />
              ) : usaStay ? (
                <UsaRadialMap
                  stayName={usaStay.name}
                  stayLat={usaStay.lat}
                  stayLng={usaStay.lng}
                  metro={usaStay.metro}
                  spots={nearbyStops
                    .filter(
                      (s): s is UsaNearbySpot =>
                        "lat" in s && typeof s.lat === "number",
                    )
                    .map((s) => ({
                      id: s.id,
                      name: s.name,
                      walkMinutes: s.walkMinutes,
                      lat: s.lat,
                      lng: s.lng,
                    }))}
                  selectedId={selectedStopId}
                  onSelect={(id) => {
                    const stop = usaSpots.find((s) => s.id === id);
                    if (!stop) return;
                    setSelectedStopId(stop.id);
                    setSelectedZoneId(stop.zoneId);
                    setSelectedActivityId(null);
                  }}
                />
              ) : null}

              <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 px-4 py-3">
                {(
                  Object.entries(pulseCategoryColor) as [PulseCategory, string][]
                ).map(([cat, color]) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/50"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: color }}
                      aria-hidden
                    />
                    {cat === "bus" ? "bus tours" : cat}
                  </span>
                ))}
                {hasStay ? (
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber">
                    <span className="h-2 w-2 rotate-45 bg-amber" aria-hidden />
                    you are here
                  </span>
                ) : null}
              </div>
            </div>

            {hasStay && nearbyStops.length > 0 ? (
              <div className="border border-amber/25 bg-amber/5 p-4">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-amber">
                  Spots near your stay
                  {filter !== "all"
                    ? ` · ${experienceTypeTabs.find((t) => t.id === filter)?.label}`
                    : ""}
                </p>
                <ul className="mt-3 space-y-2">
                  {nearbyStops.map((stop) => {
                    const selected = selectedStopId === stop.id;
                    const kindLabel =
                      boardingKindLabel[
                        stop.kind as keyof typeof boardingKindLabel
                      ] || String(stop.kind);
                    return (
                      <li key={stop.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStopId(stop.id);
                            setSelectedZoneId(stop.zoneId);
                            setSelectedActivityId(null);
                          }}
                          className={`w-full border px-3 py-3 text-left transition ${
                            selected
                              ? "border-amber/50 bg-amber/10"
                              : "border-white/10 bg-white/[0.03] hover:border-white/25"
                          }`}
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-white">
                              {stop.name}
                            </p>
                            <p className="font-mono text-[11px] text-amber">
                              ~{stop.walkMinutes} min walk
                            </p>
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-wider text-white/45">
                            {kindLabel}
                            {"operatorsHint" in stop && stop.operatorsHint
                              ? ` · ${stop.operatorsHint}`
                              : ""}
                          </p>
                          <p className="mt-1 text-sm text-white/60">
                            {stop.addressHint}
                          </p>
                          {selected ? (
                            <p className="mt-2 text-sm leading-relaxed text-white/75">
                              {stop.howToBoard}
                            </p>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={`/request?details=${encodeURIComponent(
                    `I am staying at ${usaStay?.name || nearPlace?.name}. Show me ${
                      filter === "all" ? "nearby tours and food" : filter
                    } and where to go.`,
                  )}`}
                  className="mt-3 inline-flex text-sm font-semibold text-amber underline-offset-2 hover:underline"
                >
                  Request help from this stay →
                </Link>
              </div>
            ) : null}

            {selectedZone ? (
              <div id="pulse-zone-detail">
                <ZonePanel
                  zone={selectedZone}
                  items={zoneItems}
                  allInZone={activities.filter(
                    (a) => a.zoneId === selectedZone.id,
                  )}
                  selectedActivity={selectedActivity}
                  today={today}
                  onSelectActivity={selectActivity}
                />
              </div>
            ) : null}
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}

function CorridorMap({
  filter,
  activities,
  selectedZoneId,
  onSelectZone,
  youAreHere,
  boardingStops,
  selectedStopId,
  onSelectStop,
}: {
  filter: FilterId;
  activities: PulseActivity[];
  selectedZoneId: PulseZoneId | null;
  onSelectZone: (id: PulseZoneId) => void;
  youAreHere?: NearMePlace | null;
  boardingStops?: Array<BoardingStop & { walkMinutes: number }>;
  selectedStopId?: string | null;
  onSelectStop?: (stop: BoardingStop & { walkMinutes: number }) => void;
}) {
  return (
    <div className="relative overflow-visible touch-manipulation px-2 py-3 sm:px-4 sm:py-4">
      <svg
        viewBox="-24 -28 448 576"
        className="mx-auto h-auto w-full max-w-md overflow-visible select-none"
        role="img"
        aria-label="New York tour corridor from harbor to airports"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="corridorGlow" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#5b9bd5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7dd3c0" stopOpacity="0.3" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Atmosphere */}
        <rect width="400" height="520" fill="#0a1520" />
        <circle cx="320" cy="80" r="90" fill="#1f4e79" opacity="0.12" />
        <circle cx="80" cy="420" r="70" fill="#d4a017" opacity="0.08" />

        {/* Corridor path */}
        <path
          d={CORRIDOR_D}
          fill="none"
          stroke="url(#corridorGlow)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d={CORRIDOR_D}
          fill="none"
          stroke="#d4a017"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="7 9"
          className="corridor-dash"
        />

        {/* End labels */}
        <text
          x="36"
          y="498"
          fill="#d4a017"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
        >
          HARBOR
        </text>
        <text
          x="300"
          y="28"
          fill="#7dd3c0"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
        >
          AIRPORTS
        </text>

        {(boardingStops || []).map((stop) => {
          const pt = pointOnCorridor(stop.t);
          const selected = selectedStopId === stop.id;
          const color =
            stop.kind === "hop_on_bus"
              ? pulseCategoryColor.bus
              : stop.kind === "hotel_pickup"
                ? pulseCategoryColor.pickup
                : stop.kind === "cruise_terminal"
                  ? pulseCategoryColor.cruise
                  : stop.kind === "food_spot"
                    ? pulseCategoryColor.food
                    : stop.kind === "museum_spot"
                      ? pulseCategoryColor.museum
                      : pulseCategoryColor.tour;
          return (
            <g
              key={stop.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer"
              onClick={() => onSelectStop?.(stop)}
            >
              <circle r="14" fill="transparent" />
              <rect
                x="-5"
                y="-5"
                width="10"
                height="10"
                fill={color}
                opacity={selected ? 1 : 0.85}
                stroke={selected ? "#fff" : "none"}
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {youAreHere ? (
          <g
            transform={`translate(${pointOnCorridor(youAreHere.t).x}, ${pointOnCorridor(youAreHere.t).y})`}
          >
            <circle
              r="18"
              fill="#d4a017"
              opacity="0.15"
              className="pulse-ring"
            />
            <rect
              x="-6"
              y="-6"
              width="12"
              height="12"
              fill="#d4a017"
              transform="rotate(45)"
              stroke="#0a1520"
              strokeWidth="2"
            />
            <text
              y="22"
              textAnchor="middle"
              fill="#d4a017"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              fontWeight="700"
            >
              YOU
            </text>
          </g>
        ) : null}

        {pulseZones.map((zone) => {
          const pt = pointOnCorridor(zone.t);
          const inFilter = activities.filter((a) => a.zoneId === zone.id);
          const stats = zoneActivityStats(
            // Use filtered list already passed as activities
            activities,
            zone.id,
          );
          const dimmed = filter !== "all" && inFilter.length === 0;
          const selected = selectedZoneId === zone.id;
          const color =
            pulseCategoryColor[
              inFilter.length > 0 ? dominantCategory(inFilter) : "tour"
            ];
          const size = 6 + Math.min(stats.total, 5) * 2.2;

          return (
            <g
              key={zone.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              opacity={dimmed ? 0.28 : 1}
              className="cursor-pointer"
              onClick={() => onSelectZone(zone.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectZone(zone.id);
                }
              }}
            >
              {/* Larger invisible hit area for mobile taps */}
              <circle r={Math.max(size + 16, 22)} fill="transparent" />
              {!dimmed && stats.total > 0 ? (
                <>
                  <circle
                    r={size + 14}
                    fill={color}
                    opacity="0.12"
                    className="pulse-ring pointer-events-none"
                  />
                  <circle
                    r={size + 7}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.55"
                    className="pulse-ring-delay pointer-events-none"
                  />
                </>
              ) : null}
              <circle
                r={selected ? size + 3 : size}
                fill={color}
                stroke={selected ? "#fffdf8" : "rgba(255,255,255,0.35)"}
                strokeWidth={selected ? 3 : 1.5}
                filter="url(#softGlow)"
                className="pointer-events-none"
              />
              {stats.total > 0 ? (
                <text
                  y={1.5}
                  textAnchor="middle"
                  fill="#0c1b2a"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="ui-monospace, monospace"
                  className="pointer-events-none"
                >
                  {stats.total}
                </text>
              ) : null}
              <text
                y={size + 16}
                textAnchor="middle"
                fill={selected ? "#d4a017" : "rgba(255,253,248,0.65)"}
                fontSize="9"
                fontFamily="ui-monospace, monospace"
                fontWeight="600"
                className="pointer-events-none"
              >
                {zone.shortLabel.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ZonePanel({
  zone,
  items,
  allInZone,
  selectedActivity,
  today,
  onSelectActivity,
}: {
  zone: PulseZone;
  items: PulseActivity[];
  allInZone: PulseActivity[];
  selectedActivity: PulseActivity | null;
  today: string;
  onSelectActivity: (a: PulseActivity) => void;
}) {
  const stats = zoneActivityStats(allInZone, zone.id);
  const focus = selectedActivity?.zoneId === zone.id ? selectedActivity : null;

  return (
    <div className="border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
        Zone detail
      </p>
      <h3 className="mt-1 font-display text-2xl text-white">{zone.label}</h3>
      <p className="mt-1 text-sm text-white/60">{zone.blurb}</p>

      <div className="mt-4 flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-wider text-white/55">
        <span>{stats.active} active</span>
        <span className="text-white/25">·</span>
        <span>{stats.forming} forming</span>
        <span className="text-white/25">·</span>
        <span>{stats.joinable} joinable</span>
        <span className="text-white/25">·</span>
        <span>{stats.travellers} travellers</span>
      </div>

      {focus ? (
        <div className="mt-4 border border-amber/30 bg-amber/10 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-amber">
            Selected · {pulseStatusLabel[focus.status]}
          </p>
          <p className="mt-1 font-semibold text-white">{focus.title}</p>
          <p className="mt-1 text-sm text-white/65">{focus.detail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={activityHref(focus, today)}
              className="bg-amber px-3 py-2 text-xs font-semibold text-ink hover:bg-amber-deep"
            >
              {focus.joinable ? "View / join" : "View details"} →
            </Link>
            <Link
              href={`/request?date=${today}`}
              className="border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              Request similar
            </Link>
          </div>
        </div>
      ) : null}

      <ul className="mt-4 space-y-2 lg:max-h-48 lg:overflow-y-auto lg:overscroll-contain">
        {(items.length ? items : allInZone).slice(0, 8).map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelectActivity(item)}
              className={`flex w-full items-start justify-between gap-3 border px-3 py-2 text-left text-sm transition ${
                focus?.id === item.id
                  ? "border-amber/40 bg-amber/10"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              <span>
                <span className="block font-medium text-white">{item.title}</span>
                <span className="text-xs text-white/50">
                  {pulseStatusLabel[item.status]} · {item.travellers} travellers
                </span>
              </span>
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ background: pulseCategoryColor[item.category] }}
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/tours"
          className="text-xs font-semibold text-amber underline-offset-2 hover:underline"
        >
          Browse tours in this city →
        </Link>
        <Link
          href="/events"
          className="text-xs font-semibold text-white/60 underline-offset-2 hover:underline hover:text-white"
        >
          Events this week
        </Link>
      </div>
    </div>
  );
}
