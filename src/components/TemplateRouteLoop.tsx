import type { TripTemplate } from "@/lib/trip-templates";

/** Short stop labels for the route-loop sketch on template cards. */
export function getTemplateRouteStops(t: TripTemplate): string[] {
  const fromRoute = t.route
    .split(/→|->|—|–/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(shortenStop);

  if (fromRoute.length >= 2) {
    const stops = fromRoute.slice(0, 5);
    if (t.hotelAnchor && !looksLikeHotel(stops[0])) {
      return ["Hotel", ...stops.slice(0, 4)];
    }
    return stops;
  }

  const fromBlocks = t.blocks
    .filter((b) => b.kind === "anchor" || !/flexible/i.test(b.title))
    .map((b) => shortenStop(b.title))
    .filter((label, i, arr) => arr.indexOf(label) === i)
    .slice(0, 5);

  if (t.hotelAnchor) {
    const rest = fromBlocks.filter((s) => !looksLikeHotel(s)).slice(0, 4);
    return ["Hotel", ...rest];
  }

  if (fromBlocks.length >= 2) return fromBlocks;
  if (fromRoute.length === 1) return [fromRoute[0], "Explore", "Return"];
  return ["Start", "Explore", "Return"];
}

function looksLikeHotel(label: string) {
  return /hotel|stay|resort|inn\b/i.test(label);
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
    .replace(/^Leave the /i, "")
    .trim();

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
    { x: 36, y: 36, labelY: 22 },
    { x: 110, y: 28, labelY: 14 },
    { x: 178, y: 36, labelY: 22 },
    { x: 192, y: 82, labelY: 72 },
    { x: 128, y: 118, labelY: 134 },
    { x: 58, y: 112, labelY: 128 },
  ];
  if (n <= 1) return [ring[0]];
  if (n === 2) return [ring[0], ring[2]];
  if (n === 3) return [ring[0], ring[2], ring[4]];
  if (n === 4) return [ring[0], ring[1], ring[2], ring[4]];
  if (n === 5) return [ring[0], ring[1], ring[2], ring[3], ring[4]];
  return ring.slice(0, n);
}

function solidPath(points: Point[]) {
  if (points.length < 2) return "";
  // Soft polyline with mid control points so it feels sketched, not rigid
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
  const cx = Math.min(first.x, last.x) - 8;
  const cy = (first.y + last.y) / 2 + 18;
  return `M ${last.x} ${last.y} Q ${cx} ${cy} ${first.x} ${first.y}`;
}

export function TemplateRouteLoop({
  template,
  className = "",
}: {
  template: TripTemplate;
  className?: string;
}) {
  const stops = getTemplateRouteStops(template);
  const points = layoutStops(stops.length);
  const solid = solidPath(points);
  const dashed = returnPath(points);

  return (
    <div
      className={`route-loop relative overflow-hidden border border-white/10 bg-[radial-gradient(ellipse_at_25%_15%,rgba(212,160,23,0.14),transparent_50%),linear-gradient(165deg,#0a1520_0%,#152433_55%,#0f1c28_100%)] ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 220 150"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={solid}
          fill="none"
          stroke="rgba(212,160,23,0.65)"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="route-loop-solid"
        />
        <path
          d={dashed}
          fill="none"
          stroke="rgba(255,255,255,0.38)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="5 4"
          className="route-loop-return"
        />
        {points.map((p, i) => (
          <g key={`${stops[i]}-${i}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={i === 0 ? 5 : 3.6}
              fill={i === 0 ? "#d4a017" : "#f3efe6"}
              stroke={i === 0 ? "#f3efe6" : "rgba(212,160,23,0.75)"}
              strokeWidth="1.25"
            />
            <text
              x={p.x}
              y={p.labelY}
              textAnchor="middle"
              fill="rgba(243,239,230,0.88)"
              style={{
                fontSize: "9.5px",
                fontFamily: "var(--font-body), Georgia, serif",
                fontWeight: 500,
                letterSpacing: "0.01em",
              }}
            >
              {stops[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
