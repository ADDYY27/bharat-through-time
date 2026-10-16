import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup, CircleMarker, Marker, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LayerControl from "./LayerControl";
import SearchBox from "./SearchBox";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const EVENT_WINDOW = 18;

// Antique diamond city marker with sandstone core and indigo ring
const cityIcon = L.divIcon({
  className: "custom-city-icon",
  html: `<div style="width:9px;height:9px;background:#FAF5EB;border:1.5px solid #293E63;transform:rotate(45deg);box-shadow:0 0 4px rgba(0,0,0,0.6);"></div>`,
  iconSize: [9, 9],
  iconAnchor: [4.5, 4.5],
});

// Indian Heritage palette for events
const EVENT_COLORS = {
  battle: "#A8523B", // terracotta
  treaty: "#293E63", // indigo
  succession: "#7C6A52", // muted brown
  founding: "#4D6B53", // antique green
  conquest: "#C28C40", // ochre
  other: "#7C6A52",
};

// Sub-component: watches mapFlyTo prop and calls map.flyTo when it changes
function MapController({ mapFlyTo }) {
  const map = useMap();
  const prevTs = useRef(null);
  useEffect(() => {
    if (!mapFlyTo || !mapFlyTo.center) return;
    if (mapFlyTo.ts === prevTs.current) return;
    prevTs.current = mapFlyTo.ts;
    map.flyTo(mapFlyTo.center, mapFlyTo.zoom || 7, { duration: 1.2 });
  }, [map, mapFlyTo]);
  return null;
}

