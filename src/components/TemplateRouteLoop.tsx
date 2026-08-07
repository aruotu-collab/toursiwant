"use client";

import { useMemo, useState } from "react";
import type { TripTemplate } from "@/lib/trip-templates";

/** A place inside a day (Museum, Market, …). */
export type DayStop = {
  id: string;
  label: string;
};

/**
 * Path nodes: hotel + one node per itinerary day.
 * Numbers are day numbers — not arbitrary stops.
 */
export type RouteNode = {
  id: string;
  label: string;
  kind: "hotel" | "day";
  /** Template block id for day nodes */
  blockId?: string;
  /** e.g. "Day 1" */
  dayLabel?: string;
  /** 1-based day index used for the circle number */
  dayIndex?: number;
  /** Stops nested under this day */
  stops?: DayStop[];
};

/** Build hotel + Day 1…N from template blocks. */
export function getTemplateRouteNodes(t: TripTemplate): RouteNode[] {
  const hotelLabel = t.hotelAnchor
    ? shortenLabel(t.hotelAnchor.name) || "Hotel"
    : "Hotel";

  const hotel: RouteNode = {
    id: "hotel",
    label: hotelLabel,
    kind: "hotel",
  };

  const days: RouteNode[] = t.blocks.map((b, i) => ({
    id: `block:${b.id}`,
    label: shortenLabel(b.title),
    kind: "day" as const,
    blockId: b.id,
    dayLabel: b.dayLabel || `Day ${i + 1}`,
    dayIndex: i + 1,
    stops: [],
  }));

  if (!days.length) {
    return [
      hotel,
      {
        id: "day:1",
        label: "Explore",
        kind: "day",
        dayLabel: "Day 1",
        dayIndex: 1,
        stops: [],
      },
    ];
  }

  return [hotel, ...days];
}

/**
 * Normalize saved / legacy flat stop lists into hotel + days with nested stops.
 */
export function normalizeRouteNodes(
  nodes:
    | Array<{
        id: string;
        label: string;
        kind: string;
        blockId?: string;
        dayLabel?: string;
        dayIndex?: number;
        stops?: DayStop[];
      }>
    | null
    | undefined,
  template: TripTemplate,
): RouteNode[] {
  const base = getTemplateRouteNodes(template);
  if (!nodes?.length) return base;

  const hotelFromSaved = nodes.find((n) => n.kind === "hotel");
  const hotel: RouteNode = {
    ...base[0]!,
    label: hotelFromSaved?.label || base[0]!.label,
  };

  const hasDays = nodes.some((n) => n.kind === "day");
  if (hasDays) {
    const byBlock = new Map(
      nodes
        .filter((n) => n.kind === "day" && n.blockId)
        .map((n) => [n.blockId!, n]),
    );
    const days = base
      .filter((n) => n.kind === "day")
      .map((d) => {
        const saved = d.blockId ? byBlock.get(d.blockId) : undefined;
        return {
          ...d,
          label: saved?.label || d.label,
          dayLabel: saved?.dayLabel || d.dayLabel,
          stops: saved?.stops?.length ? saved.stops : [],
        };
      });
    return [hotel, ...days];
  }

  const legacyStops = nodes.filter(
    (n) =>
      n.kind !== "hotel" &&
      (String(n.blockId || "").startsWith("added_") ||
        String(n.id).startsWith("custom:") ||
        n.kind === "stop"),
  );
  const nested: DayStop[] = legacyStops
    .filter(
      (n) =>
        String(n.blockId || "").startsWith("added_") ||
        String(n.id).startsWith("custom:"),
    )
    .map((n) => ({
      id: n.id,
      label: n.label,
    }));

  const days = base
    .filter((n) => n.kind === "day")
    .map((d, i) => ({
      ...d,
      stops: i === 0 ? nested : [],
    }));

  return [hotel, ...days];
}

/** @deprecated use getTemplateRouteNodes */
export function getTemplateRouteStops(t: TripTemplate): string[] {
  return getTemplateRouteNodes(t)
    .filter((n) => n.kind === "day")
    .map((n) => n.label);
}

