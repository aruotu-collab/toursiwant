import type { Metadata } from "next";
import Link from "next/link";
import { NycScoreboard } from "@/components/NycScoreboard";
import { nycPlaces } from "@/lib/nyc-places";
import {
  scoreboardLenses,
  type ScoreboardLens,
} from "@/lib/tiw-score";

export const metadata: Metadata = {
  title: "New York Scorecard — Top things to do ranked",
  description:
    "See the best places to visit in New York ranked by the ToursIWant Score. Filter for families, free, views, food, couples, and more.",
  alternates: { canonical: "/new-york" },
  openGraph: {
    title: "New York Scorecard — ToursIWant",
    description:
      "The scorecard for things to do in New York. Transparent 0–100 TIW Scores you can re-rank by what matters.",
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
    <main className="flex-1 bg-paper pt-20">
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
              New York
            </p>
            <h1 className="mt-1.5 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-tight tracking-tight text-ink">
              New York Top {nycPlaces.length}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-snug text-ink-soft sm:text-base">
              TIW Scorecard (ToursIWant, 0–100) — scroll the filters, tap Want,
              build a trip.
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
        <NycScoreboard initialLens={initialLens} />
      </div>
    </main>
  );
}
