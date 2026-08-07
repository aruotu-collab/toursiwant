import type { TripTemplate } from "@/lib/trip-templates";

/** A place inside a day (Museum, Market, …). */
export type DayStop = {
  id: string;
  label: string;
};

/**
 * Path nodes: hotel + one node per itinerary day.
 * Numbers on the strip are day numbers — not arbitrary stops.
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

  // Legacy: flat hotel + stops — nest orphan/added stops on day 1
  const legacyStops = nodes.filter(
    (n) =>
      n.kind !== "hotel" &&
      (String(n.blockId || "").startsWith("added_") ||
        String(n.id).startsWith("custom:") ||
        n.kind === "stop"),
  );
  // Prefer truly custom adds; if everything was a flat stop list without days,
  // only keep ones that look user-added so we don't duplicate template day titles as stops
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

/**
 * Journey strip: Hotel → Day 1 → Day 2 → Day 3.
 * Circle numbers are day indexes only.
 */
export function TemplateRouteLoop({
  template,
  nodes: nodesProp,
  className = "",
  interactive = false,
  selectedNodeId = null,
  selectedStopId = null,
  onSelectNode,
  onSelectStop,
  onRemoveStop,
}: {
  template?: TripTemplate;
  nodes?: RouteNode[];
  className?: string;
  interactive?: boolean;
  selectedNodeId?: string | null;
  selectedStopId?: string | null;
  onSelectNode?: (node: RouteNode) => void;
  onSelectStop?: (day: RouteNode, stop: DayStop) => void;
  /** Remove a nested stop: (dayId, stopId) */
  onRemoveStop?: (dayId: string, stopId: string) => void;
}) {
  const nodes =
    nodesProp || (template ? getTemplateRouteNodes(template) : []);
  const hotel = nodes.find((n) => n.kind === "hotel");
  const days = nodes.filter((n) => n.kind === "day");

  return (
    <div
      className={`route-loop relative overflow-hidden border border-white/10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,160,23,0.14),transparent_55%),linear-gradient(165deg,#0a1520_0%,#152433_55%,#0f1c28_100%)] ${className}`}
    >
      <div className="flex h-full min-h-[8.5rem] flex-col justify-center px-4 py-5 sm:px-6">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
          Your days
          {onSelectNode ? (
            <span className="ml-2 font-sans text-[11px] normal-case tracking-normal text-white/45">
              · tap a day · add stops under it
            </span>
          ) : null}
        </p>
        <ol className="flex flex-wrap items-start gap-y-4">
          {hotel ? (
            <li className="flex items-start">
              <DayCircle
                node={hotel}
                numberLabel="H"
                isHotel
                selected={selectedNodeId === hotel.id && !selectedStopId}
                onSelectNode={onSelectNode}
              />
            </li>
          ) : null}

          {days.map((day, i) => {
            const num = day.dayIndex ?? i + 1;
            const selected =
              selectedNodeId === day.id && !selectedStopId;
            return (
              <li key={day.id} className="flex items-start">
                <span
                  className="mx-1.5 mt-5 h-0.5 w-5 shrink-0 rounded-full bg-amber/70 sm:mx-2 sm:w-7"
                  aria-hidden
                />
                <div className="flex flex-col items-center gap-1.5">
                  <DayCircle
                    node={day}
                    numberLabel={String(num)}
                    selected={selected}
                    onSelectNode={onSelectNode}
                    dayCaption={day.dayLabel}
                  />
                  {day.stops && day.stops.length > 0 ? (
                    <ul className="mt-1 flex max-w-[7.5rem] flex-col items-center gap-1">
                      {day.stops.map((stop) => {
                        const stopSelected =
                          selectedNodeId === day.id &&
                          selectedStopId === stop.id;
                        return (
                          <li key={stop.id} className="relative w-full">
                            {interactive && onRemoveStop ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onRemoveStop(day.id, stop.id);
                                }}
                                className="absolute -right-1 -top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-white/30 bg-ink text-[9px] leading-none text-white/80 hover:border-amber hover:text-amber"
                                aria-label={`Remove ${stop.label}`}
                              >
                                ×
                              </button>
                            ) : null}
                            {onSelectStop ? (
                              <button
                                type="button"
                                onClick={() => onSelectStop(day, stop)}
                                className={`w-full truncate border px-1.5 py-0.5 text-[10px] leading-tight transition ${
                                  stopSelected
                                    ? "border-amber bg-amber/20 text-amber"
                                    : "border-white/15 text-white/70 hover:border-amber/50"
                                }`}
                              >
                                {stop.label}
                              </button>
                            ) : (
                              <span className="block w-full truncate border border-white/10 px-1.5 py-0.5 text-center text-[10px] text-white/60">
                                {stop.label}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              </li>
            );
          })}

          {days.length > 0 ? (
            <li className="flex items-start pl-1 sm:pl-2">
              <span
                className="mx-1.5 mt-5 h-0.5 w-5 shrink-0 rounded-full border-t border-dashed border-white/40 bg-transparent sm:w-6"
                aria-hidden
              />
              <div className="mt-1 flex flex-col items-center gap-1.5 opacity-70">
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

function DayCircle({
  node,
  numberLabel,
  isHotel = false,
  selected,
  onSelectNode,
  dayCaption,
}: {
  node: RouteNode;
  numberLabel: string;
  isHotel?: boolean;
  selected: boolean;
  onSelectNode?: (node: RouteNode) => void;
  dayCaption?: string;
}) {
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
      {numberLabel}
    </span>
  );

  const label = (
    <>
      {dayCaption ? (
        <span className="font-mono text-[9px] uppercase tracking-wider text-amber/80">
          {dayCaption}
        </span>
      ) : null}
      <span
        className={`max-w-[5rem] text-center text-[11px] leading-tight sm:text-xs ${
          selected
            ? "font-semibold text-amber"
            : isHotel
              ? "font-semibold text-amber"
              : "text-white/85"
        }`}
      >
        {node.label}
      </span>
    </>
  );

  if (onSelectNode) {
    return (
      <button
        type="button"
        onClick={() => onSelectNode(node)}
        className="flex flex-col items-center gap-1"
        aria-pressed={selected}
        aria-label={
          isHotel
            ? `Hotel ${node.label}`
            : `${dayCaption || "Day"}: ${node.label}`
        }
      >
        {circle}
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {circle}
      {label}
    </div>
  );
}
