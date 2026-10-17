import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchApi } from "../utils/api";

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
        const data = await fetchApi(`/history/${year}`, {}, 1, 15000);
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

  const sliderProgress = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF5EB]">
      {/* Top Header */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-[#FAF5EB] border-b border-[#D4BE98] shadow-xs shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 shrink-0">
            <span className="text-[10px] text-[#7C6A52] tracking-[0.18em] uppercase font-semibold">
              {label}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-[20px] sm:text-[22px] font-bold text-[#A8523B] tabular-nums leading-none">
                {year}
              </span>
              <span className="text-[9.5px] font-semibold text-[#7C6A52] uppercase">
                CE
              </span>
            </div>
          </div>
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            step={1}
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
            style={{
              background: `linear-gradient(to right, #A8523B 0%, #A8523B ${sliderProgress}%, #D4BE98 ${sliderProgress}%, #D4BE98 100%)`,
            }}
            className="timeline-slider flex-1 w-full"
            aria-label={`${label} timeline slider`}
          />
        </div>
      </div>

      <div className="flex-1 relative bg-[#0E1112]">
        <MapContainer center={[20.5937, 78.9629]} zoom={4} className="w-full h-full">
          <TileLayer
            className="heritage-dark-tiles"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {territories.map((t) => {
            const isWeak = t.representation === "weak";
            const baseColor = t.polity?.colorHex || "#C28C40";
            return (
              <GeoJSON
                key={t._id}
                data={t.geometry}
                style={{
                  fillColor: baseColor,
                  fillOpacity: isWeak ? 0.14 : 0.5,
                  color: baseColor,
                  weight: isWeak ? 1 : 1.5,
                  opacity: isWeak ? 0.45 : 1,
                  dashArray: isWeak ? "5 5" : undefined,
                }}
              >
                <Popup>
                  <div className="p-1 max-w-[200px]">
                    <div className="font-serif text-[15px] font-bold text-[#34291F]">
                      {t.polity?.name}
                    </div>
                    {isWeak && (
                      <div className="text-[10.5px] text-[#A8523B] italic mt-1 leading-tight">
                        Approximate presence
                      </div>
                    )}
                    <div className="text-[11.5px] text-[#7C6A52] mt-1.5">
                      Capital — <span className="text-[#34291F] font-medium">{t.polity?.capital?.name || "Unknown"}</span>
                    </div>
                  </div>
                </Popup>
              </GeoJSON>
            );
          })}
        </MapContainer>

        {loading && (
          <div className="absolute top-3 left-3 bg-[#FAF5EB]/95 text-[#A8523B] text-[11px] font-medium tracking-wide px-2.5 py-1 rounded-md z-[1000] border border-[#D4BE98] shadow-sm">
            Loading {year} CE…
          </div>
        )}

        {!loading && territories.length === 0 && (
          <div className="absolute top-3 left-3 bg-[#FAF5EB]/95 text-[#7C6A52] text-[11px] italic px-2.5 py-1 rounded-md z-[1000] border border-[#D4BE98] shadow-sm">
            No known territories this year
          </div>
        )}
      </div>
    </div>
  );
}
