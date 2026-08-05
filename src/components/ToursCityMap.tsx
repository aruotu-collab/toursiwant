"use client";

type MapPin = {
  id: string;
  label: string;
  color: string;
  selected?: boolean;
};

type ToursCityMapProps = {
  cityLabel: string;
  stateCode?: string;
  pins: MapPin[];
  mode: "tours" | "cities";
  onSelect?: (id: string) => void;
};

function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function pinPoint(id: string, index: number, total: number) {
  const even = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const jitter = ((hash(id) % 100) / 100) * 0.35 - 0.17;
  const angle = even + jitter;
  const ring = total > 10 ? 78 + (hash(id + "r") % 55) : 90 + (hash(id + "r") % 40);
  // Round so SSR (Node) and browser float results match (avoids hydration mismatch).
  return {
    x: Number((200 + Math.cos(angle) * ring).toFixed(3)),
    y: Number((205 + Math.sin(angle) * ring * 0.92).toFixed(3)),
  };
}

/** Stylized city diagram — meetup / metro pins without needing lat-lng. */
export function ToursCityMap({
  cityLabel,
  stateCode,
  pins,
  mode,
  onSelect,
}: ToursCityMapProps) {
  const shown = pins.slice(0, 18);

  return (
    <div className="relative overflow-visible touch-manipulation px-2 py-3 sm:px-4 sm:py-4">
      <svg
        viewBox="-12 -12 424 424"
        className="mx-auto h-auto w-full max-w-md overflow-visible select-none"
        role="img"
        aria-label={`${mode === "cities" ? "USA cities" : "Tour meetups"} · ${cityLabel}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width="400" height="400" fill="#0a1520" />
        <circle cx="200" cy="200" r="168" fill="#1f4e79" opacity="0.14" />
        <circle
          cx="200"
          cy="200"
          r="120"
          fill="none"
          stroke="#ffffff20"
          strokeDasharray="5 7"
        />
        <circle
          cx="200"
          cy="200"
          r="68"
          fill="none"
          stroke="#ffffff14"
          strokeDasharray="4 6"
        />

        {/* Soft spine — echoes Near you corridor without claiming geography */}
        <path
          d="M 70 320 C 120 260, 150 220, 200 200 C 250 180, 290 120, 330 70"
          fill="none"
          stroke="#f5c542"
          strokeOpacity="0.22"
          strokeWidth="2"
          strokeDasharray="6 8"
        />

        {shown.map((pin, index) => {
          const pt = pinPoint(pin.id, index, shown.length);
          const selected = Boolean(pin.selected);
          return (
            <g
              key={pin.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className={onSelect ? "cursor-pointer" : undefined}
              onClick={() => onSelect?.(pin.id)}
            >
              {selected ? (
                <circle
                  r="16"
                  fill="none"
                  stroke={pin.color}
                  strokeOpacity="0.55"
                  strokeWidth="1.5"
                >
                  <animate
                    attributeName="r"
                    values="12;18;12"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.7;0.2;0.7"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              ) : null}
              <circle
                r={selected ? 7 : 5.5}
                fill={pin.color}
                stroke="#0a1520"
                strokeWidth="2"
              />
              <circle r={selected ? 7 : 5.5} fill={pin.color} opacity="0.35">
                <animate
                  attributeName="r"
                  values={selected ? "7;14;7" : "5.5;9;5.5"}
                  dur="2.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.35;0;0.35"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}

        <circle cx="200" cy="200" r="22" fill="#0a1520" stroke="#f5c542" strokeWidth="1.5" />
        <text
          x="200"
          y="196"
          textAnchor="middle"
          fill="#f5c542"
          fontSize="9"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.12em"
        >
          {stateCode || (mode === "cities" ? "USA" : "CITY")}
        </text>
        <text
          x="200"
          y="210"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="11"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
        >
          {cityLabel.length > 14 ? `${cityLabel.slice(0, 12)}…` : cityLabel}
        </text>
      </svg>

      {shown.length === 0 ? (
        <p className="px-4 pb-3 text-center text-xs text-white/45">
          No pins for this filter — try All types.
        </p>
      ) : null}
    </div>
  );
}
