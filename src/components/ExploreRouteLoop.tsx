"use client";

import { useMemo } from "react";
import {
  getTemplateRouteNodes,
  shortenLabel,
} from "@/components/TemplateRouteLoop";
import type { TripTemplate } from "@/lib/trip-templates";

type LoopPoint = {
  key: string;
  label: string;
  kind: "hotel" | "day";
  dayIndex?: number;
};

type XY = { x: number; y: number };

/** Stadium / racetrack outline matching the hand-drawn loop. */
function stadiumPath(w: number, h: number, pad: number, r: number) {
  const left = pad;
  const right = w - pad;
  const top = pad;
  const bottom = h - pad;
  const rr = Math.min(r, (right - left) / 2, (bottom - top) / 2);
  return {
    left,
    right,
    top,
    bottom,
    r: rr,
    d: [
      `M ${left + rr} ${top}`,
      `L ${right - rr} ${top}`,
      `A ${rr} ${rr} 0 0 1 ${right} ${top + rr}`,
      `L ${right} ${bottom - rr}`,
      `A ${rr} ${rr} 0 0 1 ${right - rr} ${bottom}`,
      `L ${left + rr} ${bottom}`,
      `A ${rr} ${rr} 0 0 1 ${left} ${bottom - rr}`,
      `L ${left} ${top + rr}`,
      `A ${rr} ${rr} 0 0 1 ${left + rr} ${top}`,
      "Z",
    ].join(" "),
  };
}

/**
 * Place n points along the outward journey (top -> right -> bottom),
 * leaving the left side free for the dashed return to hotel.
 */
function placeOnJourney(
  n: number,
  track: ReturnType<typeof stadiumPath>,
): XY[] {
  if (n <= 0) return [];
  const { left, right, top, bottom, r } = track;
  const topLen = Math.max(0, right - left - 2 * r);
  const rightLen = Math.max(0, bottom - top - 2 * r);
  const bottomLen = topLen;
  const arc = (Math.PI / 2) * r;
  const total = topLen + arc + rightLen + arc + bottomLen;

  const samples: number[] =
    n === 1
      ? [0]
      : Array.from({ length: n }, (_, i) => (i / (n - 1)) * total * 0.98);

  return samples.map((dist) => {
    let d = dist;
    if (d <= topLen) {
      return { x: left + r + d, y: top };
    }
    d -= topLen;
    if (d <= arc) {
      const a = -Math.PI / 2 + d / r;
      return {
        x: right - r + Math.cos(a) * r,
        y: top + r + Math.sin(a) * r,
      };
    }
    d -= arc;
    if (d <= rightLen) {
      return { x: right, y: top + r + d };
    }
    d -= rightLen;
    if (d <= arc) {
      const a = 0 + d / r;
      return {
        x: right - r + Math.cos(a) * r,
        y: bottom - r + Math.sin(a) * r,
      };
    }
    d -= arc;
    const along = Math.min(d, bottomLen);
    return { x: right - r - along, y: bottom };
  });
}

/**
 * Explore-only preview: hotel -> days on a curved loop, dashed return home.
 * Do not use on Make it yours / workspace / I'm here now.
 */
export function ExploreRouteLoop({
  template,
  className = "",
}: {
  template: TripTemplate;
  className?: string;
}) {
  const nodes = useMemo(() => getTemplateRouteNodes(template), [template]);

  const loopPoints: LoopPoint[] = useMemo(() => {
    const pts: LoopPoint[] = [];
    const hotel = nodes.find((n) => n.kind === "hotel");
    const days = nodes.filter((n) => n.kind === "day");
    if (hotel) {
      pts.push({
        key: hotel.id,
        label: hotel.label || "Hotel",
        kind: "hotel",
      });
    }
    for (const day of days) {
      pts.push({
        key: day.id,
        label: day.label,
        kind: "day",
        dayIndex: day.dayIndex,
      });
    }
    return pts;
  }, [nodes]);

  const vb = { w: 640, h: 320 };
  const track = stadiumPath(vb.w, vb.h, 64, 68);
  const positions = placeOnJourney(loopPoints.length, track);
  const lastPos = positions[positions.length - 1];
  const hotelPos = positions[0] || { x: track.left + track.r, y: track.top };

  const solidPath =
    positions.length > 1
      ? positions
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
          )
          .join(" ")
      : "";

  const returnPath =
    lastPos && positions.length > 1
      ? [
          `M ${lastPos.x.toFixed(1)} ${lastPos.y.toFixed(1)}`,
          `L ${(track.left + track.r).toFixed(1)} ${track.bottom.toFixed(1)}`,
          `A ${track.r} ${track.r} 0 0 1 ${track.left.toFixed(1)} ${(track.bottom - track.r).toFixed(1)}`,
          `L ${track.left.toFixed(1)} ${(track.top + track.r).toFixed(1)}`,
          `A ${track.r} ${track.r} 0 0 1 ${hotelPos.x.toFixed(1)} ${hotelPos.y.toFixed(1)}`,
        ].join(" ")
      : "";

  return (
    <div
      className={`route-loop relative flex flex-col overflow-hidden border border-white/10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,160,23,0.14),transparent_55%),linear-gradient(165deg,#0a1520_0%,#152433_55%,#0f1c28_100%)] ${className}`}
    >
      <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-amber sm:text-sm">
          Trip diagram
          <span className="ml-2 font-sans text-xs normal-case tracking-normal text-white/55 sm:text-sm">
            · path = journey · dashed = back to hotel
          </span>
        </p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden px-1 py-1 sm:px-2">
        <svg
          viewBox={`0 0 ${vb.w} ${vb.h}`}
          className="h-full w-full"
          role="img"
          aria-label="Trip loop from hotel through days and back"
        >
          <path
            d={track.d}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={10}
            strokeLinecap="round"
          />

          {solidPath ? (
            <path
              d={solidPath}
              fill="none"
              stroke="rgba(212,160,23,0.85)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {returnPath ? (
            <path
              d={returnPath}
              fill="none"
              stroke="rgba(212,160,23,0.55)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="7 6"
              markerEnd="url(#explore-loop-arrow)"
            />
          ) : null}

          <defs>
            <marker
              id="explore-loop-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="rgba(212,160,23,0.7)" />
            </marker>
          </defs>

          {loopPoints.map((pt, i) => {
            const pos = positions[i];
            if (!pos) return null;
            const isHotel = pt.kind === "hotel";
            const labelAbove = pos.y < vb.h * 0.45;
            const labelY = labelAbove ? pos.y - 30 : pos.y + 36;
            const circleR = isHotel ? 20 : 17;

            return (
              <g key={pt.key}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={circleR}
                  fill={isHotel ? "#d4a017" : "#f4efe4"}
                  stroke="#d4a017"
                  strokeWidth={2}
                />
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="select-none"
                  style={{
                    fontSize: isHotel ? 16 : 15,
                    fontWeight: 700,
                    fill: "#0a1520",
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  }}
                >
                  {isHotel ? "H" : String(pt.dayIndex ?? i)}
                </text>
                <text
                  x={pos.x}
                  y={labelY}
                  textAnchor="middle"
                  className="select-none"
                  style={{
                    fontSize: 18,
                    fontWeight: isHotel ? 700 : 650,
                    fill: isHotel ? "#f0c14b" : "rgba(255,255,255,0.95)",
                    fontFamily:
                      "var(--font-display), Georgia, 'Times New Roman', serif",
                  }}
                >
                  {shortenLabel(pt.label).slice(0, 20)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
