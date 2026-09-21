import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MIN_YEAR = 1700;
const MAX_YEAR = 1820;

export default function CompareMapPanel({ year, onYearChange, label }) {
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/history/${year}`);
        const data = await res.json();
        if (!cancelled) setTerritories(data.territories || []);
      } catch {
        if (!cancelled) setTerritories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [year]);

  return (
    <div className="flex-1 flex flex-col min-w-0 border-stone-800">
      <div className="px-4 py-3 bg-[#14120f] border-b border-stone-800/70">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-stone-500 tracking-[0.18em] uppercase w-10">
            {label}
          </span>
          <span className="font-display text-[19px] text-amber-200/90 tabular-nums w-[52px]">
            {year}
          </span>
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            step={1}
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
            className="flex-1 cursor-pointer accent-amber-500/90"
          />
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={[20.5937, 78.9629]} zoom={4} className="w-full h-full">
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {territories.map((t) => {
            const isWeak = t.representation === "weak";
            const baseColor = t.polity?.colorHex || "#cc6633";
            return (
              <GeoJSON
                key={t._id}
                data={t.geometry}
                style={{
                  fillColor: baseColor,
                  fillOpacity: isWeak ? 0.12 : 0.5,
                  color: baseColor,
                  weight: isWeak ? 1 : 1.5,
                  opacity: isWeak ? 0.45 : 1,
                  dashArray: isWeak ? "5 5" : undefined,
                }}
              >
                <Popup>
                  <div style={{ fontFamily: "Georgia, serif", maxWidth: 200 }}>
                    <strong style={{ fontSize: 14 }}>{t.polity?.name}</strong>
                    {isWeak && (
                      <div style={{
                        fontFamily: "sans-serif", fontSize: 10.5, marginTop: 4,
                        color: "#b08050", fontStyle: "italic", lineHeight: 1.5,
                        borderLeft: "2px solid #b08050", paddingLeft: 5,
                      }}>
                        Approximate presence
                      </div>
                    )}
                    <div style={{ fontFamily: "sans-serif", fontSize: 11.5, color: "#666", marginTop: 4 }}>
                      Capital — {t.polity?.capital?.name || "Unknown"}
                    </div>
                  </div>
                </Popup>
              </GeoJSON>
            );
          })}
        </MapContainer>

        {loading && (
          <div className="absolute top-2 left-2 bg-[#14120f]/90 text-stone-400 text-[10.5px] tracking-wide px-2.5 py-1 rounded z-[1000] border border-stone-800">
            loading…
          </div>
        )}

        {!loading && territories.length === 0 && (
          <div className="absolute top-2 left-2 bg-[#14120f]/90 text-stone-500 text-[10.5px] italic px-2.5 py-1 rounded z-[1000] border border-stone-800">
            no known territories this year
          </div>
        )}
      </div>
    </div>
  );
}
