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
 * Vertical journey diagram: Hotel → Day 1 → Day 2 → Day 3 with arrows.
 * Fixed panel height; diagram scrolls inside. Days expand independently.
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
  /** Controlled set of expanded day ids (independent). */
  expandedDayIds?: string[];
  onExpandedDayIdsChange?: (ids: string[]) => void;
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

  const [internalExpanded, setInternalExpanded] = useState<string[]>([]);
  const controlled = expandedDayIdsProp !== undefined;
  const expandedDayIds = controlled ? expandedDayIdsProp : internalExpanded;

  function setExpandedIds(ids: string[]) {
    if (controlled) onExpandedDayIdsChange?.(ids);
    else setInternalExpanded(ids);
  }

  const [customByDay, setCustomByDay] = useState<Record<string, string>>({});
  const chips = Array.from(
    new Set(
      (addSuggestions || DEFAULT_SUGGESTIONS)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

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

  const hotelSelected = selectedNodeId === hotel?.id && !selectedStopId;

  return (
    <div
      className={`route-loop relative flex flex-col overflow-hidden border border-white/10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,160,23,0.14),transparent_55%),linear-gradient(165deg,#0a1520_0%,#152433_55%,#0f1c28_100%)] ${className}`}
    >
      <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
            Trip diagram
            <span className="ml-2 font-sans text-[11px] normal-case tracking-normal text-white/45">
              · follow the arrows · + opens stops
            </span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wide text-white/65 hover:border-amber hover:text-amber"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wide text-white/65 hover:border-amber hover:text-amber"
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
        <ol className="relative mx-auto max-w-lg">
          {/* Hotel node */}
          {hotel ? (
            <li className="relative">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="relative z-10 flex w-12 shrink-0 flex-col items-center sm:w-14">
                  <button
                    type="button"
                    disabled={!onSelectNode}
                    onClick={() => onSelectNode?.(hotel)}
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold transition sm:h-14 sm:w-14 ${
                      hotelSelected
                        ? "scale-105 border-amber bg-amber text-ink shadow-[0_0_0_3px_rgba(212,160,23,0.35)]"
                        : "border-paper bg-amber text-ink"
                    } ${onSelectNode ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                    aria-label={`Hotel ${hotel.label}`}
                  >
                    H
                  </button>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 sm:pt-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-amber/80">
                    Stay
                  </p>
                  <p className="truncate font-display text-base text-amber sm:text-lg">
                    {hotel.label}
                  </p>
                </div>
              </div>
              {days.length > 0 ? <FlowArrow /> : null}
            </li>
          ) : null}

          {days.map((day, i) => {
            const num = day.dayIndex ?? i + 1;
            const stopCount = day.stops?.length || 0;
            const expanded = isExpanded(day.id);
            const daySelected =
              selectedNodeId === day.id && !selectedStopId;
            const allowAdd =
              interactive &&
              onAddStop &&
              (canAddStop ? canAddStop(day) : true);
            const custom = customByDay[day.id] || "";
            const isLast = i === days.length - 1;

            return (
              <li key={day.id} className="relative">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Spine node */}
                  <div className="relative z-10 flex w-12 shrink-0 flex-col items-center sm:w-14">
                    <button
                      type="button"
                      onClick={() => onSelectNode?.(day)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold transition sm:h-14 sm:w-14 ${
                        daySelected || expanded
                          ? "scale-105 border-amber bg-amber text-ink shadow-[0_0_0_3px_rgba(212,160,23,0.35)]"
                          : "border-amber bg-paper text-ink hover:scale-105"
                      }`}
                      aria-pressed={daySelected}
                      aria-label={`${day.dayLabel || `Day ${num}`}: ${day.label}`}
                    >
                      {num}
                    </button>
                  </div>

                  {/* Label + expand */}
                  <div
                    className={`min-w-0 flex-1 border transition ${
                      expanded || daySelected
                        ? "border-amber/35 bg-amber/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start gap-2 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectNode?.(day)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="font-mono text-[9px] uppercase tracking-wider text-amber/80">
                          {day.dayLabel || `Day ${num}`}
                        </p>
                        <p
                          className={`truncate text-sm sm:text-base ${
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
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border text-lg leading-none transition ${
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
                      <div className="border-t border-white/10 px-3 pb-3 pt-2">
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
                                  <span
                                    className="text-amber/60"
                                    aria-hidden
                                  >
                                    →
                                  </span>
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
                                      onClick={() =>
                                        onRemoveStop(day.id, stop.id)
                                      }
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
                                onChange={(e) =>
                                  setCustomByDay((prev) => ({
                                    ...prev,
                                    [day.id]: e.target.value,
                                  }))
                                }
                                onFocus={() => onSelectNode?.(day)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const v = custom.trim();
                                    if (!v || !allowAdd) return;
                                    onAddStop(day.id, v);
                                    setCustomByDay((prev) => ({
                                      ...prev,
                                      [day.id]: "",
                                    }));
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
                                  setCustomByDay((prev) => ({
                                    ...prev,
                                    [day.id]: "",
                                  }));
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
                  </div>
                </div>

                {!isLast ? <FlowArrow /> : null}
              </li>
            );
          })}

          {/* Return to hotel */}
          {days.length > 0 ? (
            <li className="relative">
              <FlowArrow dashed />
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="relative z-10 flex w-12 shrink-0 flex-col items-center sm:w-14">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-amber/50 text-sm text-amber sm:h-11 sm:w-11">
                    ↩
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-2">
                  <p className="text-sm text-white/50">Back to hotel</p>
                </div>
              </div>
            </li>
          ) : null}
        </ol>
      </div>
    </div>
  );
}

/** Vertical connector with a down arrow — the diagram “flow”. */
function FlowArrow({ dashed = false }: { dashed?: boolean }) {
  return (
    <div
      className="flex w-12 flex-col items-center py-1 sm:w-14"
      aria-hidden
    >
      <span
        className={`h-5 w-0.5 sm:h-6 ${
          dashed
            ? "border-l-2 border-dashed border-amber/45 bg-transparent"
            : "bg-amber/70"
        }`}
      />
      <span
        className={`text-[11px] leading-none ${
          dashed ? "text-amber/50" : "text-amber"
        }`}
      >
        ▼
      </span>
    </div>
  );
}
