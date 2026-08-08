"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { suggestedDaysForSelections } from "@/lib/scoreboard-plan";
import { useNycWants } from "@/lib/use-nyc-wants";

export function PlaceWantActions({
  slug,
  placeName,
  boardHref,
}: {
  slug: string;
  placeName: string;
  boardHref: string;
}) {
  const { wants, days, ready, toggle, isWanted } = useNycWants();
  const wanted = ready && isWanted(slug);
  const projectedDays = useMemo(
    () => (wants.length ? suggestedDaysForSelections(wants) : days),
    [wants, days],
  );
  const [scrolledPastScore, setScrolledPastScore] = useState(false);

  useEffect(() => {
    const marker = document.getElementById("place-score-card");
    if (!marker) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolledPastScore(!entry.isIntersecting);
      },
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="mt-6 flex flex-col gap-2">
        <WantButton
          wanted={wanted}
          ready={ready}
          onToggle={() => toggle(slug)}
          size="lg"
          dark
        />
        <Link
          href={boardHref}
          className="inline-flex items-center justify-center border border-white/25 px-4 py-2.5 text-sm text-white/80 transition hover:border-amber hover:text-amber"
        >
          Back to scoreboard
        </Link>
        {ready && wants.length > 0 ? (
          <p className="mt-1 text-center text-xs text-white/50">
            {wants.length} place{wants.length === 1 ? "" : "s"} in your trip
            {wanted ? " · including this one" : ""}
          </p>
        ) : null}
      </div>

      {/* Mobile sticky Want while scrolling past the score card */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-ink/15 bg-ink text-white shadow-[0_-8px_30px_rgba(0,0,0,0.25)] transition lg:hidden ${
          scrolledPastScore
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0"
        }`}
        aria-hidden={!scrolledPastScore}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base">{placeName}</p>
            <p className="text-xs text-white/55">
              {wants.length
                ? `${wants.length} selected · ${projectedDays} day${projectedDays === 1 ? "" : "s"}`
                : "Add this place to your trip"}
            </p>
          </div>
          <WantButton
            wanted={wanted}
            ready={ready}
            onToggle={() => toggle(slug)}
            size="md"
            dark={false}
          />
          {wants.length ? (
            <Link
              href={`/new-york/plan?days=${projectedDays}`}
              className="shrink-0 bg-amber px-3 py-2.5 text-sm font-semibold text-ink"
            >
              Build
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

function WantButton({
  wanted,
  ready,
  onToggle,
  size,
  dark,
}: {
  wanted: boolean;
  ready: boolean;
  onToggle: () => void;
  size: "md" | "lg";
  dark: boolean;
}) {
  const pad = size === "lg" ? "px-4 py-3 text-sm" : "px-3 py-2.5 text-sm";
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={onToggle}
      aria-pressed={wanted}
      className={`shrink-0 border font-semibold transition disabled:opacity-50 ${pad} ${
        wanted
          ? "border-amber bg-amber text-ink"
          : dark
            ? "border-amber bg-amber text-ink hover:bg-amber-deep"
            : "border-white/30 bg-white text-ink"
      }`}
    >
      {wanted ? "✓ In my trip" : "♡ Want"}
    </button>
  );
}
