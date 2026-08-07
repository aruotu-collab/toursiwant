"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usCityOptions } from "@/lib/trip-templates";

type OpenTrip = {
  id: string;
  shareCode: string;
  templateSlug: string;
  templateTitle: string;
  route?: string;
  region?: string;
  cityCodes?: string[];
  hotelName?: string;
  joinNote?: string;
  createdAt: string;
  travellerCount: number;
  travellerNames: string[];
  wants?: string[];
};

export function LiveTripsPanel() {
  const [trips, setTrips] = useState<OpenTrip[]>([]);
  const [city, setCity] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const q =
      city === "all"
        ? "/api/trip-sessions?open=1"
        : `/api/trip-sessions?open=1&city=${encodeURIComponent(city)}`;
    fetch(q)
      .then((r) => r.json())
      .then((d: { sessions?: OpenTrip[]; error?: string }) => {
        if (cancelled) return;
        if (d.error) setError(d.error);
        setTrips(d.sessions || []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load live trips.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  const cityFilters = useMemo(() => {
    const present = new Set<string>();
    for (const t of trips) {
      for (const c of t.cityCodes || []) present.add(c);
    }
    return usCityOptions.filter((c) => present.has(c.code));
  }, [trips]);

  return (
    <div className="mt-8">
      <div className="border border-amber/30 bg-amber/10 px-4 py-4 text-sm text-white/80">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
          How this works
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>See groups already on a proven template (e.g. NYC / Times Square).</li>
          <li>Join their trip room with your name.</li>
          <li>
            Keep the spine — then personalize flexible days or vote with the
            group.
          </li>
        </ol>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCity("all")}
          className={`border px-3 py-2 text-sm ${
            city === "all"
              ? "border-amber bg-amber text-ink"
              : "border-white/20 text-white/70"
          }`}
        >
          All cities
        </button>
        {(cityFilters.length ? cityFilters : usCityOptions.slice(0, 8)).map(
          (c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCity(c.code)}
              className={`border px-3 py-2 text-sm ${
                city === c.code
                  ? "border-amber bg-amber text-ink"
                  : "border-white/20 text-white/70"
              }`}
            >
              <span className="font-mono">{c.code}</span>
              <span className="ml-1.5 opacity-80">{c.label}</span>
            </button>
          ),
        )}
      </div>

      {loading ? (
        <p className="mt-8 text-white/50">Loading live trips…</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-amber">{error}</p> : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {trips.map((trip) => (
          <article
            key={trip.id}
            className="border border-white/15 bg-white/[0.04] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
                {trip.region || "USA"} · {trip.travellerCount} traveller
                {trip.travellerCount === 1 ? "" : "s"}
              </p>
              {(trip.cityCodes || []).length ? (
                <p className="font-mono text-[10px] text-white/40">
                  {(trip.cityCodes || []).join(" · ")}
                </p>
              ) : null}
            </div>
            <h3 className="mt-3 font-display text-2xl text-white">
              {trip.templateTitle}
            </h3>
            {trip.route ? (
              <p className="mt-2 text-sm text-white/65">{trip.route}</p>
            ) : null}
            {trip.joinNote ? (
              <p className="mt-3 text-sm text-white/80">{trip.joinNote}</p>
            ) : (
              <p className="mt-3 text-sm text-white/55">
                Open group on this template — join and personalize flexible days.
              </p>
            )}
            {trip.hotelName ? (
              <p className="mt-2 text-xs text-white/45">
                Hotel area: {trip.hotelName}
              </p>
            ) : null}
            {trip.travellerNames?.length ? (
              <p className="mt-3 text-xs text-white/45">
                Already in: {trip.travellerNames.slice(0, 5).join(", ")}
                {trip.travellerNames.length > 5 ? "…" : ""}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/trips/${trip.templateSlug}?share=${trip.shareCode}&join=1`}
                className="bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep"
              >
                Join this trip
              </Link>
              <Link
                href={`/trips/${trip.templateSlug}`}
                className="border border-white/25 px-4 py-2.5 text-sm text-white/70 hover:border-amber"
              >
                View template
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!loading && !trips.length ? (
        <p className="mt-8 text-white/55">
          No open groups right now. Open a template, create a share link, and
          turn on “List so others can join.”
        </p>
      ) : null}
    </div>
  );
}
