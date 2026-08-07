"use client";

import { useState } from "react";
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

const DEFAULT_SUGGESTIONS = [
  "Market",
  "Restaurant",
  "Museum",
  "Park",
  "Harbor",
  "Broadway",
  "Shopping",
  "Viewpoint",
];

/**
 * Vertical day map: H + Day 1/2/3 with +/− expand for stops.
 * Fixed panel height; list scrolls inside so the border stays stable.
 */
export function TemplateRouteLoop({
  template,
  nodes: nodesProp,
  className = "",
  interactive = false,
  selectedNodeId = null,
  selectedStopId = null,
  expandedDayId: expandedDayIdProp,
  onExpandedDayIdChange,
  onSelectNode,
  onSelectStop,
  onRemoveStop,
  onAddStop,
  addSuggestions,
  canAddStop,
}: {
  template?: TripTemplate;
  nodes?: RouteNode[];
  className?: string;
  interactive?: boolean;
  selectedNodeId?: string | null;
  selectedStopId?: string | null;
  /** Controlled expanded day (one at a time). */
  expandedDayId?: string | null;
  onExpandedDayIdChange?: (id: string | null) => void;
  onSelectNode?: (node: RouteNode) => void;
  onSelectStop?: (day: RouteNode, stop: DayStop) => void;
  onRemoveStop?: (dayId: string, stopId: string) => void;
  onAddStop?: (dayId: string, label: string) => void;
  addSuggestions?: string[];
  /** When false, disable add controls (limits hit). */
  canAddStop?: (day: RouteNode) => boolean;
}) {
  const nodes =
    nodesProp || (template ? getTemplateRouteNodes(template) : []);
  const hotel = nodes.find((n) => n.kind === "hotel");
  const days = nodes.filter((n) => n.kind === "day");

  const [internalExpanded, setInternalExpanded] = useState<string | null>(
    null,
  );
  const controlled = expandedDayIdProp !== undefined;
  const expandedDayId = controlled ? expandedDayIdProp : internalExpanded;

  function setExpanded(id: string | null) {
    if (controlled) onExpandedDayIdChange?.(id);
    else setInternalExpanded(id);
  }

  // custom input is shared; only one day is expanded at a time
  const [custom, setCustom] = useState("");
  const chips = Array.from(
    new Set(
      (addSuggestions || DEFAULT_SUGGESTIONS)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

  function toggleDay(day: RouteNode) {
    const next = expandedDayId === day.id ? null : day.id;
    setExpanded(next);
    onSelectNode?.(day);
  }

  function selectDayRow(day: RouteNode) {
    onSelectNode?.(day);
  }

  return (
    <div
      className={`route-loop relative flex flex-col overflow-hidden border border-white/10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,160,23,0.14),transparent_55%),linear-gradient(165deg,#0a1520_0%,#152433_55%,#0f1c28_100%)] ${className}`}
    >
      <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
          Your days
          {interactive ? (
            <span className="ml-2 font-sans text-[11px] normal-case tracking-normal text-white/45">
              · + opens stops on that day
            </span>
          ) : null}
        </p>
      </div>

      {/* Sticky hotel */}
      {hotel ? (
        <div className="shrink-0 border-b border-white/10 bg-black/25 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            disabled={!onSelectNode}
            onClick={() => onSelectNode?.(hotel)}
            className={`flex w-full items-center gap-3 text-left ${
              onSelectNode ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold ${
                selectedNodeId === hotel.id && !selectedStopId
                  ? "border-amber bg-amber text-ink"
                  : "border-paper bg-amber text-ink"
              }`}
            >
              H
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] uppercase tracking-wider text-amber/80">
                Stay
              </p>
              <p className="truncate text-sm font-semibold text-amber">
                {hotel.label}
              </p>
            </div>
          </button>
        </div>
      ) : null}

      {/* Scrollable day list — fixed panel height */}
      <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3">
        {days.map((day, i) => {
          const num = day.dayIndex ?? i + 1;
          const stopCount = day.stops?.length || 0;
          const expanded = expandedDayId === day.id;
          const daySelected =
            selectedNodeId === day.id && !selectedStopId;
          const allowAdd =
            interactive &&
            onAddStop &&
            (canAddStop ? canAddStop(day) : true);

          return (
            <li
              key={day.id}
              className={`rounded-sm border transition ${
                expanded || daySelected
                  ? "border-amber/40 bg-amber/10"
                  : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2 px-2 py-2 sm:gap-3 sm:px-2.5">
                <button
                  type="button"
                  onClick={() => selectDayRow(day)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-pressed={daySelected}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-semibold transition sm:h-11 sm:w-11 ${
                      daySelected || expanded
                        ? "border-amber bg-amber text-ink"
                        : "border-amber bg-paper text-ink"
                    }`}
                  >
                    {num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-amber/80">
                      {day.dayLabel || `Day ${num}`}
                    </p>
                    <p
                      className={`truncate text-sm ${
                        daySelected || expanded
                          ? "font-semibold text-amber"
                          : "text-white/90"
                      }`}
                    >
                      {day.label}
                    </p>
                    {!expanded ? (
                      <p className="mt-0.5 text-[11px] text-white/40">
                        {stopCount === 0
                          ? "No stops yet"
                          : `${stopCount} stop${stopCount === 1 ? "" : "s"}`}
                      </p>
                    ) : null}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center border text-lg leading-none transition ${
                    expanded
                      ? "border-amber bg-amber text-ink"
                      : "border-white/25 text-white/70 hover:border-amber hover:text-amber"
                  }`}
                  aria-expanded={expanded}
                  aria-label={
                    expanded
                      ? `Hide stops for ${day.dayLabel || `Day ${num}`}`
                      : `Show stops for ${day.dayLabel || `Day ${num}`}`
                  }
                >
                  {expanded ? "−" : "+"}
                </button>
              </div>

              {expanded ? (
                <div className="border-t border-white/10 px-3 pb-3 pt-2 sm:px-4">
                  {stopCount === 0 ? (
                    <p className="mb-2 text-sm text-white/45">
                      No stops yet
                      {interactive ? " · add one below" : ""}
                    </p>
                  ) : (
                    <ul className="mb-2 space-y-1.5">
                      {day.stops!.map((stop) => {
                        const stopSelected =
                          selectedNodeId === day.id &&
                          selectedStopId === stop.id;
                        return (
                          <li
                            key={stop.id}
                            className="flex items-center gap-2"
                          >
                            {onSelectStop ? (
                              <button
                                type="button"
                                onClick={() => onSelectStop(day, stop)}
                                className={`min-w-0 flex-1 truncate border px-2.5 py-1.5 text-left text-sm transition ${
                                  stopSelected
                                    ? "border-amber bg-amber/20 text-amber"
                                    : "border-white/15 text-white/80 hover:border-amber/50"
                                }`}
                              >
                                {stop.label}
                              </button>
                            ) : (
                              <span className="min-w-0 flex-1 truncate border border-white/10 px-2.5 py-1.5 text-sm text-white/70">
                                {stop.label}
                              </span>
                            )}
                            {interactive && onRemoveStop ? (
                              <button
                                type="button"
                                onClick={() => onRemoveStop(day.id, stop.id)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/20 text-white/50 hover:border-amber hover:text-amber"
                                aria-label={`Remove ${stop.label}`}
                              >
                                ×
                              </button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {interactive && onAddStop ? (
                    <div className="space-y-2 border-t border-white/10 pt-2">
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
                        Add a stop to {day.dayLabel || `Day ${num}`}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {chips.slice(0, 8).map((label) => (
                          <button
                            key={label}
                            type="button"
                            disabled={!allowAdd}
                            onClick={() => onAddStop(day.id, label)}
                            className="border border-white/20 px-2 py-1 text-[11px] text-white/75 hover:border-amber hover:text-amber disabled:opacity-40"
                          >
                            + {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={custom}
                          onChange={(e) => setCustom(e.target.value)}
                          onFocus={() => onSelectNode?.(day)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const v = custom.trim();
                              if (!v || !allowAdd) return;
                              onAddStop(day.id, v);
                              setCustom("");
                            }
                          }}
                          placeholder="Custom stop"
                          disabled={!allowAdd}
                          className="min-w-0 flex-1 border border-white/20 bg-black/30 px-2 py-1.5 text-sm outline-none focus:border-amber disabled:opacity-40"
                        />
                        <button
                          type="button"
                          disabled={!custom.trim() || !allowAdd}
                          onClick={() => {
                            const v = custom.trim();
                            if (!v || !allowAdd) return;
                            onAddStop(day.id, v);
                            setCustom("");
                          }}
                          className="bg-amber px-2.5 py-1.5 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
