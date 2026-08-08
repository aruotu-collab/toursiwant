import type { Metadata } from "next";
import Link from "next/link";
import { NycScoreboard } from "@/components/NycScoreboard";
import { nycPlaces } from "@/lib/nyc-places";
import {
  scoreboardLenses,
  type ScoreboardLens,
} from "@/lib/tiw-score";

export const metadata: Metadata = {
  title: "New York Scoreboard — Top things to do ranked",
  description:
    "See the best places to visit in New York ranked by the ToursIWant Score. Filter for families, free, views, food, couples, and more.",
  alternates: { canonical: "/new-york" },
  openGraph: {
    title: "New York Scoreboard — ToursIWant",
    description:
      "The scoreboard for things to do in New York. Transparent 0–100 TIW Scores you can re-rank by what matters.",
    url: "/new-york",
  },
};

function parseLens(v: string | undefined): ScoreboardLens {
  if (v && scoreboardLenses.some((l) => l.id === v)) return v as ScoreboardLens;
  return "overall";
}

export default async function NewYorkScoreboardPage({
  searchParams,
}: {
  searchParams: Promise<{ lens?: string }>;
}) {
  const sp = await searchParams;
  const initialLens = parseLens(sp.lens);
  return (
    <main className="flex-1 bg-paper pt-24">
      <div
        className="border-b border-ink/10"
        style={{
          background:
            "radial-gradient(ellipse at 10% 0%, rgba(212,160,23,0.18), transparent 50%), linear-gradient(180deg, #eef3f7 0%, #f3efe6 55%)",
        }}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-deep">
            ToursIWant Scoreboard
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.4rem,6vw,4rem)] leading-[0.98] tracking-tight text-ink">
            New York Top {nycPlaces.length}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            What&apos;s actually worth doing — ranked. Every place gets a
            transparent TIW Score. Change the filter and the board re-ranks for
            families, free activities, views, food, and more.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#board"
              className="bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-soft"
            >
              See the scoreboard
            </a>
            <Link
              href="/?door=explore"
              className="border border-ink/20 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-amber"
            >
              Or browse trip templates
            </Link>
          </div>
          <dl className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              ["0–100", "TIW Score on every place"],
              ["12 lenses", "Re-rank by what matters"],
              ["Then book", "Optional Viator experiences"],
            ].map(([k, v]) => (
              <div key={k} className="border-l border-amber pl-3">
                <dt className="font-display text-xl text-ink">{k}</dt>
                <dd className="mt-1 text-sm text-ink-soft">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div id="board" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-wrap gap-2 border-b border-ink/10 pb-4">
          <span className="border border-ink bg-ink px-3 py-1.5 text-sm text-white">
            Places
          </span>
          <span
            className="border border-ink/15 px-3 py-1.5 text-sm text-stone"
            title="Coming next"
          >
            Tours &amp; experiences
          </span>
        </div>
        <NycScoreboard initialLens={initialLens} />
      </div>
    </main>
  );
}
