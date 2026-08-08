"use client";

import { useState } from "react";
import { ScorecardLeaderboardBloomberg } from "@/components/ScorecardLeaderboardBloomberg";
import { ScorecardLeaderboardRail } from "@/components/ScorecardLeaderboardRail";

type Style = "gallery" | "bloomberg";

export function ScorecardLeaderboardCompare() {
  const [style, setStyle] = useState<Style>("gallery");

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
          Compare styles
        </p>
        <div
          className="inline-flex border border-ink/15 bg-white p-0.5"
          role="group"
          aria-label="Leaderboard style"
        >
          <button
            type="button"
            onClick={() => setStyle("gallery")}
            className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
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
            className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
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
    </div>
  );
}
