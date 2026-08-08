"use client";

import { useState } from "react";
import { ScorecardLeaderboardBloomberg } from "@/components/ScorecardLeaderboardBloomberg";
import { ScorecardLeaderboardRail } from "@/components/ScorecardLeaderboardRail";

type Style = "gallery" | "bloomberg";

export function ScorecardLeaderboardCompare() {
  const [style, setStyle] = useState<Style>("gallery");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
          Compare leaderboard styles
        </p>
        <div
          className="inline-flex border border-ink/15 bg-white p-0.5"
          role="group"
          aria-label="Leaderboard style"
        >
          <button
            type="button"
            onClick={() => setStyle("gallery")}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
              style === "gallery"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Gallery
          </button>
          <button
            type="button"
            onClick={() => setStyle("bloomberg")}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
              style === "bloomberg"
                ? "bg-ink text-paper"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Bloomberg
          </button>
        </div>
      </div>

      {style === "gallery" ? (
        <ScorecardLeaderboardRail />
      ) : (
        <ScorecardLeaderboardBloomberg />
      )}

      <p className="mt-2 text-xs text-ink-soft">
        {style === "gallery"
          ? "Gallery: warm editorial panels — easier for travelers."
          : "Bloomberg: dense terminal board — score, change, volume, live tape."}
      </p>
    </div>
  );
}
