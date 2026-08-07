"use client";

import { useMemo, useState } from "react";
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

  const used = useMemo(
    () => new Set(nodes.map((n) => n.label.toLowerCase())),
    [nodes],
  );

  const available = suggestions.filter((s) => !used.has(s.toLowerCase()));

  function removeNode(id: string) {
    const next = nodes.filter((n) => n.id !== id);
    // Keep at least hotel
    if (next.length === 0) return;
    if (!next.some((n) => n.kind === "hotel")) {
      onChange([{ id: "hotel", label: "Hotel", kind: "hotel" }, ...next]);
      return;
    }
    onChange(next);
  }

  function addStop(label: string) {
    const clean = label.trim();
    if (!clean) return;
    if (used.has(clean.toLowerCase())) return;
    if (nodes.length >= 6) return;
    onChange([
      ...nodes,
      {
        id: `custom:${Date.now()}_${clean.toLowerCase().replace(/\s+/g, "-")}`,
        label: clean.slice(0, 18),
        kind: "stop",
      },
    ]);
    setCustom("");
  }

  return (
    <div className="mt-6 border border-white/15 bg-white/[0.04]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
            Trip map
          </p>
          <p className="mt-1 text-sm text-white/60">
            Each circle is a stop. Remove ones you don&apos;t want, or add a
            destination — hotel stays as your start.
          </p>
        </div>
        <p className="font-mono text-[11px] text-white/40">
          {nodes.length} node{nodes.length === 1 ? "" : "s"}
        </p>
      </div>

      <TemplateRouteLoop
        nodes={nodes}
        interactive
        onRemoveNode={removeNode}
        className="h-[200px] w-full border-0"
      />

      <div className="space-y-3 border-t border-white/10 px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
          Add a stop
        </p>
        <div className="flex flex-wrap gap-2">
          {available.slice(0, 8).map((label) => (
            <button
              key={label}
              type="button"
              disabled={nodes.length >= 6}
              onClick={() => addStop(label)}
              className="border border-white/20 px-3 py-1.5 text-sm text-white/75 transition hover:border-amber hover:text-amber disabled:opacity-40"
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
            disabled={!custom.trim() || nodes.length >= 6}
            onClick={() => addStop(custom)}
            className="bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-50"
          >
            Add node
          </button>
        </div>
      </div>
    </div>
  );
}
