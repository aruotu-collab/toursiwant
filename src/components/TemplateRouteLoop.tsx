import type { TripTemplate } from "@/lib/trip-templates";

export type RouteNode = {
  id: string;
  label: string;
  kind: "hotel" | "stop";
  /** Linked itinerary block when derived from the template */
  blockId?: string;
};

/** Build stop nodes from a template — hotel + destinations for the journey strip. */
export function getTemplateRouteNodes(t: TripTemplate): RouteNode[] {
  const fromRoute = t.route
    .split(/→|->|—|–/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(shortenStop);

  const fromBlocks = t.blocks
    .filter((b) => b.kind === "anchor" || !/flexible/i.test(b.title))
    .map((b) => ({
      id: `block:${b.id}`,
      label: shortenStop(b.title),
      kind: "stop" as const,
      blockId: b.id,
    }))
    .filter((n, i, arr) => arr.findIndex((x) => x.label === n.label) === i);

  if (fromRoute.length >= 2) {
    const nodes: RouteNode[] = fromRoute.slice(0, 5).map((label, i) => ({
      id: `route:${i}:${label}`,
      label,
      kind:
        i === 0 && (t.hotelAnchor || looksLikeHotel(label)) ? "hotel" : "stop",
    }));
    if (t.hotelAnchor && nodes[0]?.kind !== "hotel") {
      return [
        {
          id: "hotel",
          label: shortenStop(t.hotelAnchor.name) || "Hotel",
          kind: "hotel",
        },
        ...nodes.slice(0, 4),
      ];
    }
    if (nodes[0]) nodes[0] = { ...nodes[0], kind: "hotel" };
    return nodes;
  }

  if (t.hotelAnchor || fromBlocks.length >= 1) {
    const hotelLabel = t.hotelAnchor
      ? shortenStop(t.hotelAnchor.name) || "Hotel"
      : "Hotel";
    const rest = fromBlocks
      .filter((n) => !looksLikeHotel(n.label))
      .slice(0, 4);
    return [
      { id: "hotel", label: hotelLabel, kind: "hotel" },
      ...rest,
    ];
  }

  if (fromBlocks.length >= 2) {
    return fromBlocks.slice(0, 5).map((n, i) =>
      i === 0 ? { ...n, kind: "hotel" as const, id: "hotel" } : n,
    );
  }

  if (fromRoute.length === 1) {
    return [
      { id: "hotel", label: "Hotel", kind: "hotel" },
      { id: "route:1", label: fromRoute[0], kind: "stop" },
      { id: "route:2", label: "Explore", kind: "stop" },
    ];
  }

  return [
    { id: "hotel", label: "Hotel", kind: "hotel" },
    { id: "stop:explore", label: "Explore", kind: "stop" },
    { id: "stop:return", label: "Return", kind: "stop" },
  ];
}

/** @deprecated use getTemplateRouteNodes */
export function getTemplateRouteStops(t: TripTemplate): string[] {
  return getTemplateRouteNodes(t).map((n) => n.label);
}

function looksLikeHotel(label: string) {
  return /hotel|stay|resort|inn\b|anchor/i.test(label);
}

function shortenStop(raw: string) {
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
  if (s.length <= 14) return s || "Stop";

  const words = s.split(" ");
  if (words.length >= 2 && words.slice(0, 2).join(" ").length <= 16) {
    return words.slice(0, 2).join(" ");
  }
  return `${s.slice(0, 12).trim()}…`;
}

/**
 * Simple left-to-right journey strip — easier to read than an oval map.
 * Hotel → stop → stop → …  then a soft “back to hotel” cue.
 */
export function TemplateRouteLoop({
  template,
  nodes: nodesProp,
  className = "",
  interactive = false,
  selectedNodeId = null,
  onRemoveNode,
  onSelectNode,
}: {
  template?: TripTemplate;
  nodes?: RouteNode[];
  className?: string;
  interactive?: boolean;
  selectedNodeId?: string | null;
  onRemoveNode?: (id: string) => void;
  onSelectNode?: (node: RouteNode) => void;
}) {
  const nodes =
    nodesProp || (template ? getTemplateRouteNodes(template) : []);

  return (
    <div
      className={`route-loop relative overflow-hidden border border-white/10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,160,23,0.14),transparent_55%),linear-gradient(165deg,#0a1520_0%,#152433_55%,#0f1c28_100%)] ${className}`}
    >
      <div className="flex h-full min-h-[7.5rem] flex-col justify-center px-4 py-5 sm:px-6">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
          Your day path
          {onSelectNode ? (
            <span className="ml-2 font-sans text-[11px] normal-case tracking-normal text-white/45">
              · tap a circle for tours
            </span>
          ) : null}
        </p>
        <ol className="flex flex-wrap items-center gap-y-4">
          {nodes.map((node, i) => {
            const isHotel = node.kind === "hotel" || i === 0;
            const selected = selectedNodeId === node.id;
            const circle = (
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition sm:h-12 sm:w-12 ${
                  selected
                    ? "scale-110 border-amber bg-amber text-ink shadow-[0_0_0_3px_rgba(212,160,23,0.35)]"
                    : isHotel
                      ? "border-paper bg-amber text-ink"
                      : "border-amber bg-paper text-ink"
                } ${onSelectNode ? "cursor-pointer hover:scale-105" : ""}`}
              >
                {i + 1}
              </span>
            );
            return (
              <li key={node.id} className="flex items-center">
                {i > 0 ? (
                  <span
                    className="mx-1.5 h-0.5 w-5 shrink-0 rounded-full bg-amber/70 sm:mx-2 sm:w-7"
                    aria-hidden
                  />
                ) : null}
                <div className="relative flex flex-col items-center gap-1.5">
                  {interactive && !isHotel && onRemoveNode ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveNode(node.id);
                      }}
                      className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-ink text-[11px] leading-none text-white/80 hover:border-amber hover:text-amber"
                      aria-label={`Remove ${node.label}`}
                    >
                      ×
                    </button>
                  ) : null}
                  {onSelectNode ? (
                    <button
                      type="button"
                      onClick={() => onSelectNode(node)}
                      className="flex flex-col items-center gap-1.5"
                      aria-pressed={selected}
                      aria-label={`Show tours for ${node.label}`}
                    >
                      {circle}
                      <span
                        className={`max-w-[4.75rem] text-center text-[11px] leading-tight sm:text-xs ${
                          selected
                            ? "font-semibold text-amber"
                            : isHotel
                              ? "font-semibold text-amber"
                              : "text-white/85"
                        }`}
                      >
                        {node.label}
                      </span>
                    </button>
                  ) : (
                    <>
                      {circle}
                      <span
                        className={`max-w-[4.75rem] text-center text-[11px] leading-tight sm:text-xs ${
                          isHotel
                            ? "font-semibold text-amber"
                            : "text-white/85"
                        }`}
                      >
                        {node.label}
                      </span>
                    </>
                  )}
                </div>
              </li>
            );
          })}
          {nodes.length > 1 ? (
            <li className="flex items-center pl-1 sm:pl-2">
              <span
                className="mx-1.5 h-0.5 w-5 shrink-0 rounded-full border-t border-dashed border-white/40 bg-transparent sm:w-6"
                aria-hidden
              />
              <div className="flex flex-col items-center gap-1.5 opacity-70">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-amber/50 text-[10px] text-amber">
                  ↩
                </span>
                <span className="max-w-[4.5rem] text-center text-[10px] leading-tight text-white/50">
                  back to hotel
                </span>
              </div>
            </li>
          ) : null}
        </ol>
      </div>
    </div>
  );
}
