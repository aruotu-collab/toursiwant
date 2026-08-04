import Link from "next/link";
import {
  affiliateGoPath,
  tripUpsellsForCity,
  type AffiliateProduct,
} from "@/lib/affiliate-products";
import { searchViatorProducts } from "@/lib/viator";
import { TripUpsells } from "@/components/TripUpsells";

function keywordsFromTourTitle(title: string) {
  const stop = new Set([
    "the",
    "and",
    "with",
    "from",
    "tour",
    "tours",
    "private",
    "shared",
    "half",
    "day",
    "full",
    "express",
    "guided",
  ]);
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w))
    .slice(0, 4)
    .join(" ");
}

export async function TourRelatedViator({
  citySlug,
  cityName,
  title,
}: {
  citySlug: string;
  cityName: string;
  title: string;
}) {
  const query = keywordsFromTourTitle(title);
  const live = await searchViatorProducts({
    citySlug,
    query: query || cityName,
    count: 8,
  });

  const products: AffiliateProduct[] =
    live.products.length > 0
      ? live.products
      : tripUpsellsForCity(citySlug).filter(
          (p) => p.category === "experience" || p.category === "ticket",
        );

  if (!products.length) return null;

  const source = live.source === "viator" ? "viator" : "curated";

  return (
    <div className="border border-amber/30 bg-amber/[0.04] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-deep">
        Bookable now · {source === "viator" ? "Viator live" : "partners"}
      </p>
      <h3 className="mt-2 font-display text-2xl text-ink">
        Similar experiences near {cityName}
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        Instant bookable options for this city. You complete checkout on the
        partner site — ToursIWant may earn a commission. Prefer a custom
        operator quote? Use the request form on the right.
      </p>
      <ul className="mt-5 space-y-3">
        {products.slice(0, 6).map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-ink/10 bg-white/80 px-3 py-3"
          >
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-skyline">
                {item.partner} · {item.priceFrom}
              </p>
              <p className="font-semibold text-ink">{item.title}</p>
              <p className="text-sm text-ink-soft line-clamp-2">{item.summary}</p>
            </div>
            <Link
              href={affiliateGoPath(item)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="shrink-0 bg-amber px-3 py-2 text-xs font-semibold text-ink hover:bg-amber-deep"
            >
              Check availability →
            </Link>
          </li>
        ))}
      </ul>
      {source === "viator" ? (
        <p className="mt-3 text-xs text-ink-soft">
          Live inventory via Viator Partner API · {live.env}
        </p>
      ) : null}
    </div>
  );
}

/** Non-experience upsells (hotels, eSIM, cars) kept separate under about. */
export function TourTripCompleteUpsells({ citySlug }: { citySlug: string }) {
  const products = tripUpsellsForCity(citySlug).filter(
    (p) => p.category !== "experience" && p.category !== "ticket",
  );
  if (!products.length) {
    return (
      <TripUpsells
        products={tripUpsellsForCity(citySlug)}
        title="Hotels, data, cars & tickets nearby"
      />
    );
  }
  return (
    <TripUpsells
      products={products}
      title="Hotels, data & cars for this trip"
    />
  );
}
