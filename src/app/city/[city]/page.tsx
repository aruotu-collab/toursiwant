import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CityScoreboard } from "@/components/CityScoreboard";
import { cityCatalogs, getCityCatalog } from "@/lib/places/registry";
import {
  scoreboardLenses,
  type ScoreboardLens,
} from "@/lib/tiw-score";

type Props = {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ lens?: string; focus?: string }>;
};

export function generateStaticParams() {
  return cityCatalogs
    .filter((c) => c.slug !== "new-york")
    .map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const catalog = getCityCatalog(city);
  if (!catalog) return { title: "City scorecard" };
  return {
    title: `${catalog.name} Scorecard — Top things to do ranked`,
    description: catalog.blurb,
    alternates: { canonical: `/city/${catalog.slug}` },
  };
}

function parseLens(v: string | undefined): ScoreboardLens {
  if (v && scoreboardLenses.some((l) => l.id === v)) return v as ScoreboardLens;
  return "overall";
}

export default async function CityScorecardPage({
  params,
  searchParams,
}: Props) {
  const { city } = await params;
  const catalog = getCityCatalog(city);
  if (!catalog || catalog.slug === "new-york") notFound();

  const sp = await searchParams;
  const initialLens = parseLens(sp.lens);
  const focusSlug =
    typeof sp.focus === "string" && sp.focus.trim() ? sp.focus.trim() : undefined;

  return (
    <main className="max-w-[100vw] flex-1 overflow-x-clip bg-paper pt-[7.5rem] sm:pt-32">
      <div
        className="border-b border-ink/10"
        style={{
          background:
            "radial-gradient(ellipse at 10% 0%, rgba(212,160,23,0.14), transparent 45%), linear-gradient(180deg, #eef3f7 0%, #f3efe6 100%)",
        }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-8 sm:py-6">
          <div className="min-w-0 max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-deep sm:text-[11px]">
              <Link href="/scorecard" className="hover:text-ink">
                Scorecard
              </Link>
              <span className="mx-1.5 text-stone">/</span>
              {catalog.name}
            </p>
            <h1 className="mt-1.5 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-tight text-ink">
              {catalog.name} Top {catalog.places.length}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-snug text-ink-soft sm:text-base">
              {catalog.blurb}
            </p>
          </div>
          <Link
            href="/scorecard"
            className="shrink-0 text-sm font-semibold text-amber-deep underline-offset-2 hover:underline"
          >
            Change city →
          </Link>
        </div>
      </div>

      <div id="board" className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-8 sm:py-6">
        <CityScoreboard
          citySlug={catalog.slug}
          cityName={catalog.name}
          places={catalog.places}
          initialLens={initialLens}
          focusSlug={focusSlug}
        />
      </div>
    </main>
  );
}
