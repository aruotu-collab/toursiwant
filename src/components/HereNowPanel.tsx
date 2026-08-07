"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TemplateRouteLoop } from "@/components/TemplateRouteLoop";
import {
  hereNowHotels,
  moodOptions,
  timeBucketOptions,
  type TripTemplate,
} from "@/lib/trip-templates";
import type { HereNowMatch } from "@/lib/here-now";

type StaySuggestion = {
  id: string;
  name: string;
  subtitle: string;
  source: "curated" | "google";
  placeId?: string;
};

type ResolveBody = {
  curatedId?: string;
  nearMePlaceId?: string;
  placeId?: string;
  name?: string;
};

type StoredHereNow = {
  query: string;
  selectedLabel: string;
  timeBucket: string;
  mood: string;
  resolve: ResolveBody;
};

const HERE_NOW_STORAGE_KEY = "tiw_here_now_v1";

function saveHereNowSession(data: StoredHereNow) {
  try {
    sessionStorage.setItem(HERE_NOW_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // private mode / quota
  }
}

function loadHereNowSession(): StoredHereNow | null {
  try {
    const raw = sessionStorage.getItem(HERE_NOW_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredHereNow;
  } catch {
    return null;
  }
}

function clearHereNowSession() {
  try {
    sessionStorage.removeItem(HERE_NOW_STORAGE_KEY);
  } catch {
    // ignore
  }
}

const scaleLabel: Record<TripTemplate["scale"], string> = {
  multi_city: "Multi-city",
  country: "USA route",
  city: "City",
  hotel_area: "Hotel area",
  here_now: "I'm here now",
};

function PlanCard({
  t,
  stayName,
}: {
  t: TripTemplate;
  stayName?: string;
}) {
  const params = new URLSearchParams({ from: "here" });
  if (stayName) params.set("stay", stayName);
  return (
    <Link
      href={`/trips/${t.slug}?${params.toString()}`}
      className="group block overflow-hidden border border-white/15 bg-white/[0.04] transition hover:border-amber/50 hover:bg-white/[0.07]"
    >
      <TemplateRouteLoop template={t} className="h-[148px] w-full" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
            {scaleLabel[t.scale]} ·{" "}
            {t.days === 1 ? "Same day" : `${t.days} days`}
          </p>
          {t.travelledRating ? (
            <p className="font-mono text-[10px] text-white/55">
              ★ {t.travelledRating}
            </p>
          ) : null}
        </div>
        <h3 className="mt-3 font-display text-2xl tracking-tight text-white transition group-hover:text-amber">
          {t.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{t.blurb}</p>
        <p className="mt-4 font-mono text-[11px] text-amber opacity-0 transition group-hover:opacity-100">
          Open plan →
        </p>
      </div>
    </Link>
  );
}

export function HereNowPanel() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StaySuggestion[]>([]);
  const [placesEnabled, setPlacesEnabled] = useState<boolean | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [match, setMatch] = useState<HereNowMatch | null>(null);
  const [timeBucket, setTimeBucket] = useState("rest_today");
  const [mood, setMood] = useState("famous");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const lastResolveRef = useRef<ResolveBody | null>(null);
  const skipFilterOnceRef = useRef(true);

  useEffect(() => {
    fetch("/api/places/status")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => setPlacesEnabled(Boolean(d.enabled)))
      .catch(() => setPlacesEnabled(false));
  }, []);

  // Restore stay after navigating to a plan and back
  useEffect(() => {
    const stored = loadHereNowSession();
    if (!stored?.selectedLabel || !stored.resolve) {
      setHydrated(true);
      return;
    }
    setQuery(stored.query || stored.selectedLabel);
    setSelectedLabel(stored.selectedLabel);
    setTimeBucket(stored.timeBucket || "rest_today");
    setMood(stored.mood || "famous");
    lastResolveRef.current = stored.resolve;
    skipFilterOnceRef.current = true;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/here-now/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...stored.resolve,
            timeBucket: stored.timeBucket || "rest_today",
            mood: stored.mood || "famous",
          }),
        });
        const data = (await res.json()) as {
          match?: HereNowMatch;
          error?: string;
          enabled?: boolean;
        };
        if (typeof data.enabled === "boolean") setPlacesEnabled(data.enabled);
        if (!res.ok || !data.match) {
          throw new Error(data.error || "Could not restore your stay.");
        }
        setMatch(data.match);
        setSelectedLabel(data.match.stay.name);
        setQuery(data.match.stay.name);
        setSuggestions([]);
      } catch (e) {
        setMatch(null);
        setError(
          e instanceof Error ? e.message : "Could not restore your stay.",
        );
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (selectedLabel) {
      setSuggestions([]);
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      fetch(
        `/api/places/autocomplete?q=${encodeURIComponent(q)}&lodging=1`,
      )
        .then((r) => r.json())
        .then((d: { places?: StaySuggestion[]; enabled?: boolean }) => {
          setSuggestions(d.places || []);
          if (typeof d.enabled === "boolean") setPlacesEnabled(d.enabled);
        })
        .catch(() => setSuggestions([]));
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query, selectedLabel, hydrated]);

  async function resolveStay(body: ResolveBody) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/here-now/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          timeBucket,
          mood,
        }),
      });
      const data = (await res.json()) as {
        match?: HereNowMatch;
        error?: string;
        enabled?: boolean;
      };
      if (typeof data.enabled === "boolean") setPlacesEnabled(data.enabled);
      if (!res.ok || !data.match) {
        throw new Error(data.error || "Could not resolve that stay.");
      }
      const stay = data.match.stay;
      const persistResolve: ResolveBody =
        stay.source === "curated"
          ? { curatedId: stay.id, name: stay.name }
          : {
              placeId: stay.id.replace(/^google:/, ""),
              name: stay.name,
            };
      // Prefer original near-me / google pick when available
      if (body.nearMePlaceId) {
        persistResolve.nearMePlaceId = body.nearMePlaceId;
        persistResolve.name = stay.name;
        delete persistResolve.curatedId;
      } else if (body.placeId) {
        persistResolve.placeId = body.placeId;
        persistResolve.name = stay.name;
        delete persistResolve.curatedId;
      }
      lastResolveRef.current = persistResolve;
      setMatch(data.match);
      setSelectedLabel(stay.name);
      setQuery(stay.name);
      setSuggestions([]);
      saveHereNowSession({
        query: stay.name,
        selectedLabel: stay.name,
        timeBucket,
        mood,
        resolve: persistResolve,
      });
    } catch (e) {
      setMatch(null);
      setError(e instanceof Error ? e.message : "Could not resolve that stay.");
    } finally {
      setLoading(false);
    }
  }

  // Re-filter when time/mood change and we already have a stay
  useEffect(() => {
    if (!hydrated || !match?.stay) return;
    if (skipFilterOnceRef.current) {
      skipFilterOnceRef.current = false;
      return;
    }
    const stay = match.stay;
    const resolve =
      lastResolveRef.current ||
      (stay.source === "curated"
        ? { curatedId: stay.id, name: stay.name }
        : {
            placeId: stay.id.replace(/^google:/, ""),
            name: stay.name,
          });
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/here-now/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...resolve, timeBucket, mood }),
        });
        const data = (await res.json()) as { match?: HereNowMatch };
        if (data.match) {
          setMatch(data.match);
          saveHereNowSession({
            query: data.match.stay.name,
            selectedLabel: data.match.stay.name,
            timeBucket,
            mood,
            resolve,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
    // intentionally only when filters change after a stay is set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeBucket, mood, hydrated]);

  function clearStay() {
    setSelectedLabel(null);
    setMatch(null);
    setQuery("");
    setError(null);
    setSuggestions([]);
    lastResolveRef.current = null;
    clearHereNowSession();
  }

  const plans = useMemo(() => match?.templates || [], [match]);

  return (
    <div className="mt-8 space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber">
          1 · Where are you staying?
        </p>
        <div className="relative mt-3">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedLabel) {
                setSelectedLabel(null);
                setMatch(null);
                lastResolveRef.current = null;
                clearHereNowSession();
              }
            }}
            placeholder="Hotel name or address in the USA"
            className="w-full border border-white/20 bg-black/30 px-4 py-3.5 text-base text-white outline-none placeholder:text-white/35 focus:border-amber"
            autoComplete="off"
          />
          {selectedLabel ? (
            <button
              type="button"
              onClick={clearStay}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-amber"
            >
              Change
            </button>
          ) : null}

          {!selectedLabel && suggestions.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto border border-white/15 bg-[#0a1520] shadow-xl">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.source === "curated") {
                        void resolveStay({
                          nearMePlaceId: item.id,
                          name: item.name,
                        });
                        return;
                      }
                      if (!item.placeId) return;
                      void resolveStay({
                        placeId: item.placeId,
                        name: item.name,
                      });
                    }}
                    className="flex w-full flex-col px-4 py-3 text-left hover:bg-white/5"
                  >
                    <span className="text-sm font-semibold text-white">
                      {item.name}
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-white/35">
                        {item.source === "google" ? "Google" : "Suggested"}
                      </span>
                    </span>
                    <span className="mt-0.5 text-xs text-white/50">
                      {item.subtitle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-white/45">
          {placesEnabled
            ? "Search any US hotel — Google autocomplete is on."
            : placesEnabled === false
              ? "Google hotel search isn’t configured yet — use a featured stay below."
              : "Checking hotel search…"}
        </p>
        {error ? <p className="mt-2 text-sm text-amber">{error}</p> : null}
        {loading ? (
          <p className="mt-2 text-sm text-white/50">Finding plans near you…</p>
        ) : null}
      </div>

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
          Or pick a featured stay
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {hereNowHotels.map((h) => {
            const on =
              match?.matchedHotelId === h.id && match.stay.source === "curated";
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => void resolveStay({ curatedId: h.id })}
                className={`border px-4 py-4 text-left transition ${
                  on
                    ? "border-amber bg-amber/15"
                    : "border-white/15 hover:border-white/30"
                }`}
              >
                <p className="font-display text-lg">{h.name}</p>
                <p className="mt-1 text-sm text-white/55">{h.area}</p>
              </button>
            );
          })}
        </div>
      </div>

      {match ? (
        <>
          <div className="border border-amber/30 bg-amber/10 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
              Staying at
            </p>
            <p className="mt-1 font-display text-xl text-white">
              {match.stay.name}
            </p>
            <p className="mt-1 text-sm text-white/60">{match.stay.address}</p>
            <p className="mt-2 text-sm text-white/75">{match.message}</p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber">
              2 · How much time?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {timeBucketOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTimeBucket(opt.id)}
                  className={`border px-3 py-2 text-sm transition ${
                    timeBucket === opt.id
                      ? "border-amber bg-amber text-ink"
                      : "border-white/20 text-white/70"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber">
              3 · Mood
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {moodOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMood(opt.id)}
                  className={`border px-3 py-2 text-sm transition ${
                    mood === opt.id
                      ? "border-amber bg-amber text-ink"
                      : "border-white/20 text-white/70"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber">
              4 · Ready plans for you
            </p>
            <p className="mt-2 text-sm text-white/50">
              {plans.length} plan{plans.length === 1 ? "" : "s"} near{" "}
              {match.stay.name}
              {match.stay.metro ? ` · ${match.stay.metro}` : ""}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {plans.length ? (
                plans.map((t) => (
                  <PlanCard key={t.id} t={t} stayName={match.stay.name} />
                ))
              ) : (
                <p className="text-white/55">
                  No plans for this time and mood — try another combination.
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/55">
          Search your hotel or tap a featured stay — then we&apos;ll ask how much
          time you have and what mood you&apos;re in.
        </p>
      )}
    </div>
  );
}
