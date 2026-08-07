"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  TemplateRouteLoop,
  type DayStop,
  type RouteNode,
} from "@/components/TemplateRouteLoop";
import {
  queriesForLabel,
  queriesForRouteNode,
  templateViatorCity,
} from "@/lib/node-tours";
import type { TripTemplate } from "@/lib/trip-templates";

const SUGGESTED_STOPS = [
  "Market",
  "Restaurant",
  "Museum",
  "Park",
  "Harbor",
  "Broadway",
  "Shopping",
  "Viewpoint",
  "Food hall",
  "Walk",
];

/** Max nested stops across the whole trip */
export const MAX_DAY_STOPS = 12;
/** Max nested stops on a single day */
export const MAX_STOPS_PER_DAY = 5;

/** @deprecated kept for imports; days aren't capped this way anymore */
export const MAX_ROUTE_NODES = MAX_DAY_STOPS;

type TourHit = {
  id: string;
  title: string;
  priceFrom?: string;
};

function newStopId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `custom:${crypto.randomUUID()}`;
  }
  return `custom:${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Number duplicate labels within one day's stops: Market, Market 2… */
export function labelForNewStop(base: string, existing: DayStop[]) {
  const clean = base.trim().slice(0, 18);
  if (!clean) return "Stop";
  const lower = clean.toLowerCase();
  const count = existing.filter((n) => {
    const l = n.label.toLowerCase();
    return l === lower || l.match(new RegExp(`^${escapeRegExp(lower)} \\d+$`));
  }).length;
  if (count === 0) return clean;
  return `${clean.slice(0, 14)} ${count + 1}`.slice(0, 18);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countAllStops(nodes: RouteNode[]) {
  return nodes.reduce((n, d) => n + (d.stops?.length || 0), 0);
}

/**
 * Combined editor: vertical day map, tours, then personalize / save.
 */
export function TripNodeEditor({
  nodes,
  template,
  onAddStop,
  onRemoveStop,
  suggestions = SUGGESTED_STOPS,
  children,
}: {
  nodes: RouteNode[];
  template: TripTemplate;
  onAddStop: (dayId: string, label: string) => void;
  onRemoveStop: (dayId: string, stopId: string) => void;
  suggestions?: string[];
  children?: ReactNode;
}) {
  const days = useMemo(() => nodes.filter((n) => n.kind === "day"), [nodes]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(
    () => days[0]?.id ?? null,
  );
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [expandedDayIds, setExpandedDayIds] = useState<string[]>([]);
  const [tours, setTours] = useState<TourHit[]>([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [tourError, setTourError] = useState<string | null>(null);
  const [tourNote, setTourNote] = useState<string | null>(null);

  const selectedDay =
    days.find((d) => d.id === selectedDayId) ||
    nodes.find((n) => n.id === selectedDayId && n.kind === "hotel") ||
    null;
  const selectedStop =
    selectedDay?.kind === "day"
      ? selectedDay.stops?.find((s) => s.id === selectedStopId) || null
      : null;

  const totalStops = countAllStops(nodes);

  useEffect(() => {
    if (!selectedDayId) return;
    if (!nodes.some((n) => n.id === selectedDayId)) {
      setSelectedDayId(days[0]?.id ?? null);
      setSelectedStopId(null);
      setExpandedDayIds([]);
      setTours([]);
    } else if (
      selectedStopId &&
      selectedDay?.kind === "day" &&
      !selectedDay.stops?.some((s) => s.id === selectedStopId)
    ) {
      setSelectedStopId(null);
    }
  }, [nodes, selectedDayId, selectedStopId, selectedDay, days]);

  useEffect(() => {
    // Drop expanded ids that no longer exist
    setExpandedDayIds((prev) =>
      prev.filter((id) => days.some((d) => d.id === id)),
    );
  }, [days]);

  useEffect(() => {
    if (!selectedDay) {
      setTours([]);
      setTourError(null);
      setTourNote(null);
      return;
    }

    const queries = selectedStop
      ? [...queriesForLabel(selectedStop.label), ""]
      : queriesForRouteNode(selectedDay, template);
    const city = templateViatorCity(template);
    const focusLabel = selectedStop?.label || selectedDay.label;
    let cancelled = false;
    setLoadingTours(true);
    setTourError(null);
    setTourNote(null);
    setTours([]);
    void (async () => {
      try {
        let products: TourHit[] = [];
        let usedQuery = queries[0] || "";
        let broadened = false;

        for (const q of queries) {
          const res = await fetch(
            `/api/affiliates/viator/search?city=${encodeURIComponent(city)}&q=${encodeURIComponent(q)}&count=6`,
          );
          const data = (await res.json()) as {
            products?: TourHit[];
            broadened?: boolean;
            message?: string;
          };
          if (cancelled) return;
          const hits = (data.products || []).slice(0, 6);
          if (hits.length) {
            products = hits;
            usedQuery = q;
            broadened = Boolean(data.broadened) || q === "";
            if (data.message) setTourNote(data.message);
            break;
          }
        }

        if (cancelled) return;
        setTours(products);
        if (!products.length) {
          setTourError(
            `No tours found for “${focusLabel}” yet — try another stop.`,
          );
        } else if (broadened && usedQuery === "") {
          setTourNote(
            `No exact match for “${focusLabel}” — showing popular tours nearby.`,
          );
        }
      } catch {
        if (!cancelled) setTourError("Could not load tours for this stop.");
      } finally {
        if (!cancelled) setLoadingTours(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDay, selectedStop, template]);

  function selectNode(node: RouteNode) {
    setSelectedDayId(node.id);
    setSelectedStopId(null);
    // Selection does not force expand/collapse
  }

  function selectStop(day: RouteNode, stop: DayStop) {
    setSelectedDayId(day.id);
    setExpandedDayIds((prev) =>
      prev.includes(day.id) ? prev : [...prev, day.id],
    );
    setSelectedStopId((prev) => (prev === stop.id ? null : stop.id));
  }

  const tourHeading = selectedStop
    ? selectedStop.label
    : selectedDay?.kind === "day"
      ? `${selectedDay.dayLabel || "Day"} · ${selectedDay.label}`
      : selectedDay?.label || "";

  return (
    <div className="border border-white/15 bg-white/[0.05]">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl">Make it yours</h2>
            <p className="mt-1 text-sm text-white/55">
              Numbers are days on the diagram. Follow the arrows, expand a day
              to add stops, then personalize and save.
            </p>
          </div>
          <p className="font-mono text-[11px] text-white/40">
            {totalStops}/{MAX_DAY_STOPS} stops
          </p>
        </div>
      </div>

      <TemplateRouteLoop
        nodes={nodes}
        interactive
        selectedNodeId={selectedDayId}
        selectedStopId={selectedStopId}
        expandedDayIds={expandedDayIds}
        onExpandedDayIdsChange={setExpandedDayIds}
        onSelectNode={selectNode}
        onSelectStop={selectStop}
        onRemoveStop={onRemoveStop}
        onAddStop={onAddStop}
        addSuggestions={suggestions}
        canAddStop={(day) =>
          totalStops < MAX_DAY_STOPS &&
          (day.stops?.length || 0) < MAX_STOPS_PER_DAY
        }
        className="h-80 w-full border-0 border-b border-white/10 sm:h-[22rem]"
      />

      {selectedDay ? (
        <div className="border-b border-amber/25 bg-amber/5 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
                {selectedStop ? "Tours for this stop" : "Tours for this day"}
              </p>
              <p className="mt-1 font-display text-lg text-white">
                {tourHeading}
              </p>
              <p className="mt-0.5 text-xs text-white/45">
                Near {templateViatorCity(template)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedStopId(null);
                if (selectedDay.kind === "hotel") {
                  setSelectedDayId(days[0]?.id ?? null);
                }
              }}
              className="text-xs text-white/50 hover:text-amber"
            >
              Close
            </button>
          </div>
          {tourNote ? (
            <p className="mt-2 text-sm text-amber/90">{tourNote}</p>
          ) : null}
          {loadingTours ? (
            <p className="mt-3 text-sm text-white/50">Loading tours…</p>
          ) : null}
          {tourError && !loadingTours ? (
            <p className="mt-3 text-sm text-white/55">{tourError}</p>
          ) : null}
          {tours.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {tours.map((p) => (
                <li key={p.id}>
                  <a
                    href={`/go/viator/${encodeURIComponent(p.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 border border-white/15 bg-black/20 px-3 py-2.5 text-sm transition hover:border-amber/50"
                  >
                    <span className="line-clamp-2 text-white/90">{p.title}</span>
                    <span className="shrink-0 font-mono text-[11px] text-amber">
                      {p.priceFrom || "View"}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {children ? (
        <div className="space-y-4 px-4 py-4 sm:px-5">{children}</div>
      ) : null}
    </div>
  );
}

export function createDayStop(
  baseLabel: string,
  existingOnDay: DayStop[],
): DayStop {
  return {
    id: newStopId(),
    label: labelForNewStop(baseLabel, existingOnDay),
  };
}

/** @deprecated use createDayStop */
export function createAddedStopNode(
  baseLabel: string,
  existing: RouteNode[],
): RouteNode {
  const flat = existing.flatMap((n) => n.stops || []);
  const stop = createDayStop(baseLabel, flat);
  return {
    id: stop.id,
    label: stop.label,
    kind: "day",
    dayLabel: "Added",
    dayIndex: existing.filter((n) => n.kind === "day").length + 1,
    stops: [],
  };
}
