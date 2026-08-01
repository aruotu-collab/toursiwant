"use client";

type RadialSpot = {
  id: string;
  name: string;
  walkMinutes: number;
  lat: number;
  lng: number;
  selected?: boolean;
};

type UsaRadialMapProps = {
  stayName: string;
  stayLat: number;
  stayLng: number;
  metro: string;
  spots: RadialSpot[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

/** Simple stay-centered map for non-NYC (and USA-wide) discovery. */
export function UsaRadialMap({
  stayName,
  stayLat,
  stayLng,
  metro,
  spots,
  selectedId,
  onSelect,
}: UsaRadialMapProps) {
  const maxWalk = Math.max(10, ...spots.map((s) => s.walkMinutes), 1);

  function project(lat: number, lng: number) {
    // Local tangent approximation around stay
    const xMeters =
      (lng - stayLng) * 85000 * Math.cos((stayLat * Math.PI) / 180);
    const yMeters = (lat - stayLat) * 110000;
    const scale = 120 / (maxWalk * 80);
    return {
      x: Math.max(36, Math.min(364, 200 + xMeters * scale)),
      y: Math.max(48, Math.min(352, 200 - yMeters * scale)),
    };
  }

  return (
    <div className="relative overflow-visible touch-manipulation px-2 py-3 sm:px-4 sm:py-4">
      <svg
        viewBox="-16 -16 432 432"
        className="mx-auto h-auto w-full max-w-md overflow-visible select-none"
        role="img"
        aria-label={`Local map around ${stayName} in ${metro}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width="400" height="400" fill="#0a1520" />
        <circle cx="200" cy="200" r="160" fill="#1f4e79" opacity="0.12" />
        <circle
          cx="200"
          cy="200"
          r="110"
          fill="none"
          stroke="#ffffff22"
          strokeDasharray="4 6"
        />
        <circle
          cx="200"
          cy="200"
          r="60"
          fill="none"
          stroke="#ffffff18"
          strokeDasharray="4 6"
        />

        {spots.slice(0, 18).map((spot) => {
          const pt = project(spot.lat, spot.lng);
          const selected = selectedId === spot.id;
          return (
            <g
              key={spot.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer"
              onClick={() => onSelect?.(spot.id)}
            >
              <circle r="12" fill="transparent" />
              <rect
                x="-5"
                y="-5"
                width="10"
                height="10"
                fill={selected ? "#d4a017" : "#f97316"}
                stroke={selected ? "#fff" : "none"}
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        <g transform="translate(200, 200)">
          <circle r="16" fill="#d4a017" opacity="0.2" />
          <rect
            x="-7"
            y="-7"
            width="14"
            height="14"
            fill="#d4a017"
            transform="rotate(45)"
            stroke="#0a1520"
            strokeWidth="2"
          />
          <text
            y="28"
            textAnchor="middle"
            fill="#d4a017"
            fontSize="10"
            fontFamily="ui-monospace, monospace"
            fontWeight="700"
          >
            YOU
          </text>
        </g>

        <text
          x="20"
          y="28"
          fill="#d4a017"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
        >
          {metro.toUpperCase()}
        </text>
        <text
          x="20"
          y="48"
          fill="#ffffff88"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          Local map · walk distances
        </text>
      </svg>
    </div>
  );
}
