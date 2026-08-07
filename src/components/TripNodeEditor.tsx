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

const MAX_NODES = 8;

function nextLabel(base: string, nodes: RouteNode[]) {
  const clean = base.trim();
  const lower = clean.toLowerCase();
  const same = nodes.filter(
    (n) =>
      n.label.toLowerCase() === lower ||
      n.label.toLowerCase().startsWith(`${lower} `),
  ).length;
  if (same === 0) return clean.slice(0, 18);
  return `${clean.slice(0, 14)} ${same + 1}`.slice(0, 18);
}

export function TripNodeEditor({
  nodes,
  onChange,
  suggestions = SUGGESTED_STOPS,
}: {
  nodes: RouteNode[];
  onChange: (nodes: RouteNode[]) => void;
  suggestions?: string[];
}) {
  const [custom, setCustom] = useState("");
  const atLimit = nodes.length >= MAX_NODES;

  function removeNode(id: string) {
    const target = nodes.find((n) => n.id === id);
    if (!target || target.kind === "hotel") return;
    const next = nodes.filter((n) => n.id !== id);
    if (!next.some((n) => n.kind === "hotel")) {
      onChange([{ id: "hotel", label: "Hotel", kind: "hotel" }, ...next]);
      return;
    }
    onChange(next);
  }

  function addStop(label: string) {
    const clean = label.trim();
    if (!clean || atLimit) return;
    const display = nextLabel(clean, nodes);
    onChange([
      ...nodes,
      {
        id: `custom:${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: display,
        kind: "stop",
      },
    ]);
    setCustom("");
  }

  return (
    <div className="mt-6 border border-amber/25 bg-white/[0.04]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
            Trip map
          </p>
          <p className="mt-1 max-w-xl text-sm text-white/65">
            Circles are stops. Add as many markets or museums as you want —
            hotel stays put. Personalize still works on flexible days below.
          </p>
        </div>
        <p className="font-mono text-[11px] text-white/40">
          {nodes.length}/{MAX_NODES} stops
        </p>
      </div>

      <TemplateRouteLoop
        nodes={nodes}
        interactive
        onRemoveNode={removeNode}
        className="h-[240px] w-full border-0 sm:h-[280px]"
      />

      {/* Easy edit list — clearer than tiny SVG × alone */}
      <ul className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
        {nodes.map((node, i) => (
          <li
            key={node.id}
            className={`flex items-center gap-2 border px-3 py-2 text-sm ${
              node.kind === "hotel"
                ? "border-amber/40 bg-amber/15 text-amber"
                : "border-white/20 bg-black/20 text-white/85"
            }`}
          >
            <span className="font-mono text-[10px] text-white/40">{i + 1}</span>
            <span className="font-medium">{node.label}</span>
            {node.kind === "hotel" ? (
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber/70">
                start
              </span>
            ) : (
              <button
                type="button"
                onClick={() => removeNode(node.id)}
                className="ml-1 text-white/45 hover:text-amber"
                aria-label={`Remove ${node.label}`}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-white/10 px-4 py-4 sm:px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
          Add another stop
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((label) => (
            <button
              key={label}
              type="button"
              disabled={atLimit}
              onClick={() => addStop(label)}
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
                addStop(custom);
              }
            }}
            placeholder="Custom stop — e.g. Chinatown"
            className="min-w-[12rem] flex-1 border border-white/20 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-amber"
          />
          <button
            type="button"
            disabled={!custom.trim() || atLimit}
            onClick={() => addStop(custom)}
            className="bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-50"
          >
            Add node
          </button>
        </div>
        {atLimit ? (
          <p className="text-xs text-white/45">
            Map is full — remove a stop to add another.
          </p>
        ) : null}
      </div>
    </div>
  );
}
