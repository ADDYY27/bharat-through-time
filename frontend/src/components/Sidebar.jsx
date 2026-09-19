import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

// ── Colour constants ──────────────────────────────────────────────────────
const EVENT_COLORS = {
  battle: "#c1666b",
  treaty: "#5b8fa8",
  succession: "#9b7fb0",
  founding: "#7fb069",
  conquest: "#d4a24c",
  other: "#8a8578",
};

// ── Top-level Sidebar router ──────────────────────────────────────────────
export default function Sidebar({
  territories,
  rulers,
  selectedPolityId,
  selectedRuler,
  onSelectPolity,
  onClearRuler,
  // Knowledge-graph props
  selectedEntity,
  navStack,
  onNavigateTo,
  onNavigateBack,
  onClearEntity,
  onExploreOnMap,
}) {
  const hasBack = navStack && navStack.length > 0;

  // Handle polity_id entity: redirect into legacy polity selection on next tick
  useEffect(() => {
    if (selectedEntity?.kind === "polity_id") {
      onSelectPolity(selectedEntity.data);
      onClearEntity();
    }
  }, [selectedEntity, onSelectPolity, onClearEntity]);

  // Knowledge-graph entity takes highest priority
  if (selectedEntity) {
    if (selectedEntity.kind === "event") {
      return (
        <aside className="w-[340px] border-l border-stone-800 bg-[#14120f] overflow-y-auto flex flex-col">
          <EventDetail
            event={selectedEntity.data}
            hasBack={hasBack}
            onBack={onNavigateBack}
            onNavigateTo={onNavigateTo}
            onExploreOnMap={onExploreOnMap}
          />
        </aside>
      );
    }
    if (selectedEntity.kind === "place") {
      return (
        <aside className="w-[340px] border-l border-stone-800 bg-[#14120f] overflow-y-auto flex flex-col">
          <PlaceDetail
            placeData={selectedEntity.data}
            hasBack={hasBack}
            onBack={onNavigateBack}
            onNavigateTo={onNavigateTo}
            onExploreOnMap={onExploreOnMap}
          />
        </aside>
      );
    }
    if (selectedEntity.kind === "ruler") {
      return (
        <aside className="w-[340px] border-l border-stone-800 bg-[#14120f] overflow-y-auto flex flex-col">
          <RulerDetail
            ruler={selectedEntity.data}
            hasBack={hasBack}
            onBack={onNavigateBack}
            onNavigateTo={onNavigateTo}
            onExploreOnMap={onExploreOnMap}
            onViewPolity={() => {
              if (selectedEntity.data?.polity?._id) {
                onNavigateTo({ kind: "polity_id", data: selectedEntity.data.polity._id });
              }
            }}
          />
        </aside>
      );
    }
    // polity_id: handled by useEffect above, render nothing while redirecting
    return null;
  }

  // Legacy: dedicated ruler view (from direct search click)
  if (selectedRuler) {
    return (
      <aside className="w-[340px] border-l border-stone-800 bg-[#14120f] overflow-y-auto flex flex-col">
        <RulerDetail
          ruler={selectedRuler}
          hasBack={false}
          onBack={onClearRuler}
          onViewPolity={() => {
            onClearRuler();
            if (selectedRuler.polity?._id) onSelectPolity(selectedRuler.polity._id);
          }}
          onNavigateTo={onNavigateTo}
          onExploreOnMap={onExploreOnMap}
        />
      </aside>
    );
  }

  const selected = territories.find((t) => t.polity?._id === selectedPolityId);

  const matchingRulers = selected
    ? (rulers || [])
        .filter((r) => r.polity === selectedPolityId || r.polity?._id === selectedPolityId)
        .sort((a, b) => a.reignStart - b.reignStart)
    : [];

  return (
    <aside className="w-[340px] border-l border-stone-800 bg-[#14120f] overflow-y-auto flex flex-col">
      {selected ? (
        <PolityDetail
          territory={selected}
          rulers={matchingRulers}
          onBack={() => onSelectPolity(null)}
          onNavigateTo={onNavigateTo}
          onExploreOnMap={onExploreOnMap}
        />
      ) : (
        <PolityList territories={territories} onSelectPolity={onSelectPolity} />
      )}
    </aside>
  );
}

