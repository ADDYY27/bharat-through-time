import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup, CircleMarker, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LayerControl from "./LayerControl";
import SearchBox from "./SearchBox";

const API_BASE = "http://localhost:5000/api";
const EVENT_WINDOW = 18;

const cityIcon = L.divIcon({
  className: "",
  html: `<div style="width:8px;height:8px;background:#e8dcc0;border:1.5px solid #14120f;transform:rotate(45deg);box-shadow:0 0 0 1px rgba(232,220,192,0.35);"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const EVENT_COLORS = {
  battle: "#c1666b",
  treaty: "#5b8fa8",
  succession: "#9b7fb0",
  founding: "#7fb069",
  conquest: "#d4a24c",
  other: "#8a8578",
};

// Sub-component: watches mapFlyTo prop and calls map.flyTo when it changes
function MapController({ mapFlyTo }) {
  const map = useMap();
  const prevTs = useRef(null);
  useEffect(() => {
    if (!mapFlyTo || !mapFlyTo.center) return;
    if (mapFlyTo.ts === prevTs.current) return; // deduplicate
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
  onSelectEntity, // NEW: for event/place navigation
  mapFlyTo,       // NEW: { center: [lat,lng], zoom?, ts }
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
        setTerritories(data.territories);
        setEvents(data.events || []);
        setPlaces(data.places || []);
        onDataLoaded?.(data.territories);
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
      onSelectRuler(result); // carries jumpYear, polityId, and full ruler data together
      return;
    }
    // Events: open event detail panel (data already embedded in search result)
    if (result.kind === "event" && onSelectEntity) {
      if (result.jumpYear && onYearChange) onYearChange(result.jumpYear);
      onSelectEntity({ kind: "event", data: result.event });
      return;
    }
    // Places: open place detail panel
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
    <div className="relative w-full h-full">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} className="w-full h-full">
        <MapController mapFlyTo={mapFlyTo} />
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {showPolitical &&
          territories.map((t) => {
            const isSelected = t.polity?._id === selectedPolityId;
            const isWeak = t.representation === "weak";
            const baseColor = t.polity?.colorHex || "#cc6633";
            return (
              <GeoJSON
                key={t._id}
                data={t.geometry}
                style={{
                  fillColor: baseColor,
                  fillOpacity: isWeak ? 0.12 : isSelected ? 0.7 : 0.42,
                  color: baseColor,
                  weight: isWeak ? 1 : isSelected ? 2.5 : 1.5,
                  opacity: isWeak ? 0.45 : 1,
                  dashArray: isWeak ? "5 5" : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectPolity?.(t.polity?._id),
                }}
              >
                <Popup>
                  <div style={{ fontFamily: "Georgia, serif", maxWidth: 220 }}>
                    <strong style={{ fontSize: 15 }}>{t.polity?.name}</strong>
                    {isWeak && (
                      <div style={{
                        fontFamily: "sans-serif", fontSize: 11, marginTop: 4,
                        color: "#b08050", fontStyle: "italic", lineHeight: 1.5,
                        borderLeft: "2px solid #b08050", paddingLeft: 6,
                      }}>
                        Approximate historical presence — not effective political control
                      </div>
                    )}
                    <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#666", marginTop: 6, lineHeight: 1.6 }}>
                      Capital — {t.polity?.capital?.name || "Unknown"}<br />
                      Shown for {t.validFrom}–{t.validTo}<br />
                      Confidence — {t.confidence}
                    </div>
                    <p style={{ fontFamily: "sans-serif", fontSize: 12.5, marginTop: 8, lineHeight: 1.6, color: "#333" }}>
                      {t.polity?.description}
                    </p>
                  </div>
                </Popup>
              </GeoJSON>
            );
          })}

        {showCities &&
          places
            .filter((place) => place.type !== "battle_site") // these exist only as anchor points for events, not standalone settlements — the Event's own marker covers this location with richer data
            .map((place) => {
            if (!place.location?.coordinates) return null;
            const [lng, lat] = place.location.coordinates;
            return (
              <Marker key={place._id} position={[lat, lng]} icon={cityIcon}>
                <Popup>
                  <div style={{ fontFamily: "Georgia, serif", maxWidth: 210 }}>
                    <div style={{ fontFamily: "sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#a8935f", fontWeight: 600 }}>
                      {place.type}
                    </div>
                    <strong style={{ display: "block", marginTop: 2, fontSize: 15 }}>{place.name}</strong>
                    {place.modernState && (
                      <div style={{ fontFamily: "sans-serif", fontSize: 11.5, color: "#777", marginTop: 2 }}>
                        now in {place.modernState}
                      </div>
                    )}
                    {place.description && (
                      <p style={{ fontFamily: "sans-serif", fontSize: 12.5, marginTop: 6, lineHeight: 1.6, color: "#333" }}>
                        {place.description}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {nearbyEvents.map((ev) => {
          if (!ev.place?.location?.coordinates) return null;
          const [lng, lat] = ev.place.location.coordinates;
          const color = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
          const distance = Math.abs(ev.year - year);
          const fade = distance === 0 ? 1 : Math.max(0.35, 1 - distance / EVENT_WINDOW);
          return (
            <CircleMarker
              key={ev._id}
              center={[lat, lng]}
              radius={6}
              pathOptions={{
                fillColor: color,
                fillOpacity: fade,
                color: "#f4f1ea",
                weight: 1.5,
                opacity: fade,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "Georgia, serif", maxWidth: 240 }}>
                  <div style={{ fontFamily: "sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: color, fontWeight: 600 }}>
                    {ev.type} · {ev.year}
                  </div>
                  <strong style={{ display: "block", marginTop: 3, fontSize: 15 }}>{ev.title}</strong>
                  <p style={{ fontFamily: "sans-serif", fontSize: 12.5, marginTop: 6, lineHeight: 1.6, color: "#333" }}>
                    {ev.description}
                  </p>
                  {ev.outcome && (
                    <p style={{ fontFamily: "sans-serif", fontSize: 12, marginTop: 6, fontStyle: "italic", color: "#777", lineHeight: 1.5 }}>
                      {ev.outcome}
                    </p>
                  )}
                  {ev.rulers && ev.rulers.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee" }}>
                      <div style={{ fontFamily: "sans-serif", fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.5, color: "#999", fontWeight: 600, marginBottom: 3 }}>
                        Key figures
                      </div>
                      <div style={{ fontFamily: "sans-serif", fontSize: 12, color: "#444", lineHeight: 1.6 }}>
                        {ev.rulers.map((r) => r.name).join(" · ")}
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <SearchBox onJump={handleJump} />
      <LayerControl activeLayers={activeLayers} onToggle={toggleLayer} />

      {/* Territory representation legend */}
      {showPolitical && (
        <div
          className="absolute bottom-8 left-3 z-[1000] bg-[#14120f]/92 border border-stone-800 rounded-md px-3 py-2.5 backdrop-blur-sm shadow-lg shadow-black/30"
          style={{ pointerEvents: "none" }}
        >
          <p className="text-[9px] text-stone-500 tracking-[0.18em] uppercase mb-2">
            Territory
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                style={{
                  display: "inline-block", width: 22, height: 10,
                  background: "rgba(180,130,60,0.42)",
                  border: "1.5px solid rgba(180,130,60,0.9)",
                  borderRadius: 2,
                }}
              />
              <span className="text-[10.5px] text-stone-300">Active territory</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  display: "inline-block", width: 22, height: 10,
                  background: "rgba(180,130,60,0.12)",
                  border: "1px dashed rgba(180,130,60,0.45)",
                  borderRadius: 2,
                }}
              />
              <span className="text-[10.5px] text-stone-400">Approximate presence</span>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute top-[62px] left-3 bg-[#14120f]/90 text-stone-300 text-[11px] tracking-wide px-3 py-1.5 rounded z-[1000] border border-stone-800">
          loading {year}…
        </div>
      )}
      {error && (
        <div className="absolute top-[62px] left-3 bg-[#2a1414]/95 text-rose-300 text-[11px] px-3 py-1.5 rounded z-[1000] border border-rose-900">
          {error}
        </div>
      )}
    </div>
  );
}
