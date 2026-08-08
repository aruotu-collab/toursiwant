import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PersonalPlanBuilder } from "@/components/PersonalPlanBuilder";

export const metadata: Metadata = {
  title: "Build my New York trip",
  description:
    "Turn the places you want to visit into a practical New York itinerary.",
  alternates: { canonical: "/new-york/plan" },
};

export default function NewYorkPlanPage() {
  return (
    <main className="max-w-[100vw] flex-1 overflow-x-clip bg-paper pt-[7.5rem] sm:pt-32">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <p className="text-sm text-ink-soft">
          <Link href="/new-york" className="hover:text-amber-deep">
            New York Scoreboard
          </Link>
          <span className="mx-2 text-stone">/</span>
          My plan
        </p>
        <div className="mt-8">
          <Suspense
            fallback={<p className="text-ink-soft">Building your plan…</p>}
          >
            <PersonalPlanBuilder />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
