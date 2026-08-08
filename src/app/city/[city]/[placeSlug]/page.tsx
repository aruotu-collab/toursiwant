import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCityCatalog,
  getCityPlace,
  rankCityPlaces,
} from "@/lib/places/registry";
import { computeTiwScore } from "@/lib/tiw-score";

type Props = {
  params: Promise<{ city: string; placeSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, placeSlug } = await params;
  const place = getCityPlace(city, placeSlug);
  const catalog = getCityCatalog(city);
  if (!place || !catalog) return { title: "Place" };
  return {
    title: `${place.name} — ${catalog.name} Scorecard`,
    description: place.summary,
  };
}

export default async function CityPlacePage({ params }: Props) {
  const { city, placeSlug } = await params;
  const catalog = getCityCatalog(city);
  const place = getCityPlace(city, placeSlug);
  if (!catalog || !place || catalog.slug === "new-york") notFound();

  const board = rankCityPlaces(catalog.places, "overall");
  const ranked = board.find((p) => p.slug === place.slug);
  const score =
    ranked?.tiwScore ?? computeTiwScore(place.factors, "overall");
  const rank = ranked?.rank;

  return (
    <main className="max-w-[100vw] flex-1 overflow-x-clip bg-paper pt-[7.5rem] sm:pt-32">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-deep">
          <Link href="/scorecard" className="hover:text-ink">
            Scorecard
          </Link>
          <span className="mx-1.5 text-stone">/</span>
          <Link href={`/city/${catalog.slug}`} className="hover:text-ink">
            {catalog.name}
          </Link>
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink">{place.name}</h1>
        <p className="mt-2 text-ink-soft">{place.neighborhood}</p>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          {place.summary}
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-ink/10 bg-white p-3">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-stone">
              TIW Score
            </dt>
            <dd className="mt-1 font-display text-2xl text-ink">{score}</dd>
          </div>
          <div className="border border-ink/10 bg-white p-3">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-stone">
              Rank
            </dt>
            <dd className="mt-1 font-display text-2xl text-ink">
              {rank ? `#${rank}` : "—"}
            </dd>
          </div>
          <div className="border border-ink/10 bg-white p-3">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-stone">
              Time
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">
              {place.durationLabel}
            </dd>
          </div>
          <div className="border border-ink/10 bg-white p-3">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-stone">
              Cost
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">
              {place.typicalCostLabel}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-ink-soft">
          Best for: {place.bestFor.join(" · ")}
        </p>

        <Link
          href={`/city/${catalog.slug}`}
          className="mt-8 inline-flex bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
        >
          ← Back to {catalog.name} scorecard
        </Link>
      </div>
    </main>
  );
}