export default function HistoryMap({
  year,
  onDataLoaded,
  onRulersLoaded,
  selectedPolityId,
  onSelectPolity,
  onYearChange,
  onSelectRuler,
  onSelectEntity,
  mapFlyTo,
}) {
  const [territories, setTerritories] = useState([]);
  const [events, setEvents] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeLayers, setActiveLayers] = useState(["political", "battle", "cities"]);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/history/${year}`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setTerritories(data.territories || []);
        setEvents(data.events || []);
        setPlaces(data.places || []);
        onDataLoaded?.(data.territories || []);
        onRulersLoaded?.(data.rulers || []);
      } catch (err) {
        setError(err.message);
        setTerritories([]);
        setEvents([]);
        setPlaces([]);
        onDataLoaded?.([]);
        onRulersLoaded?.([]);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  function toggleLayer(id) {
    setActiveLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  function handleJump(result) {
    if (result.kind === "ruler" && onSelectRuler) {
      onSelectRuler(result);
      return;
    }
    if (result.kind === "event" && onSelectEntity) {
      if (result.jumpYear && onYearChange) onYearChange(result.jumpYear);
      onSelectEntity({ kind: "event", data: result.event });
      return;
    }
    if (result.kind === "place" && onSelectEntity) {
      onSelectEntity({ kind: "place", data: result.placeData || { _id: result.id, name: result.label } });
      return;
    }
    if (result.jumpYear && onYearChange) {
      onYearChange(result.jumpYear);
    }
    if (result.polityId && onSelectPolity) {
      onSelectPolity(result.polityId);
    }
  }

  const showPolitical = activeLayers.includes("political");
  const showCities = activeLayers.includes("cities");
  const showBattle = activeLayers.includes("battle");

  const nearbyEvents = showBattle
    ? events.filter((ev) => Math.abs(ev.year - year) <= EVENT_WINDOW)
    : [];

  return (
    <div className="relative w-full h-full bg-[#0E1112]">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapController mapFlyTo={mapFlyTo} />
        <ZoomControl position="bottomright" />

        {/* Charcoal Indian Heritage basemap (OSM with custom dark palette filter) */}
        <TileLayer
          className="heritage-dark-tiles"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Political Territory Polygons */}
        {showPolitical &&
          territories.map((t) => {
            const isSelected = t.polity?._id === selectedPolityId;
            const isWeak = t.representation === "weak";
            const baseColor = t.polity?.colorHex || "#C28C40";
            return (
              <GeoJSON
                key={t._id}
                data={t.geometry}
                style={{
                  fillColor: baseColor,
                  fillOpacity: isWeak ? 0.14 : isSelected ? 0.68 : 0.46,
                  color: isSelected ? "#FAF5EB" : baseColor,
                  weight: isWeak ? 1.2 : isSelected ? 2.5 : 1.5,
                  opacity: isWeak ? 0.5 : 0.95,
                  dashArray: isWeak ? "5 5" : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectPolity?.(t.polity?._id),
                }}
              >
                <Popup>
                  <div className="p-1 max-w-[230px]">
                    <div className="font-serif text-[16px] font-bold text-[#34291F] leading-tight">
                      {t.polity?.name}
                    </div>
                    {isWeak && (
                      <div className="text-[11px] text-[#A8523B] italic mt-1 pl-2 border-l-2 border-[#A8523B] leading-tight">
                        Approximate historical presence — not effective control
                      </div>
                    )}
                    <div className="text-[11.5px] text-[#7C6A52] mt-2 space-y-0.5 leading-snug">
                      <div>Capital: <span className="text-[#34291F] font-medium">{t.polity?.capital?.name || "Unknown"}</span></div>
                      <div>Period: {t.validFrom}–{t.validTo} CE</div>
                      <div>Confidence: <span className="capitalize">{t.confidence || "Medium"}</span></div>
                    </div>
                    {t.polity?.description && (
                      <p className="text-[12px] text-[#34291F] mt-2.5 pt-2 border-t border-[#E8D8B8] leading-relaxed line-clamp-4">
                        {t.polity.description}
                      </p>
                    )}
                  </div>
                </Popup>
              </GeoJSON>
            );
          })}

        {/* Cities Layer */}
        {showCities &&
          places
            .filter((place) => place.type !== "battle_site")
            .map((place) => {
              if (!place.location?.coordinates) return null;
              const [lng, lat] = place.location.coordinates;
              return (
                <Marker key={place._id} position={[lat, lng]} icon={cityIcon}>
                  <Popup>
                    <div className="p-1 max-w-[210px]">
                      <span className="text-[9.5px] font-semibold text-[#A8523B] uppercase tracking-wider">
                        {place.type}
                      </span>
                      <strong className="block font-serif text-[15px] text-[#34291F] mt-0.5">
                        {place.name}
                      </strong>
                      {place.modernState && (
                        <div className="text-[11px] text-[#7C6A52] mt-0.5">
                          Now in {place.modernState}
                        </div>
                      )}
                      {place.description && (
                        <p className="text-[12px] text-[#34291F] mt-2 leading-relaxed">
                          {place.description}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

        {/* Nearby Events Layer */}
        {nearbyEvents.map((ev) => {
          if (!ev.place?.location?.coordinates) return null;
          const [lng, lat] = ev.place.location.coordinates;
          const color = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
          const distance = Math.abs(ev.year - year);
          const fade = distance === 0 ? 1 : Math.max(0.4, 1 - distance / EVENT_WINDOW);
          return (
            <CircleMarker
              key={ev._id}
              center={[lat, lng]}
              radius={distance === 0 ? 7 : 5.5}
              pathOptions={{
                fillColor: color,
                fillOpacity: fade,
                color: "#FAF5EB",
                weight: distance === 0 ? 2 : 1.2,
                opacity: fade,
              }}
            >
              <Popup>
                <div className="p-1 max-w-[240px]">
                  <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase text-[#A8523B]">
                    <span>{ev.type}</span>
                    <span>{ev.year} CE</span>
                  </div>
                  <strong className="block font-serif text-[15px] text-[#34291F] mt-1 leading-snug">
                    {ev.title}
                  </strong>
                  {ev.description && (
                    <p className="text-[12px] text-[#34291F] mt-2 leading-relaxed">
                      {ev.description}
                    </p>
                  )}
                  {ev.outcome && (
                    <p className="text-[11.5px] text-[#7C6A52] italic mt-1.5 leading-snug border-l-2 border-[#D4BE98] pl-2">
                      {ev.outcome}
                    </p>
                  )}
                  {ev.rulers && ev.rulers.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#E8D8B8]">
                      <span className="text-[9.5px] uppercase tracking-wider text-[#7C6A52] font-semibold block mb-1">
                        Key Figures
                      </span>
                      <span className="text-[11.5px] text-[#34291F]">
                        {ev.rulers.map((r) => r.name).join(" · ")}
                      </span>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Controls */}
      <SearchBox onJump={handleJump} />
      <LayerControl activeLayers={activeLayers} onToggle={toggleLayer} />

      {/* Territory representation legend matching Screenshot 1 */}
      {showPolitical && (
        <div
          className="absolute bottom-6 left-4 z-[1000] bg-[#FAF5EB]/96 border border-[#D4BE98] rounded-md px-3.5 py-2.5 backdrop-blur-md shadow-md shadow-black/25"
          style={{ pointerEvents: "auto" }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span
                style={{
                  display: "inline-block",
                  width: 20,
                  height: 12,
                  backgroundColor: "rgba(168, 82, 59, 0.4)",
                  border: "1.5px solid #A8523B",
                  borderRadius: 2,
                }}
              />
              <span className="text-[11px] font-medium text-[#34291F]">Active territory</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                style={{
                  display: "inline-block",
                  width: 20,
                  height: 12,
                  backgroundColor: "rgba(168, 82, 59, 0.12)",
                  border: "1.5px dashed #A8523B",
                  borderRadius: 2,
                }}
              />
              <span className="text-[11px] text-[#7C6A52]">Approximate presence</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading & Error Status indicators */}
      {loading && (
        <div className="absolute top-[68px] left-4 bg-[#FAF5EB]/95 text-[#A8523B] text-[11.5px] font-medium tracking-wide px-3 py-1.5 rounded-md z-[1000] border border-[#D4BE98] shadow-sm">
          Loading {year} CE…
        </div>
      )}
      {error && (
        <div className="absolute top-[68px] left-4 bg-[#F4DFD7] text-[#A8523B] text-[11.5px] px-3 py-1.5 rounded-md z-[1000] border border-[#E5BDB2] shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
}