export function shortenLabel(raw: string) {
  let s = raw
    .replace(/\s*—\s*.*$/, "")
    .replace(/\s*\(.*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  s = s
    .replace(/\s+flexible day$/i, "")
    .replace(/\s+core$/i, "")
    .replace(/\s+hotel anchor$/i, "")
    .replace(/^Leave the /i, "")
    .trim();

  if (/^aliz/i.test(s)) return "Hotel";
  if (s.length <= 16) return s || "Day";

  const words = s.split(" ");
  if (words.length >= 2 && words.slice(0, 2).join(" ").length <= 18) {
    return words.slice(0, 2).join(" ");
  }
  return `${s.slice(0, 14).trim()}…`;
}

type LoopPoint = {
  key: string;
  label: string;
  kind: "hotel" | "day" | "stop";
  day?: RouteNode;
  stop?: DayStop;
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
 * Place n points along the outward journey (top → right → bottom),
 * leaving the left side free for the dashed return to hotel.
 */
function placeOnJourney(n: number, track: ReturnType<typeof stadiumPath>): XY[] {
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
 * Journey loop diagram: Hotel → stops/days along a curved path,
 * dashed return home — like a drawn day-loop map.
 */
export function TemplateRouteLoop({
  template,
  nodes: nodesProp,
  className = "",
  interactive = false,
  selectedNodeId = null,
  selectedStopId = null,
  expandedDayIds: expandedDayIdsProp,
  onExpandedDayIdsChange,
  onSelectNode,
  onSelectStop,
  onRemoveStop,
}: {
  template?: TripTemplate;
  nodes?: RouteNode[];
  className?: string;
  interactive?: boolean;
  selectedNodeId?: string | null;
  selectedStopId?: string | null;
  expandedDayIds?: string[];
  onExpandedDayIdsChange?: (ids: string[]) => void;
  onSelectNode?: (node: RouteNode) => void;
  onSelectStop?: (day: RouteNode, stop: DayStop) => void;
  onRemoveStop?: (dayId: string, stopId: string) => void;
}) {
  const nodes =
    nodesProp || (template ? getTemplateRouteNodes(template) : []);
  const hotel = nodes.find((n) => n.kind === "hotel");
  const days = nodes.filter((n) => n.kind === "day");

  const [internalExpanded, setInternalExpanded] = useState<string[]>([]);
  const controlled = expandedDayIdsProp !== undefined;
  const expandedDayIds = controlled ? expandedDayIdsProp : internalExpanded;

  function setExpandedIds(ids: string[]) {
    if (controlled) onExpandedDayIdsChange?.(ids);
    else setInternalExpanded(ids);
  }

  function isExpanded(dayId: string) {
    return expandedDayIds.includes(dayId);
  }

  function toggleDay(day: RouteNode) {
    if (isExpanded(day.id)) {
      setExpandedIds(expandedDayIds.filter((id) => id !== day.id));
    } else {
      setExpandedIds([...expandedDayIds, day.id]);
    }
  }

  function expandAll() {
    setExpandedIds(days.map((d) => d.id));
  }

  function collapseAll() {
    setExpandedIds([]);
  }

  const loopPoints: LoopPoint[] = useMemo(() => {
    const pts: LoopPoint[] = [];
    const h = nodes.find((n) => n.kind === "hotel");
    const dayNodes = nodes.filter((n) => n.kind === "day");
    if (h) {
      pts.push({
        key: h.id,
        label: h.label || "Hotel",
        kind: "hotel",
      });
    }
    for (const day of dayNodes) {
      const stops = day.stops || [];
      if (expandedDayIds.includes(day.id) && stops.length > 0) {
        for (const stop of stops) {
          pts.push({
            key: `${day.id}:${stop.id}`,
            label: stop.label,
            kind: "stop",
            day,
            stop,
            dayIndex: day.dayIndex,
          });
        }
      } else {
        pts.push({
          key: day.id,
          label: day.label,
          kind: "day",
          day,
          dayIndex: day.dayIndex,
        });
      }
    }
    return pts;
  }, [nodes, expandedDayIds]);

  const vb = { w: 640, h: 320 };
  const track = stadiumPath(vb.w, vb.h, 56, 72);
  const positions = placeOnJourney(loopPoints.length, track);
  const lastPos = positions[positions.length - 1];
  const hotelPos = positions[0] || { x: track.left + track.r, y: track.top };

  const solidPath =
    positions.length > 1
      ? positions
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(" ")
      : "";

  // Dashed return: last stop → curve along left → hotel
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

  const hotelSelected = selectedNodeId === hotel?.id && !selectedStopId;
  const anyStops = days.some((d) => (d.stops || []).length > 0);

  return (
    <div
      className={`route-loop relative flex flex-col overflow-hidden border border-white/10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,160,23,0.14),transparent_55%),linear-gradient(165deg,#0a1520_0%,#152433_55%,#0f1c28_100%)] ${className}`}
    >
      <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
            Trip diagram
            <span className="ml-2 font-sans text-[11px] normal-case tracking-normal text-white/45">
              · path = journey · dashed = back to hotel
            </span>
          </p>
          {anyStops || interactive ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wide text-white/65 hover:border-amber hover:text-amber"
              >
                Expand stops
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wide text-white/65 hover:border-amber hover:text-amber"
              >
                Days only
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden px-1 py-1 sm:px-2">
        <svg
          viewBox={`0 0 ${vb.w} ${vb.h}`}
          className="h-full w-full"
          role="img"
          aria-label="Trip loop from hotel through stops and back"
        >
          {/* Soft track ghost */}
          <path
            d={track.d}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={10}
            strokeLinecap="round"
          />

          {/* Solid outward journey */}
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

          {/* Dashed return to hotel */}
          {returnPath ? (
            <path
              d={returnPath}
              fill="none"
              stroke="rgba(212,160,23,0.55)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="7 6"
              markerEnd="url(#loop-arrow)"
            />
          ) : null}

          <defs>
            <marker
              id="loop-arrow"
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
            const day = pt.day;
            const stop = pt.stop;
            const daySelected =
              day && selectedNodeId === day.id && !selectedStopId;
            const stopSelected =
              day &&
              stop &&
              selectedNodeId === day.id &&
              selectedStopId === stop.id;
            const expanded = day ? isExpanded(day.id) : false;
            const active = isHotel
              ? hotelSelected
              : Boolean(daySelected || stopSelected || expanded);

            const labelAbove = pos.y < vb.h * 0.45;
            const labelY = labelAbove ? pos.y - 22 : pos.y + 28;
            const circleR = isHotel ? 16 : pt.kind === "stop" ? 11 : 14;

            return (
              <g key={pt.key}>
                <g
                  className={
                    onSelectNode || onSelectStop
                      ? "cursor-pointer"
                      : undefined
                  }
                  onClick={() => {
                    if (isHotel && hotel) onSelectNode?.(hotel);
                    else if (pt.kind === "stop" && day && stop)
                      onSelectStop?.(day, stop);
                    else if (day) onSelectNode?.(day);
                  }}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={circleR + (active ? 3 : 0)}
                    fill="transparent"
                    stroke={active ? "rgba(212,160,23,0.45)" : "transparent"}
                    strokeWidth={3}
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={circleR}
                    fill={
                      isHotel
                        ? "#d4a017"
                        : active
                          ? "#d4a017"
                          : "#f4efe4"
                    }
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
                      fontSize: isHotel ? 13 : pt.kind === "day" ? 12 : 10,
                      fontWeight: 700,
                      fill: "#0a1520",
                      fontFamily: "ui-sans-serif, system-ui, sans-serif",
                    }}
                  >
                    {isHotel
                      ? "H"
                      : pt.kind === "day"
                        ? String(pt.dayIndex ?? i)
                        : "•"}
                  </text>
                </g>

                <text
                  x={pos.x}
                  y={labelY}
                  textAnchor="middle"
                  className="select-none"
                  style={{
                    fontSize: 12,
                    fontWeight: isHotel || active ? 600 : 500,
                    fill: isHotel || active ? "#d4a017" : "rgba(255,255,255,0.82)",
                    fontFamily:
                      "var(--font-display), Georgia, 'Times New Roman', serif",
                  }}
                >
                  {shortenLabel(pt.label).slice(0, 18)}
                </text>

                {/* Expand / collapse for days with stops */}
                {pt.kind === "day" &&
                day &&
                (day.stops || []).length > 0 ? (
                  <g
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDay(day);
                    }}
                  >
                    <rect
                      x={pos.x + circleR + 4}
                      y={pos.y - 9}
                      width={18}
                      height={18}
                      rx={2}
                      fill={expanded ? "#d4a017" : "rgba(10,21,32,0.85)"}
                      stroke="rgba(212,160,23,0.7)"
                      strokeWidth={1}
                    />
                    <text
                      x={pos.x + circleR + 13}
                      y={pos.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fill: expanded ? "#0a1520" : "#d4a017",
                      }}
                    >
                      {expanded ? "−" : "+"}
                    </text>
                  </g>
                ) : null}

                {/* Remove stop (interactive) */}
                {interactive &&
                pt.kind === "stop" &&
                day &&
                stop &&
                onRemoveStop ? (
                  <g
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStop(day.id, stop.id);
                    }}
                  >
                    <circle
                      cx={pos.x + 14}
                      cy={pos.y - 14}
                      r={8}
                      fill="rgba(10,21,32,0.9)"
                      stroke="rgba(255,255,255,0.35)"
                    />
                    <text
                      x={pos.x + 14}
                      y={pos.y - 13}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }}
                    >
                      ×
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
