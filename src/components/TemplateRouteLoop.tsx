import type { TripTemplate } from "@/lib/trip-templates";

export type RouteNode = {
  id: string;
  label: string;
  kind: "hotel" | "stop";
  /** Linked itinerary block when derived from the template */
  blockId?: string;
};

/** Build stop nodes from a template — hotel + destinations for the loop diagram. */
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
    .filter(
      (n, i, arr) => arr.findIndex((x) => x.label === n.label) === i,
    );

  // Prefer multi-stop route string when it has real hops
  if (fromRoute.length >= 2) {
    const nodes: RouteNode[] = fromRoute.slice(0, 5).map((label, i) => ({
      id: `route:${i}:${label}`,
      label,
      kind: i === 0 && (t.hotelAnchor || looksLikeHotel(label)) ? "hotel" : "stop",
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

  // Single-phrase routes (e.g. "Midtown hotel anchor") → use day blocks as nodes
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
      { id: "route:2", label: "Return", kind: "stop" },
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

type Point = { x: number; y: number; labelY: number };

/** Stops laid out like the hand sketch: top row → right curve → bottom → dashed home. */
function layoutStops(n: number): Point[] {
  const ring: Point[] = [
    { x: 40, y: 48, labelY: 24 },
    { x: 100, y: 34, labelY: 16 },
    { x: 160, y: 34, labelY: 16 },
    { x: 210, y: 52, labelY: 28 },
    { x: 220, y: 100, labelY: 88 },
    { x: 170, y: 138, labelY: 158 },
    { x: 100, y: 142, labelY: 162 },
    { x: 40, y: 110, labelY: 130 },
  ];
  if (n <= 1) return [ring[0]];
  if (n === 2) return [ring[0], ring[3]];
  if (n === 3) return [ring[0], ring[3], ring[5]];
  if (n === 4) return [ring[0], ring[1], ring[3], ring[5]];
  if (n === 5) return [ring[0], ring[1], ring[3], ring[4], ring[5]];
  if (n === 6) return [ring[0], ring[1], ring[2], ring[3], ring[5], ring[6]];
  if (n === 7)
    return [ring[0], ring[1], ring[2], ring[3], ring[4], ring[5], ring[6]];
  return ring.slice(0, n);
}

function solidPath(points: Point[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const cx = (prev.x + cur.x) / 2;
    const cy = (prev.y + cur.y) / 2 - (i === points.length - 1 ? 0 : 4);
    d += ` Q ${cx} ${cy} ${cur.x} ${cur.y}`;
  }
  return d;
}

function returnPath(points: Point[]) {
  if (points.length < 2) return "";
  const first = points[0];
  const last = points[points.length - 1];
  const cx = Math.min(first.x, last.x) - 10;
  const cy = (first.y + last.y) / 2 + 22;
  return `M ${last.x} ${last.y} Q ${cx} ${cy} ${first.x} ${first.y}`;
}

export function TemplateRouteLoop({
  template,
  nodes: nodesProp,
  className = "",
  interactive = false,
  onRemoveNode,
}: {
  template?: TripTemplate;
  nodes?: RouteNode[];
  className?: string;
  interactive?: boolean;
  onRemoveNode?: (id: string) => void;
}) {
  const nodes =
    nodesProp ||
    (template ? getTemplateRouteNodes(template) : []);
  const points = layoutStops(Math.max(nodes.length, 1));
  const solid = solidPath(points.slice(0, nodes.length));
  const dashed = returnPath(points.slice(0, nodes.length));

  return (
    <div
      className={`route-loop relative overflow-hidden border border-white/10 bg-[radial-gradient(ellipse_at_25%_15%,rgba(212,160,23,0.16),transparent_50%),linear-gradient(165deg,#0a1520_0%,#152433_55%,#0f1c28_100%)] ${className}`}
      aria-hidden={!interactive}
    >
      <svg
        viewBox="0 0 260 180"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={solid}
          fill="none"
          stroke="rgba(212,160,23,0.7)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="route-loop-solid"
        />
        <path
          d={dashed}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="5 4"
          className="route-loop-return"
        />
        {nodes.map((node, i) => {
          const p = points[i];
          if (!p) return null;
          const isHotel = node.kind === "hotel" || i === 0;
          const r = isHotel ? 14 : 12;
          return (
            <g key={node.id}>
              {/* Outer ring — reads as a node */}
              <circle
                cx={p.x}
                cy={p.y}
                r={r + 5}
                fill="none"
                stroke={
                  isHotel
                    ? "rgba(212,160,23,0.5)"
                    : "rgba(243,239,230,0.28)"
                }
                strokeWidth="1.4"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={isHotel ? "#d4a017" : "#f3efe6"}
                stroke={isHotel ? "#f3efe6" : "rgba(212,160,23,0.95)"}
                strokeWidth="1.8"
              />
              {/* Tiny center dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={2.8}
                fill={isHotel ? "#0a1520" : "#d4a017"}
              />
              <text
                x={p.x}
                y={p.labelY}
                textAnchor="middle"
                fill="rgba(243,239,230,0.95)"
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-body), Georgia, serif",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                }}
              >
                {node.label}
              </text>
              {interactive && !isHotel && onRemoveNode ? (
                <g
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveNode(node.id);
                  }}
                  role="button"
                  aria-label={`Remove ${node.label}`}
                >
                  <circle
                    cx={p.x + r + 4}
                    cy={p.y - r - 4}
                    r={9}
                    fill="#0a1520"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.2"
                  />
                  <text
                    x={p.x + r + 4}
                    y={p.y - r + 0.5}
                    textAnchor="middle"
                    fill="rgba(243,239,230,0.9)"
                    style={{ fontSize: "11px", fontWeight: 700 }}
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
  );
}
