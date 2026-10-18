import { useMemo } from "react";

// Geographic bounds for the Indian subcontinent viewport
const MIN_LNG = 64;
const MAX_LNG = 95;
const MIN_LAT = 7;
const MAX_LAT = 36.5;

function project(lng, lat, width = 320, height = 240) {
  const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * width;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * height;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

// Simplified subcontinent coastline path
const SUBCONTINENT_COORDS = [
  [71.5, 36.0],
  [74.5, 36.5],
  [77.0, 35.0],
  [80.5, 31.0],
  [85.0, 28.5],
  [89.0, 27.8],
  [93.5, 28.5],
  [95.0, 27.5],
  [93.0, 23.5],
  [90.5, 21.5],
  [87.5, 21.8],
  [85.0, 19.5],
  [81.5, 16.0],
  [80.2, 13.0],
  [79.8, 9.8],
  [77.5, 8.1],
  [76.0, 10.0],
  [74.5, 13.5],
  [73.5, 16.5],
  [72.8, 19.5],
  [72.5, 21.5],
  [69.5, 22.0],
  [68.5, 23.8],
  [67.0, 24.8],
  [65.0, 25.5],
  [65.5, 29.5],
  [68.0, 32.5],
  [71.5, 36.0],
];

// Sri Lanka simplified polygon
const SRI_LANKA_COORDS = [
  [80.5, 9.5],
  [81.8, 8.2],
  [81.2, 6.8],
  [79.9, 7.5],
  [80.5, 9.5],
];

export default function StoryLocatorMap({
  locator,
  regionLabel,
  category = "civilisation",
  onMap = false,
  className = "",
  compact = false,
}) {
  const width = compact ? 220 : 320;
  const height = compact ? 160 : 220;

  const subcontinentPoints = useMemo(() => {
    return SUBCONTINENT_COORDS.map(([lng, lat]) => project(lng, lat, width, height)).join(" ");
  }, [width, height]);

  const sriLankaPoints = useMemo(() => {
    return SRI_LANKA_COORDS.map(([lng, lat]) => project(lng, lat, width, height)).join(" ");
  }, [width, height]);

  const highlightPoints = useMemo(() => {
    if (!locator || !locator.coordinates) return null;

    let ring = locator.coordinates;
    // Standard GeoJSON Polygon is array of rings: [[[lng, lat], ...]]
    if (Array.isArray(ring[0]) && Array.isArray(ring[0][0])) {
      ring = ring[0];
    }

    if (!Array.isArray(ring) || ring.length < 3) return null;

    return ring
      .map(([lng, lat]) => project(lng, lat, width, height))
      .join(" ");
  }, [locator, width, height]);

  // Highlight color depending on category
  const highlightColor =
    category === "war"
      ? "rgba(168, 82, 59, 0.45)"
      : category === "empire"
      ? "rgba(194, 140, 64, 0.45)"
      : category === "faith"
      ? "rgba(41, 62, 99, 0.45)"
      : category === "trade"
      ? "rgba(30, 92, 78, 0.45)"
      : "rgba(43, 84, 51, 0.45)"; // civilisation (sage green)

  const strokeColor =
    category === "war"
      ? "#A8523B"
      : category === "empire"
      ? "#C28C40"
      : category === "faith"
      ? "#293E63"
      : category === "trade"
      ? "#1E5C4E"
      : "#2B5433";

  return (
    <div
      className={`relative flex flex-col items-center rounded border border-[#D4BE98] bg-[#C5D5DF]/70 p-2 overflow-hidden select-none ${className}`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[180px] drop-shadow-xs"
        role="img"
        aria-label={`Locator map for ${regionLabel || "historical region"}`}
      >
        {/* Ocean Background is the container bg */}

        {/* Subcontinent landmass */}
        <polygon
          points={subcontinentPoints}
          fill="#EAE0CB"
          stroke="#C8B89E"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Sri Lanka */}
        <polygon
          points={sriLankaPoints}
          fill="#EAE0CB"
          stroke="#C8B89E"
          strokeWidth="1.0"
          strokeLinejoin="round"
        />

        {/* Story Region Highlight Polygon */}
        {highlightPoints && (
          <g>
            <polygon
              points={highlightPoints}
              fill={highlightColor}
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeDasharray="3 2"
              className="transition-all duration-300"
            />
            {regionLabel && (
              <text
                x={width * 0.35}
                y={height * 0.28}
                textAnchor="middle"
                fontSize={compact ? "9" : "10"}
                fontWeight="700"
                fontFamily="Inter, sans-serif"
                fill={strokeColor}
                letterSpacing="0.05em"
                className="uppercase pointer-events-none drop-shadow-xs"
              >
                {regionLabel.split(" ")[0]}
              </text>
            )}
          </g>
        )}
      </svg>

      <span className="text-[10px] text-[#7C6A52] italic mt-1 text-center font-normal tracking-tight">
        {onMap ? "On map — 1700–1820 atlas range" : "Locator map — outside the 1700 – 1820 atlas range"}
      </span>
    </div>
  );
}
