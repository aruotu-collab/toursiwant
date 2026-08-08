import Link from "next/link";
import {
  affiliateGoPath,
  tripUpsellsForCity,
  type AffiliateProduct,
} from "@/lib/affiliate-products";
import { searchViatorProducts } from "@/lib/viator";

export async function PlaceViatorExperiences({
  placeName,
  viatorQuery,
}: {
  placeName: string;
  viatorQuery: string;
}) {
  const live = await searchViatorProducts({
    citySlug: "new-york",
    query: viatorQuery || placeName,
    count: 6,
  });

  const products: AffiliateProduct[] =
    live.products.length > 0
      ? live.products
      : tripUpsellsForCity("new-york")
          .filter(
            (p) => p.category === "experience" || p.category === "ticket",
          )
          .slice(0, 6);

  if (!products.length) return null;

  const source = live.source === "viator" ? "Viator live" : "partner picks";

  return (
    <section className="border border-ink/10 bg-white p-5 sm:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-deep">
        Best ways to experience it · {source}
      </p>
      <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
        Bookable experiences
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Ranked place first — then optional tours. Checkout happens on the
        partner site; ToursIWant may earn a commission.
      </p>
      <ul className="mt-6 space-y-3">
        {products.slice(0, 5).map((item, i) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-ink/10 bg-paper/50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone">
                {i === 0
                  ? "Best overall match"
                  : i === 1
                    ? "Also strong"
                    : "Option"}
              </p>
              <p className="mt-1 font-display text-lg text-ink">{item.title}</p>
              {item.priceFrom ? (
                <p className="mt-1 text-sm text-ink-soft">{item.priceFrom}</p>
              ) : null}
            </div>
            <Link
              href={affiliateGoPath(item)}
              className="shrink-0 bg-amber px-4 py-2 text-sm font-semibold text-ink hover:bg-amber-deep"
            >
              Check availability
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
