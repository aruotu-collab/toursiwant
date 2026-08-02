import Link from "next/link";
import {
  affiliateGoPath,
  type AffiliateProduct,
} from "@/lib/affiliate-products";

export function TripUpsells({
  products,
  variant = "light",
  title = "Also useful for this trip",
}: {
  products: AffiliateProduct[];
  variant?: "light" | "dark";
  title?: string;
}) {
  if (!products.length) return null;

  const dark = variant === "dark";

  return (
    <div
      className={
        dark
          ? "border border-white/10 bg-white/[0.03] p-4 sm:p-5"
          : "border border-ink/10 bg-mist/40 p-4 sm:p-5"
      }
    >
      <p
        className={
          dark
            ? "font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber"
            : "text-xs font-semibold uppercase tracking-[0.16em] text-amber-deep"
        }
      >
        Complete the trip · affiliate partners
      </p>
      <h3
        className={
          dark
            ? "mt-2 font-display text-xl text-white"
            : "mt-2 font-display text-xl text-ink"
        }
      >
        {title}
      </h3>
      <p
        className={
          dark ? "mt-1 text-sm text-white/55" : "mt-1 text-sm text-ink-soft"
        }
      >
        Book hotels, data, cars, and standard tickets while ToursIWant handles
        custom operator quotes. You leave our site to complete those purchases —
        we may earn a commission.
      </p>
      <ul className="mt-4 space-y-3">
        {products.map((item) => (
          <li
            key={item.id}
            className={
              dark
                ? "flex flex-wrap items-center justify-between gap-3 border border-white/10 px-3 py-3"
                : "flex flex-wrap items-center justify-between gap-3 border border-ink/10 bg-white/70 px-3 py-3"
            }
          >
            <div className="min-w-0">
              <p
                className={
                  dark
                    ? "font-mono text-[10px] uppercase tracking-wider text-amber"
                    : "font-mono text-[10px] uppercase tracking-wider text-skyline"
                }
              >
                {item.partner} · {item.category}
              </p>
              <p
                className={
                  dark
                    ? "font-semibold text-white"
                    : "font-semibold text-ink"
                }
              >
                {item.title}
              </p>
              <p
                className={
                  dark ? "text-sm text-white/55" : "text-sm text-ink-soft"
                }
              >
                {item.priceFrom} · {item.summary}
              </p>
            </div>
            <Link
              href={affiliateGoPath(item)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={
                dark
                  ? "shrink-0 border border-amber/50 bg-amber/15 px-3 py-2 text-xs font-semibold text-amber hover:bg-amber hover:text-ink"
                  : "shrink-0 bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink-soft"
              }
            >
              Check availability →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
