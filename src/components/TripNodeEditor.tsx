"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  TemplateRouteLoop,
  type RouteNode,
} from "@/components/TemplateRouteLoop";
import {
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

export const MAX_ROUTE_NODES = 12;

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

/** Number duplicate labels: Market, Market 2, Market 3… */
export function labelForNewStop(base: string, nodes: RouteNode[]) {
  const clean = base.trim().slice(0, 18);
  if (!clean) return "Stop";
  const lower = clean.toLowerCase();
  const count = nodes.filter((n) => {
    const l = n.label.toLowerCase();
    return l === lower || l.match(new RegExp(`^${escapeRegExp(lower)} \\d+$`));
  }).length;
  if (count === 0) return clean;
  return `${clean.slice(0, 14)} ${count + 1}`.slice(0, 18);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Combined day-path editor: path first, then add stops, tours, then
 * personalize / save (via children).
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
  onAddStop: (label: string) => void;
  onRemoveStop: (id: string) => void;
  suggestions?: string[];
  children?: ReactNode;
}) {
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<RouteNode | null>(null);
  const [tours, setTours] = useState<TourHit[]>([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [tourError, setTourError] = useState<string | null>(null);
  const [tourNote, setTourNote] = useState<string | null>(null);

  const atLimit = nodes.length >= MAX_ROUTE_NODES;
  const chips = Array.from(
    new Set(suggestions.map((s) => s.trim()).filter(Boolean)),
  );

  useEffect(() => {
    if (!selected) return;
    if (!nodes.some((n) => n.id === selected.id)) {
      setSelected(null);
      setTours([]);
    }
  }, [nodes, selected]);

  useEffect(() => {
    if (!selected) {
      setTours([]);
      setTourError(null);
      setTourNote(null);
      return;
    }
    const queries = queriesForRouteNode(selected, template);
    const city = templateViatorCity(template);
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
            `No tours found for “${selected.label}” yet — try another stop.`,
          );
        } else if (broadened && usedQuery === "") {
          setTourNote(
            `No exact match for “${selected.label}” — showing popular tours nearby.`,
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
  }, [selected, template]);

  function add(label: string) {
    const clean = label.trim();
    if (!clean || atLimit) return;
    onAddStop(clean);
    setCustom("");
  }

  function selectNode(node: RouteNode) {
    setSelected((prev) => (prev?.id === node.id ? null : node));
  }

  return (
    <div className="border border-white/15 bg-white/[0.05]">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl">Make it yours</h2>
            <p className="mt-1 text-sm text-white/55">
              Shape the day path, add stops, personalize flexible days — then
              save.
            </p>
          </div>
          <p className="font-mono text-[11px] text-white/40">
            {nodes.length}/{MAX_ROUTE_NODES}
          </p>
        </div>
      </div>

      {/* 1 · Your day path first */}
      <TemplateRouteLoop
        nodes={nodes}
        interactive
        selectedNodeId={selected?.id ?? null}
        onRemoveNode={onRemoveStop}
        onSelectNode={selectNode}
        className="w-full border-0 border-b border-white/10"
      />

      {/* 2 · Add stops */}
      <div className="space-y-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
          Add a stop
        </p>
        <div className="flex flex-wrap gap-2">
          {chips.map((label) => (
            <button
              key={label}
              type="button"
              disabled={atLimit}
              onClick={() => add(label)}
              className="border border-white/20 px-2.5 py-1.5 text-xs text-white/80 transition hover:border-amber hover:bg-amber/10 hover:text-amber disabled:opacity-40 sm:text-sm"
            >
              + {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(custom);
              }
            }}
            placeholder="Custom — e.g. Chinatown"
            className="min-w-[10rem] flex-1 border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <button
            type="button"
            disabled={!custom.trim() || atLimit}
            onClick={() => add(custom)}
            className="bg-amber px-3 py-2 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {selected ? (
        <div className="border-b border-amber/25 bg-amber/5 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
                Tours for this stop
              </p>
              <p className="mt-1 font-display text-lg text-white">
                {selected.label}
              </p>
              <p className="mt-0.5 text-xs text-white/45">
                Near {templateViatorCity(template)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
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

      {/* 3 · Personalize + save (from parent) */}
      {children ? (
        <div className="space-y-4 px-4 py-4 sm:px-5">{children}</div>
      ) : null}
    </div>
  );
}

export function createAddedStopNode(
  baseLabel: string,
  existing: RouteNode[],
): RouteNode {
  const id = newStopId();
  return {
    id,
    label: labelForNewStop(baseLabel, existing),
    kind: "stop",
    blockId: `added_${id.replace(/[^a-zA-Z0-9]+/g, "_")}`,
  };
}