// ── PolityList ────────────────────────────────────────────────────────────
function PolityList({ territories, onSelectPolity }) {
  return (
    <div>
      <div className="px-6 pt-7 pb-4 border-b border-stone-800/70">
        <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase">
          {territories.length} {territories.length === 1 ? "power" : "powers"} on the map
        </p>
      </div>

      {territories.length === 0 && (
        <p className="px-6 py-8 text-[13px] text-stone-500 leading-relaxed italic">
          No recorded territories for this year yet.
        </p>
      )}

      <ul>
        {territories.map((t, i) => (
          <li key={t._id} className={i !== 0 ? "border-t border-stone-800/50" : ""}>
            <button
              onClick={() => onSelectPolity(t.polity._id)}
              className="w-full text-left px-6 py-4 hover:bg-stone-900/60 transition-colors group flex items-start gap-3.5"
            >
              <span
                className="w-[3px] self-stretch rounded-full flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: t.polity.colorHex }}
              />
              <div className="min-w-0 pt-0.5">
                <div className="font-display text-[16px] text-stone-100 leading-snug">{t.polity.name}</div>
                <div className="text-[11.5px] text-stone-500 capitalize mt-0.5 tracking-wide">{t.polity.type}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── PolityDetail ──────────────────────────────────────────────────────────
function PolityDetail({ territory, rulers, onBack, onNavigateTo, onExploreOnMap }) {
  const p = territory.polity;

  // Fetch enriched polity data (all rulers, all events) lazily
  const [enriched, setEnriched] = useState(null);
  useEffect(() => {
    if (!p?._id) return;
    fetch(`${API_BASE}/history/polity/${p._id}`)
      .then((r) => r.json())
      .then((d) => setEnriched(d))
      .catch(() => {});
  }, [p?._id]);

  const sourceMap = new Map();
  (p.sources || []).forEach((s) => s?._id && sourceMap.set(s._id, s));
  (territory.sources || []).forEach((s) => s?._id && sourceMap.set(s._id, s));
  const allSources = Array.from(sourceMap.values());

  // Use enriched rulers if available, else fall back to the year-scoped list
  const allRulers = enriched?.rulers || rulers || [];
  const allEvents = enriched?.events || [];

  const capitalCoords = p.capital?.location?.coordinates;

  return (
    <div>
      <button
        onClick={onBack}
        className="w-full text-left px-6 py-3.5 text-[11px] text-stone-500 hover:text-stone-300 transition-colors border-b border-stone-800/70 tracking-wide"
      >
        ‹ back to territories
      </button>

      <div className="px-6 pt-6 pb-8">
        <div className="w-8 h-[3px] rounded-full mb-4" style={{ backgroundColor: p.colorHex }} />
        <h2 className="font-display text-[24px] text-stone-50 leading-[1.15]">{p.name}</h2>
        <p className="text-[11.5px] text-stone-500 capitalize mt-1.5 tracking-wide">{p.type}</p>

        {/* Explore on Map */}
        {capitalCoords && (
          <button
            onClick={() => {
              const [lng, lat] = capitalCoords;
              onExploreOnMap?.([lat, lng], null);
            }}
            className="inline-flex items-center gap-1.5 mt-3 text-[11.5px] text-amber-500/80 hover:text-amber-300 transition-colors"
          >
            Explore on map →
          </button>
        )}

        {/* All rulers (clickable) */}
        {allRulers.length > 0 && (
          <div className="mt-5 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-2.5">
              Rulers
            </p>
            <div className="space-y-2">
              {allRulers.map((r) => (
                <button
                  key={r._id}
                  onClick={() => onNavigateTo?.({ kind: "ruler", data: r })}
                  className="w-full text-left flex gap-3 p-2 rounded hover:bg-stone-900/60 transition-colors group"
                >
                  {r.imageUrl && (
                    <img
                      src={r.imageUrl}
                      alt={r.name}
                      className="w-9 h-9 rounded object-cover flex-shrink-0 border border-stone-800"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-[13px] text-stone-100 group-hover:text-amber-200 transition-colors leading-snug">{r.name}</div>
                    <div className="text-[10.5px] text-stone-500 mt-0.5">
                      {r.title || "Ruler"} · {r.reignStart}–{r.reignEnd}
                    </div>
                  </div>
                  <span className="ml-auto text-stone-600 group-hover:text-amber-400/60 text-[12px] self-center">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4 text-[13px]">
          <Row label="Capital" value={p.capital?.name || "Unknown"} />
          <Row label="Shown for" value={`${territory.validFrom} – ${territory.validTo}`} />
          <ConfidenceRow confidence={territory.confidence} />
        </div>

        {p.description && (
          <p className="text-[13.5px] text-stone-300 mt-6 leading-[1.65] font-light">{p.description}</p>
        )}

        {/* Related events (clickable) */}
        {allEvents.length > 0 && (
          <div className="mt-7 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Events</p>
            <ul className="space-y-2">
              {allEvents.map((ev) => (
                <li key={ev._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "event", data: ev })}
                    className="w-full text-left flex items-start gap-2 p-2 rounded hover:bg-stone-900/60 transition-colors group"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: EVENT_COLORS[ev.type] || EVENT_COLORS.other }}
                    />
                    <div className="min-w-0">
                      <div className="text-[12.5px] text-stone-200 group-hover:text-amber-200 transition-colors leading-snug">{ev.title}</div>
                      <div className="text-[10.5px] text-stone-500 mt-0.5 capitalize">{ev.year} · {ev.type}</div>
                    </div>
                    <span className="ml-auto text-stone-600 group-hover:text-amber-400/60 text-[12px] self-center flex-shrink-0">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SourcesList sources={allSources} />
      </div>
    </div>
  );
}

// ── EventDetail ───────────────────────────────────────────────────────────
function EventDetail({ event, hasBack, onBack, onNavigateTo, onExploreOnMap }) {
  const ev = event || {};
  const color = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
  const placeCoords = ev.place?.location?.coordinates;

  return (
    <div>
      <button
        onClick={onBack}
        className="w-full text-left px-6 py-3.5 text-[11px] text-stone-500 hover:text-stone-300 transition-colors border-b border-stone-800/70 tracking-wide"
      >
        {hasBack ? "‹ back" : "‹ back to territories"}
      </button>

      <div className="px-6 pt-6 pb-8">
        {/* Event type badge */}
        <div
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold mb-3 px-2 py-1 rounded"
          style={{ color, backgroundColor: `${color}18` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          {ev.type}
        </div>

        <h2 className="font-display text-[22px] text-stone-50 leading-[1.2]">{ev.title}</h2>
        <p className="text-[12px] text-stone-500 mt-1.5 tracking-wide">{ev.year}</p>

        {/* Explore on Map */}
        {placeCoords && (
          <button
            onClick={() => {
              const [lng, lat] = placeCoords;
              onExploreOnMap?.([lat, lng], ev.year);
            }}
            className="inline-flex items-center gap-1.5 mt-3 text-[11.5px] text-amber-500/80 hover:text-amber-300 transition-colors"
          >
            Explore on map →
          </button>
        )}

        {ev.description && (
          <p className="text-[13.5px] text-stone-300 mt-5 leading-[1.65] font-light">{ev.description}</p>
        )}

        {ev.outcome && (
          <p className="text-[12.5px] text-stone-400 mt-3 leading-[1.6] italic">{ev.outcome}</p>
        )}

        {/* Key Figures — clickable */}
        {ev.rulers && ev.rulers.length > 0 && (
          <div className="mt-7 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Key Figures</p>
            <ul className="space-y-1.5">
              {ev.rulers.map((r) => (
                <li key={r._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "ruler", data: r })}
                    className="flex items-center gap-2 text-[13px] text-stone-300 hover:text-amber-200 transition-colors group"
                  >
                    <span className="text-stone-600 text-[11px]">👤</span>
                    {r.name}
                    <span className="text-stone-600 group-hover:text-amber-400/60 text-[11px]">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Polities — clickable */}
        {ev.polities && ev.polities.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Polities</p>
            <ul className="space-y-1.5">
              {ev.polities.map((pol) => (
                <li key={pol._id}>
                  <button
                    onClick={() => {
                      onNavigateTo?.({ kind: "polity_id", data: pol._id });
                    }}
                    className="flex items-center gap-2 text-[13px] text-stone-300 hover:text-amber-200 transition-colors group"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pol.colorHex || "#8a8578" }}
                    />
                    {pol.name}
                    <span className="text-stone-600 group-hover:text-amber-400/60 text-[11px]">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Location — clickable */}
        {ev.place && (
          <div className="mt-6 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Location</p>
            <button
              onClick={() => onNavigateTo?.({ kind: "place", data: ev.place })}
              className="flex items-center gap-2 text-[13px] text-stone-300 hover:text-amber-200 transition-colors group"
            >
              <span className="text-stone-600 text-[11px]">📍</span>
              {ev.place.name}
              <span className="text-stone-600 group-hover:text-amber-400/60 text-[11px]">→</span>
            </button>
          </div>
        )}

        <SourcesList sources={ev.sources || []} />
      </div>
    </div>
  );
}

// ── PlaceDetail ───────────────────────────────────────────────────────────
function PlaceDetail({ placeData, hasBack, onBack, onNavigateTo, onExploreOnMap }) {
  const [enriched, setEnriched] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!placeData?._id) return;
    setLoading(true);
    fetch(`${API_BASE}/history/place/${placeData._id}`)
      .then((r) => r.json())
      .then((d) => setEnriched(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [placeData?._id]);

  const place = enriched?.place || placeData;
  const events = enriched?.events || [];
  const rulers = enriched?.rulers || [];
  const polities = place?.polities || placeData?.polities || [];
  const sources = place?.sources || [];
  const coords = place?.location?.coordinates;

  return (
    <div>
      <button
        onClick={onBack}
        className="w-full text-left px-6 py-3.5 text-[11px] text-stone-500 hover:text-stone-300 transition-colors border-b border-stone-800/70 tracking-wide"
      >
        {hasBack ? "‹ back" : "‹ back to territories"}
      </button>

      <div className="px-6 pt-6 pb-8">
        {/* Place type badge */}
        <div className="text-[10px] text-amber-600/80 tracking-[0.15em] uppercase font-semibold mb-2">
          {(place?.type || "place").replace("_", " ")}
        </div>

        <h2 className="font-display text-[22px] text-stone-50 leading-[1.2]">{place?.name}</h2>

        {place?.modernState && (
          <p className="text-[11.5px] text-stone-500 mt-1 tracking-wide">now in {place.modernState}</p>
        )}

        {/* Explore on Map */}
        {coords && (
          <button
            onClick={() => {
              const [lng, lat] = coords;
              onExploreOnMap?.([lat, lng], null);
            }}
            className="inline-flex items-center gap-1.5 mt-3 text-[11.5px] text-amber-500/80 hover:text-amber-300 transition-colors"
          >
            Explore on map →
          </button>
        )}

        {place?.description && (
          <p className="text-[13.5px] text-stone-300 mt-5 leading-[1.65] font-light">{place.description}</p>
        )}

        {loading && (
          <p className="text-[11.5px] text-stone-600 mt-4 italic">Loading…</p>
        )}

        {/* Associated Polities — clickable */}
        {polities.length > 0 && (
          <div className="mt-7 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Associated Polities</p>
            <ul className="space-y-1.5">
              {polities.map((pol) => (
                <li key={pol._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "polity_id", data: pol._id })}
                    className="flex items-center gap-2 text-[13px] text-stone-300 hover:text-amber-200 transition-colors group"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pol.colorHex || "#8a8578" }}
                    />
                    {pol.name}
                    <span className="text-stone-600 group-hover:text-amber-400/60 text-[11px]">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Associated Events — clickable */}
        {events.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Associated Events</p>
            <ul className="space-y-2">
              {events.map((ev) => (
                <li key={ev._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "event", data: ev })}
                    className="w-full text-left flex items-start gap-2 p-2 rounded hover:bg-stone-900/60 transition-colors group"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: EVENT_COLORS[ev.type] || EVENT_COLORS.other }}
                    />
                    <div className="min-w-0">
                      <div className="text-[12.5px] text-stone-200 group-hover:text-amber-200 transition-colors leading-snug">{ev.title}</div>
                      <div className="text-[10.5px] text-stone-500 mt-0.5 capitalize">{ev.year} · {ev.type}</div>
                    </div>
                    <span className="ml-auto text-stone-600 group-hover:text-amber-400/60 text-[12px] self-center flex-shrink-0">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Associated Rulers — clickable */}
        {rulers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Notable Figures</p>
            <ul className="space-y-1.5">
              {rulers.map((r) => (
                <li key={r._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "ruler", data: r })}
                    className="flex items-center gap-2 text-[13px] text-stone-300 hover:text-amber-200 transition-colors group"
                  >
                    <span className="text-stone-600 text-[11px]">👤</span>
                    {r.name}
                    {r.polity && (
                      <span className="text-stone-600 text-[10.5px]">· {r.polity.name}</span>
                    )}
                    <span className="text-stone-600 group-hover:text-amber-400/60 text-[11px] ml-auto">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SourcesList sources={sources} />
      </div>
    </div>
  );
}

// ── RulerDetail ───────────────────────────────────────────────────────────
function RulerDetail({ ruler, hasBack, onBack, onViewPolity, onNavigateTo, onExploreOnMap }) {
  const [events, setEvents] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (!ruler?._id) return;
    setLoadingEvents(true);
    fetch(`${API_BASE}/history/ruler/${ruler._id}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, [ruler?._id]);

  const sources = (ruler.sources || []).filter((s) => s?._id);

  return (
    <div>
      <button
        onClick={onBack}
        className="w-full text-left px-6 py-3.5 text-[11px] text-stone-500 hover:text-stone-300 transition-colors border-b border-stone-800/70 tracking-wide"
      >
        {hasBack ? "‹ back" : "‹ back"}
      </button>

      <div className="px-6 pt-6 pb-8">
        {ruler.imageUrl && (
          <img
            src={ruler.imageUrl}
            alt={ruler.name}
            className="w-20 h-20 rounded-md object-cover border border-stone-800 mb-4"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <h2 className="font-display text-[23px] text-stone-50 leading-[1.15]">{ruler.name}</h2>
        <p className="text-[11.5px] text-stone-500 mt-1.5 tracking-wide">
          {ruler.title || "Ruler"} · {ruler.reignStart}–{ruler.reignEnd}
        </p>

        {ruler.polity?.name && (
          <button
            onClick={onViewPolity}
            className="inline-flex items-center gap-1.5 mt-3 text-[11.5px] text-stone-400 hover:text-amber-300 transition-colors group"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ruler.polity.colorHex || "#8a8578" }}
            />
            {ruler.polity.name}
            <span className="text-stone-600 group-hover:text-amber-400/70">→</span>
          </button>
        )}

        <div className="mt-6 space-y-4 text-[13px]">
          {ruler.birthYear && <Row label="Born" value={ruler.birthYear} />}
          {ruler.deathYear && <Row label="Died" value={ruler.deathYear} />}
        </div>

        {ruler.bio && (
          <p className="text-[13.5px] text-stone-300 mt-6 leading-[1.65] font-light">{ruler.bio}</p>
        )}

        {/* Notable places — now clickable */}
        {ruler.places && ruler.places.length > 0 && (
          <div className="mt-7 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">
              Notable places
            </p>
            <ul className="space-y-1.5">
              {ruler.places.map((p) => {
                const coords = p.location?.coordinates;
                return (
                  <li key={p._id} className="flex items-baseline gap-2">
                    <span className="text-stone-600 capitalize text-[10.5px]">{p.type}</span>
                    <button
                      onClick={() => {
                        if (onNavigateTo) onNavigateTo({ kind: "place", data: p });
                        else if (coords && onExploreOnMap) {
                          const [lng, lat] = coords;
                          onExploreOnMap([lat, lng], null);
                        }
                      }}
                      className="text-[12.5px] text-stone-300 hover:text-amber-200 transition-colors"
                    >
                      {p.name} <span className="text-stone-600">→</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Events featuring this ruler — clickable */}
        {loadingEvents && (
          <p className="text-[11.5px] text-stone-600 mt-5 italic">Loading events…</p>
        )}
        {events && events.length > 0 && (
          <div className="mt-7 pt-5 border-t border-stone-800/70">
            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Events</p>
            <ul className="space-y-2">
              {events.map((ev) => (
                <li key={ev._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "event", data: ev })}
                    className="w-full text-left flex items-start gap-2 p-2 rounded hover:bg-stone-900/60 transition-colors group"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: EVENT_COLORS[ev.type] || EVENT_COLORS.other }}
                    />
                    <div className="min-w-0">
                      <div className="text-[12.5px] text-stone-200 group-hover:text-amber-200 transition-colors leading-snug">{ev.title}</div>
                      <div className="text-[10.5px] text-stone-500 mt-0.5 capitalize">{ev.year} · {ev.type}</div>
                    </div>
                    <span className="ml-auto text-stone-600 group-hover:text-amber-400/60 text-[12px] self-center flex-shrink-0">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SourcesList sources={sources} />
      </div>
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-stone-800/50">
      <span className="text-stone-500 text-[11px] tracking-wide whitespace-nowrap">{label}</span>
      <span className="text-stone-200 text-right">{value}</span>
    </div>
  );
}

function ConfidenceRow({ confidence }) {
  const dotColor = { high: "#7fb069", medium: "#d4a24c", low: "#c1666b" }[confidence] || "#8a8578";
  return (
    <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-stone-800/50">
      <span className="text-stone-500 text-[11px] tracking-wide">boundary confidence</span>
      <span className="text-stone-200 capitalize flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        {confidence}
      </span>
    </div>
  );
}

function SourcesList({ sources }) {
  if (!sources || sources.length === 0) {
    return <p className="text-[11.5px] text-stone-600 mt-7 italic">No sources recorded for this entry yet.</p>;
  }
  return (
    <div className="mt-7 pt-5 border-t border-stone-800/70">
      <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-3">Sources</p>
      <ul className="space-y-2.5">
        {sources.map((s) => (
          <li key={s._id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] text-stone-400 hover:text-stone-100 transition-colors leading-snug flex items-baseline gap-1.5 group"
            >
              <span className="underline decoration-stone-700 group-hover:decoration-stone-400 underline-offset-2 decoration-1">
                {s.title}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
