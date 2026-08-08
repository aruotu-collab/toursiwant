import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceViatorExperiences } from "@/components/PlaceViatorExperiences";
import {
  getPlaceBySlug,
  nycPlaces,
  overallRankForSlug,
  rankNycPlaces,
} from "@/lib/nyc-places";
import {
  computeTiwScore,
  scoreFactorLabel,
  scoreboardLenses,
  type ScoreFactors,
  type ScoreboardLens,
} from "@/lib/tiw-score";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lens?: string }>;
};

export async function generateStaticParams() {
  return nycPlaces.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  if (!place) return { title: "Place not found" };
  const score = computeTiwScore(place.factors, "overall");
  return {
    title: `${place.name} — TIW Score ${score}`,
    description: place.summary,
    alternates: { canonical: `/new-york/${place.slug}` },
  };
}

function isLens(v: string | undefined): v is ScoreboardLens {
  return Boolean(v && scoreboardLenses.some((l) => l.id === v));
}

const factorOrder: Array<keyof ScoreFactors> = [
  "travellerSatisfaction",
  "popularity",
  "value",
  "uniqueness",
  "convenience",
  "familyAppeal",
  "firstTimerValue",
];

export default async function NewYorkPlacePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const place = getPlaceBySlug(slug);
  if (!place) notFound();

  const lens: ScoreboardLens = isLens(sp.lens) ? sp.lens : "overall";
  const board = rankNycPlaces(lens);
  const ranked = board.find((p) => p.slug === place.slug);
  const score = ranked?.tiwScore ?? computeTiwScore(place.factors, lens);
  const rank = ranked?.rank ?? null;
  const overallRank = overallRankForSlug(place.slug);
  const explanation =
    ranked?.explanation ||
    place.whyHigh ||
    `${place.name} scores ${score}/100 on the TIW Scoreboard.`;

  return (
    <main className="flex-1 bg-paper pt-24">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <p className="text-sm text-ink-soft">
          <Link href="/new-york" className="hover:text-amber-deep">
            New York Scoreboard
          </Link>
          <span className="mx-2 text-stone">/</span>
          <span className="text-ink">{place.name}</span>
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-deep">
              {place.neighborhood}
              {rank ? ` · #${rank} on this board` : ""}
              {overallRank && lens !== "overall"
                ? ` · #${overallRank} overall`
                : ""}
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.4rem)] leading-tight text-ink">
              {place.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
              {place.summary}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {place.bestFor.map((b) => (
                <li
                  key={b}
                  className="border border-ink/15 bg-white px-3 py-1 text-sm text-ink-soft"
                >
                  {b}
                </li>
              ))}
            </ul>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="border border-ink/10 bg-white p-4">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-stone">
                  Typical cost
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">
                  {place.typicalCostLabel}
                </dd>
              </div>
              <div className="border border-ink/10 bg-white p-4">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-stone">
                  Time
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">
                  {place.durationLabel}
                </dd>
              </div>
              <div className="border border-ink/10 bg-white p-4">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-stone">
                  Cost band
                </dt>
                <dd className="mt-1 text-sm font-semibold capitalize text-ink">
                  {place.cost.replace("_", " ")}
                </dd>
              </div>
            </dl>
          </div>

          <aside className="border border-ink/10 bg-ink px-6 py-7 text-white">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
              TIW Score
            </p>
            <p className="mt-2 font-display text-6xl leading-none tracking-tight">
              {score}
              <span className="text-3xl text-white/50">/100</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {explanation}
            </p>
            <Link
              href={`/new-york?lens=${lens}#board`}
              className="mt-6 inline-block border border-white/25 px-4 py-2 text-sm hover:border-amber hover:text-amber"
            >
              Back to scoreboard
            </Link>
          </aside>
        </div>

        <section className="mt-12 border border-ink/10 bg-white p-5 sm:p-8">
          <h2 className="font-display text-2xl text-ink">How we scored this</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Component scores are visible on purpose. Category boards change
            weights — they do not invent new numbers from nowhere.
          </p>
          <ul className="mt-6 space-y-3">
            {factorOrder.map((key) => {
              const value = place.factors[key];
              return (
                <li key={key}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink-soft">
                      {scoreFactorLabel[key]}
                    </span>
                    <span className="font-mono font-semibold text-ink">
                      {value}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden bg-paper-deep">
                    <div
                      className="h-full bg-amber"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-stone">
            Overall TIW Score weights: 30% traveller satisfaction · 20%
            popularity · 15% value · 15% uniqueness · 10% convenience · 10%
            first-time visitor value. Family, free, views, and other lenses
            re-weight these same factors.
          </p>
        </section>

        <div className="mt-8">
          <PlaceViatorExperiences
            placeName={place.name}
            viatorQuery={place.viatorQuery}
          />
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">Nearby on the board</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {board
              .filter((p) => p.slug !== place.slug)
              .slice(0, 4)
              .map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/new-york/${p.slug}?lens=${lens}`}
                    className="flex items-center justify-between gap-3 border border-ink/10 bg-white px-4 py-3 transition hover:border-amber"
                  >
                    <span>
                      <span className="font-mono text-xs text-amber-deep">
                        #{p.rank}
                      </span>
                      <span className="mt-1 block font-display text-lg text-ink">
                        {p.name}
                      </span>
                    </span>
                    <span className="font-display text-2xl text-ink">
                      {p.tiwScore}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
