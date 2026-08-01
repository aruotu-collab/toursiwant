"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listTourMetros } from "@/lib/sample-tours";
import { tourThemeDefs, type TourTheme } from "@/lib/tour-themes";

type Listing = {
  id: string;
  slug: string;
  title: string;
  cityName: string;
  stateCode: string;
  priceFrom: string;
  themes: string[];
  status: string;
  summary: string;
};

const publishThemes = tourThemeDefs.filter((t) => t.id !== "all");

export function OperatorListingsPanel() {
  const metros = listTourMetros();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [themes, setThemes] = useState<TourTheme[]>(["religious"]);
  const [citySlug, setCitySlug] = useState("new-york");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/listings?scope=mine");
      const data = (await res.json()) as { listings?: Listing[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load listings.");
      setListings(data.listings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleTheme(theme: TourTheme) {
    setThemes((current) =>
      current.includes(theme)
        ? current.filter((item) => item !== theme)
        : [...current, theme],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          citySlug,
          duration: data.get("duration"),
          meetup: data.get("meetup"),
          priceFrom: data.get("priceFrom"),
          summary: data.get("summary"),
          timeLabel: data.get("timeLabel") || "On request",
          themes,
          joinable: data.get("joinable") === "on",
          schedule: "flexible",
          status: "published",
        }),
      });
      const payload = (await res.json()) as {
        listing?: Listing;
        error?: string;
      };
      if (!res.ok) throw new Error(payload.error || "Publish failed.");
      setSuccess(
        `Published “${payload.listing?.title}”. Travellers can find it under Find tours → your themes.`,
      );
      form.reset();
      setThemes(["religious"]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(id: string, status: "published" | "archived") {
    setError(null);
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(payload.error || "Could not update listing.");
      return;
    }
    await load();
  }

  return (
    <section className="mt-12 space-y-8">
      <div className="border border-ink/10 bg-white/80 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-deep">
          Publish a tour
        </p>
        <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
          Add a religious tour (or any theme)
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Tag themes travellers search — Religious, Museum, Beach, etc. Published
          listings appear on Find tours worldwide.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Tour title
              </span>
              <input
                name="title"
                required
                placeholder="e.g. Patterson Bethel visitor tour"
                className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none focus:border-skyline"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                City
              </span>
              <select
                value={citySlug}
                onChange={(e) => setCitySlug(e.target.value)}
                className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none focus:border-skyline"
              >
                {metros.map((metro) => (
                  <option key={metro.slug} value={metro.slug}>
                    {metro.name}, {metro.stateCode}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Price from
              </span>
              <input
                name="priceFrom"
                required
                placeholder="$65 or Free / quote"
                className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none focus:border-skyline"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Duration
              </span>
              <input
                name="duration"
                required
                placeholder="3 hours / Half day"
                className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none focus:border-skyline"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Meetup point
              </span>
              <input
                name="meetup"
                required
                placeholder="Patterson Educational Center, NY"
                className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none focus:border-skyline"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Time label (optional)
              </span>
              <input
                name="timeLabel"
                placeholder="9:30 a.m. or On request"
                className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none focus:border-skyline"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Summary
              </span>
              <textarea
                name="summary"
                required
                rows={3}
                placeholder="What travellers get — searchable by theme, state, and keywords."
                className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none focus:border-skyline"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">
              Themes (select Religious for faith tours)
            </p>
            <div className="flex flex-wrap gap-2">
              {publishThemes.map((theme) => {
                const active = themes.includes(theme.id as TourTheme);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => toggleTheme(theme.id as TourTheme)}
                    className={`border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                      active
                        ? "border-amber bg-amber text-ink"
                        : "border-ink/15 text-ink-soft hover:border-ink/35"
                    }`}
                  >
                    {theme.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="joinable"
              defaultChecked
              className="mt-1"
            />
            <span>Travellers can join a shared group for this tour.</span>
          </label>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          {success ? <p className="text-sm text-skyline">{success}</p> : null}

          <button
            type="submit"
            disabled={submitting || themes.length === 0}
            className="bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60"
          >
            {submitting ? "Publishing…" : "Publish tour to Find tours"}
          </button>
        </form>
      </div>

      <div className="border border-ink/10 bg-white/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone">
              My listings
            </p>
            <h3 className="mt-1 font-display text-xl text-ink">
              {loading ? "Loading…" : `${listings.length} published / drafted`}
            </h3>
          </div>
          <Link
            href="/?menu=tours"
            className="text-sm font-semibold text-skyline hover:underline"
          >
            Preview Find tours →
          </Link>
        </div>

        <ul className="mt-4 divide-y divide-ink/10">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="flex flex-wrap items-start justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink">{listing.title}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {listing.cityName}, {listing.stateCode} · {listing.priceFrom} ·{" "}
                  {listing.themes.join(", ")} · {listing.status}
                </p>
                <Link
                  href={`/tours/${listing.slug}`}
                  className="mt-2 inline-flex text-sm font-semibold text-skyline hover:underline"
                >
                  Open public page
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {listing.status !== "published" ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(listing.id, "published")}
                    className="border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
                  >
                    Publish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setStatus(listing.id, "archived")}
                    className="border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
                  >
                    Archive
                  </button>
                )}
              </div>
            </li>
          ))}
          {!loading && listings.length === 0 ? (
            <li className="py-6 text-sm text-ink-soft">
              No listings yet — publish your first religious (or other) tour
              above.
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}
