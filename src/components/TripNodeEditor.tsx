"use client";

import { useState } from "react";
import {
  TemplateRouteLoop,
  type RouteNode,
} from "@/components/TemplateRouteLoop";

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

export function TripNodeEditor({
  nodes,
  onAddStop,
  onRemoveStop,
  suggestions = SUGGESTED_STOPS,
}: {
  nodes: RouteNode[];
  onAddStop: (label: string) => void;
  onRemoveStop: (id: string) => void;
  suggestions?: string[];
}) {
  const [custom, setCustom] = useState("");
  const atLimit = nodes.length >= MAX_ROUTE_NODES;
  // Unique chips even if parent passes duplicate hint names
  const chips = Array.from(new Set(suggestions.map((s) => s.trim()).filter(Boolean)));

  function add(label: string) {
    const clean = label.trim();
    if (!clean || atLimit) return;
    onAddStop(clean);
    setCustom("");
  }

  return (
    <div className="mt-6 border border-amber/25 bg-white/[0.04]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
            Trip path
          </p>
          <p className="mt-1 max-w-xl text-sm text-white/65">
            Read left to right — hotel first, then each stop. Tap × on a circle
            to remove it, or add another Market / Museum below.
          </p>
        </div>
        <p className="font-mono text-[11px] text-white/40">
          {nodes.length}/{MAX_ROUTE_NODES} stops
        </p>
      </div>

      <TemplateRouteLoop
        nodes={nodes}
        interactive
        onRemoveNode={onRemoveStop}
        className="w-full border-0"
      />

      <div className="space-y-3 border-t border-white/10 px-4 py-4 sm:px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
          Add a stop — tap the same type again for another
        </p>
        <div className="flex flex-wrap gap-2">
          {chips.map((label) => (
            <button
              key={label}
              type="button"
              disabled={atLimit}
              onClick={() => add(label)}
              className="border border-white/20 px-3 py-2 text-sm text-white/80 transition hover:border-amber hover:bg-amber/10 hover:text-amber disabled:opacity-40"
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
            placeholder="Custom stop — e.g. Chinatown"
            className="min-w-[12rem] flex-1 border border-white/20 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-amber"
          />
          <button
            type="button"
            disabled={!custom.trim() || atLimit}
            onClick={() => add(custom)}
            className="bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-50"
          >
            Add stop
          </button>
        </div>
        {atLimit ? (
          <p className="text-xs text-white/45">
            Path is full — remove a stop to add another.
          </p>
        ) : null}
      </div>
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
