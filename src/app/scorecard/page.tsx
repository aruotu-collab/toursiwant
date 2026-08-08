import type { Metadata } from "next";
import { ScorecardHub } from "@/components/ScorecardHub";
import { ScorecardLeaderboardCompare } from "@/components/ScorecardLeaderboardCompare";

export const metadata: Metadata = {
  title: "Scorecard — pick a destination",
  description:
    "Open a ToursIWant scorecard by country, state, and city. Start with New York’s live TIW board.",
  alternates: { canonical: "/scorecard" },
};

export default function ScorecardPage() {
  return (
    <main className="max-w-[100vw] flex-1 overflow-x-clip bg-paper pt-[7.5rem] sm:pt-32">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-8 sm:pb-14 sm:pt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-deep">
          ToursIWant Scorecard
        </p>

        <div className="mt-2 animate-rise">
          <ScorecardLeaderboardCompare />
        </div>

        <h1 className="mt-8 max-w-3xl font-display text-[clamp(1.65rem,3.5vw,2.35rem)] leading-[1.05] tracking-tight text-ink">
          Where are you going?
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
          Search by country, state, or city — then open that destination&apos;s
          TIW Scorecard to rank what&apos;s worth doing.
        </p>
        <div className="mt-10">
          <ScorecardHub />
        </div>
      </div>
    </main>
  );
}
