import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Indian Heritage Event Colors ──────────────────────────────────────────
const EVENT_COLORS = {
  battle: "#A8523B",
  treaty: "#293E63",
  succession: "#7C6A52",
  founding: "#4D6B53",
  conquest: "#C28C40",
  other: "#7C6A52",
};

// ── Top-level Sidebar router ──────────────────────────────────────────────
export default function Sidebar({
  year,
  territories,
  rulers,
  selectedPolityId,
  selectedRuler,
  onSelectPolity,
  onClearRuler,
  selectedEntity,
  navStack,
  onNavigateTo,
  onNavigateBack,
  onClearEntity,
  onExploreOnMap,
}) {
  const hasBack = navStack && navStack.length > 0;

  useEffect(() => {
    if (selectedEntity?.kind === "polity_id") {
      onSelectPolity(selectedEntity.data);
      onClearEntity();
    }
  }, [selectedEntity, onSelectPolity, onClearEntity]);

  if (selectedEntity) {
    if (selectedEntity.kind === "event") {
      return (
        <aside className="sidebar-rail h-full min-h-0 flex-1 border-l border-[#D4BE98] bg-[#FAF5EB] overflow-y-auto flex flex-col text-[#34291F]">
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
        <aside className="sidebar-rail h-full min-h-0 flex-1 border-l border-[#D4BE98] bg-[#FAF5EB] overflow-y-auto flex flex-col text-[#34291F]">
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
        <aside className="sidebar-rail h-full min-h-0 flex-1 border-l border-[#D4BE98] bg-[#FAF5EB] overflow-y-auto flex flex-col text-[#34291F]">
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
    return null;
  }

  if (selectedRuler) {
    return (
      <aside className="sidebar-rail h-full min-h-0 flex-1 border-l border-[#D4BE98] bg-[#FAF5EB] overflow-y-auto flex flex-col text-[#34291F]">
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
    <aside className="sidebar-rail h-full min-h-0 flex-1 border-l border-[#D4BE98] bg-[#FAF5EB] overflow-y-auto flex flex-col text-[#34291F]">
      {selected ? (
        <PolityDetail
          territory={selected}
          rulers={matchingRulers}
          onBack={() => onSelectPolity(null)}
          onNavigateTo={onNavigateTo}
          onExploreOnMap={onExploreOnMap}
        />
      ) : (
        <PolityList
          year={year}
          territories={territories}
          onSelectPolity={onSelectPolity}
          onNavigateTo={onNavigateTo}
        />
      )}
    </aside>
  );
}

// ── YearOverview matching Figma Screenshot 1 ──────────────────────────────
function YearOverview({ year, onNavigateTo, onSelectPolity, territories }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!year) return;
    setLoading(true);
    setOverview(null);
    fetch(`${API_BASE}/history/${year}/overview`)
      .then((r) => r.json())
      .then((d) => setOverview(d))
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) {
    return (
      <div className="px-6 pt-6 pb-4 border-b border-[#D4BE98]/50">
        <p className="text-[10px] text-[#7C6A52] tracking-[0.2em] uppercase animate-pulse">
          Loading {year} CE overview…
        </p>
      </div>
    );
  }

  const polities = overview?.polities || territories?.map((t) => ({
    _id: t.polity?._id,
    name: t.polity?.name,
    colorHex: t.polity?.colorHex,
  })).filter(Boolean) || [];

  const rulers = overview?.rulers || [];
  const events = overview?.events || [];

  const sortedEvents = [...events].sort((a, b) => {
    if (a.isExact && !b.isExact) return -1;
    if (!a.isExact && b.isExact) return 1;
    return Math.abs(a.year - year) - Math.abs(b.year - year);
  });

  return (
    <div className="p-6 space-y-6">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="border-b border-[#D4BE98]/70 pb-5">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="font-serif text-[38px] font-bold text-[#34291F] tabular-nums">
            {year}
          </span>
          <span className="text-[11px] font-semibold text-[#7C6A52] uppercase tracking-wider">
            CE
          </span>
        </div>
        <p className="text-[9.5px] font-semibold text-[#7C6A52] tracking-[0.2em] uppercase mt-1">
          Historical Context
        </p>
      </div>

      {/* ── Powers in Year ────────────────────────────────────────── */}
      {polities.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-3">
            Powers in {year}
          </p>
          <ul className="space-y-2">
            {polities.map((pol) => (
              <li key={pol._id}>
                <button
                  onClick={() => onSelectPolity?.(pol._id)}
                  className="w-full text-left flex items-center gap-2.5 py-1 px-1 -mx-1 rounded hover:bg-[#EFE4CE] transition-colors group cursor-pointer"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pol.colorHex || "#C28C40" }}
                  />
                  <span className="text-[13px] font-medium text-[#34291F] group-hover:text-[#A8523B] transition-colors">
                    {pol.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Key Figures ───────────────────────────────────────────── */}
      {rulers.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2.5">
            Key Figures
          </p>
          <div className="space-y-2">
            {rulers.slice(0, 3).map((r) => (
              <button
                key={r._id}
                onClick={() => onNavigateTo?.({ kind: "ruler", data: r })}
                className="w-full text-left bg-[#EFE4CE]/80 border border-[#D4BE98] rounded-md px-3.5 py-2.5 flex items-center justify-between hover:bg-[#EAE0CB] hover:border-[#C28C40] transition-all cursor-pointer group"
              >
                <span className="text-[13px] font-medium text-[#34291F] group-hover:text-[#A8523B]">
                  {r.name}
                </span>
                <span className="text-[12px] text-[#7C6A52] group-hover:text-[#A8523B] transition-colors">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Key Events ────────────────────────────────────────────── */}
      {sortedEvents.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2.5">
            Key Events
          </p>
          <div className="space-y-2">
            {sortedEvents.slice(0, 3).map((ev) => (
              <button
                key={ev._id}
                onClick={() => onNavigateTo?.({ kind: "event", data: ev })}
                className="w-full text-left bg-[#EFE4CE]/80 border border-[#D4BE98] rounded-md px-3.5 py-2.5 flex items-center justify-between hover:bg-[#EAE0CB] hover:border-[#C28C40] transition-all cursor-pointer group"
              >
                <span className="text-[12.5px] font-medium text-[#34291F] group-hover:text-[#A8523B] truncate pr-2">
                  {ev.title}
                </span>
                <span className="text-[11.5px] font-medium text-[#7C6A52] shrink-0">
                  {ev.year}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Sources ───────────────────────────────────────────────── */}
      <div className="border-t border-[#D4BE98]/70 pt-5">
        <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-1.5">
          Sources
        </p>
        <p className="text-[11.5px] text-[#7C6A52] leading-relaxed">
          Wikidata; DBpedia; hand-digitized territory polygons
        </p>
      </div>

      {/* ── Confidence ────────────────────────────────────────────── */}
      <div className="border-t border-[#D4BE98]/70 pt-5">
        <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
          Confidence
        </p>
        {/* Segmented bar filled with terracotta */}
        <div className="flex gap-1.5 h-1.5 w-full">
          <div className="flex-1 bg-[#A8523B] rounded-full" />
          <div className="flex-1 bg-[#A8523B] rounded-full" />
          <div className="flex-1 bg-[#D4BE98] rounded-full" />
        </div>
        <p className="text-[11px] text-[#7C6A52] mt-2">
          Medium — borders approximate
        </p>
      </div>
    </div>
  );
}

// ── PolityList ────────────────────────────────────────────────────────────
function PolityList({ year, territories, onSelectPolity, onNavigateTo }) {
  return (
    <div>
      <YearOverview
        year={year}
        territories={territories}
        onNavigateTo={onNavigateTo}
        onSelectPolity={onSelectPolity}
      />

      <div className="px-6 pt-5 pb-3 border-t border-[#D4BE98]/70 bg-[#EFE4CE]/40">
        <p className="text-[9.5px] font-semibold text-[#7C6A52] tracking-[0.2em] uppercase">
          {territories.length} {territories.length === 1 ? "Power" : "Powers"} on map
        </p>
      </div>

      {territories.length === 0 && (
        <p className="px-6 py-6 text-[12.5px] text-[#7C6A52] italic">
          No recorded territories for this year yet.
        </p>
      )}

      <ul className="divide-y divide-[#D4BE98]/50">
        {territories.map((t) => (
          <li key={t._id}>
            <button
              onClick={() => onSelectPolity(t.polity._id)}
              className="w-full text-left px-6 py-3.5 hover:bg-[#EFE4CE] transition-colors group flex items-start gap-3 cursor-pointer"
            >
              <span
                className="w-[3px] self-stretch rounded-full flex-shrink-0"
                style={{ backgroundColor: t.polity.colorHex || "#C28C40" }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[15px] font-semibold text-[#34291F] group-hover:text-[#A8523B] transition-colors leading-snug">
                  {t.polity.name}
                </div>
                <div className="text-[11px] text-[#7C6A52] capitalize mt-0.5 tracking-wide">
                  {t.polity.type} · {t.validFrom}–{t.validTo} CE
                </div>
              </div>
              <span className="text-[12px] text-[#7C6A52] group-hover:text-[#A8523B] self-center">
                →
              </span>
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

  const allRulers = enriched?.rulers || rulers || [];
  const allEvents = enriched?.events || [];
  const capitalCoords = p.capital?.location?.coordinates;

  return (
    <div>
      <button
        onClick={onBack}
        className="w-full text-left px-6 py-3 text-[11px] text-[#7C6A52] hover:text-[#A8523B] transition-colors border-b border-[#D4BE98] tracking-wide cursor-pointer flex items-center gap-1 font-medium bg-[#F2E8D5]/60"
      >
        ‹ Back to Overview
      </button>

      <div className="px-6 pt-5 pb-8 space-y-6">
        <div>
          <div
            className="w-8 h-[3px] rounded-full mb-3"
            style={{ backgroundColor: p.colorHex || "#C28C40" }}
          />
          <h2 className="font-serif text-[24px] font-bold text-[#34291F] leading-tight">
            {p.name}
          </h2>
          <p className="text-[11.5px] text-[#7C6A52] capitalize mt-1 tracking-wide">
            {p.type}
          </p>

          {capitalCoords && (
            <button
              onClick={() => {
                const [lng, lat] = capitalCoords;
                onExploreOnMap?.([lat, lng], null);
              }}
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-[#A8523B] text-[#FAF5EB] rounded text-[11.5px] font-medium hover:bg-[#93422E] transition-colors cursor-pointer"
            >
              Explore on map →
            </button>
          )}
        </div>

        {/* All rulers */}
        {allRulers.length > 0 && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2.5">
              Rulers
            </p>
            <div className="space-y-2">
              {allRulers.map((r) => (
                <button
                  key={r._id}
                  onClick={() => onNavigateTo?.({ kind: "ruler", data: r })}
                  className="w-full text-left flex gap-3 p-2 rounded-md hover:bg-[#EFE4CE] transition-colors group cursor-pointer border border-[#D4BE98]/60 bg-[#FAF5EB]"
                >
                  {r.imageUrl && (
                    <img
                      src={r.imageUrl}
                      alt={r.name}
                      className="w-9 h-9 rounded object-cover flex-shrink-0 border border-[#D4BE98]"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-[#34291F] group-hover:text-[#A8523B] transition-colors leading-snug">
                      {r.name}
                    </div>
                    <div className="text-[10.5px] text-[#7C6A52] mt-0.5">
                      {r.title || "Ruler"} · {r.reignStart}–{r.reignEnd}
                    </div>
                  </div>
                  <span className="text-[#7C6A52] group-hover:text-[#A8523B] text-[12px] self-center">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#D4BE98]/70 pt-4 space-y-3 text-[12.5px]">
          <Row label="Capital" value={p.capital?.name || "Unknown"} />
          <Row label="Active Period" value={`${territory.validFrom} – ${territory.validTo} CE`} />
          <ConfidenceRow confidence={territory.confidence} />
        </div>

        {p.description && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
              Brief
            </p>
            <p className="text-[12.5px] text-[#34291F] leading-relaxed">
              {p.description}
            </p>
          </div>
        )}

        {/* Related events */}
        {allEvents.length > 0 && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2.5">
              Related Events
            </p>
            <ul className="space-y-1.5">
              {allEvents.map((ev) => (
                <li key={ev._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "event", data: ev })}
                    className="w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-[#EFE4CE] transition-colors group cursor-pointer border border-[#D4BE98]/40 bg-[#FAF5EB]"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: EVENT_COLORS[ev.type] || EVENT_COLORS.other }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-[#34291F] group-hover:text-[#A8523B] transition-colors leading-snug">
                        {ev.title}
                      </div>
                      <div className="text-[10.5px] text-[#7C6A52] mt-0.5 capitalize">
                        {ev.year} CE · {ev.type}
                      </div>
                    </div>
                    <span className="text-[#7C6A52] group-hover:text-[#A8523B] text-[12px] self-center">
                      →
                    </span>
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
        className="w-full text-left px-6 py-3 text-[11px] text-[#7C6A52] hover:text-[#A8523B] transition-colors border-b border-[#D4BE98] tracking-wide cursor-pointer font-medium bg-[#F2E8D5]/60"
      >
        {hasBack ? "‹ Back" : "‹ Back to Overview"}
      </button>

      <div className="px-6 pt-5 pb-8 space-y-5">
        <div>
          <span
            className="inline-block text-[9.5px] uppercase font-semibold px-2 py-0.5 rounded border mb-2"
            style={{
              color: color,
              backgroundColor: `${color}15`,
              borderColor: `${color}40`,
            }}
          >
            {ev.type || "Event"}
          </span>

          <h2 className="font-serif text-[23px] font-bold text-[#34291F] leading-tight">
            {ev.title}
          </h2>
          <p className="text-[12px] font-medium text-[#A8523B] mt-1 tracking-wide">
            {ev.year} CE
          </p>

          {placeCoords && (
            <button
              onClick={() => {
                const [lng, lat] = placeCoords;
                onExploreOnMap?.([lat, lng], ev.year);
              }}
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-[#A8523B] text-[#FAF5EB] rounded text-[11.5px] font-medium hover:bg-[#93422E] transition-colors cursor-pointer"
            >
              Explore on map →
            </button>
          )}
        </div>

        {ev.description && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-1.5">
              Brief
            </p>
            <p className="text-[12.5px] text-[#34291F] leading-relaxed">
              {ev.description}
            </p>
          </div>
        )}

        {ev.outcome && (
          <div className="border-l-2 border-[#A8523B] pl-3 py-1 bg-[#EFE4CE]/40 rounded-r">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-1">
              Outcome
            </p>
            <p className="text-[12px] text-[#34291F] italic leading-relaxed">
              {ev.outcome}
            </p>
          </div>
        )}

        {/* Key figures */}
        {ev.rulers && ev.rulers.length > 0 && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
              Key Figures
            </p>
            <ul className="space-y-1.5">
              {ev.rulers.map((r) => (
                <li key={r._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "ruler", data: r })}
                    className="flex items-center gap-2 text-[12.5px] text-[#34291F] hover:text-[#A8523B] transition-colors group cursor-pointer"
                  >
                    <span>👤</span>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-[#7C6A52] group-hover:text-[#A8523B]">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Polities */}
        {ev.polities && ev.polities.length > 0 && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
              Powers Involved
            </p>
            <ul className="space-y-1.5">
              {ev.polities.map((pol) => (
                <li key={pol._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "polity_id", data: pol._id })}
                    className="flex items-center gap-2 text-[12.5px] text-[#34291F] hover:text-[#A8523B] transition-colors group cursor-pointer"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: pol.colorHex || "#C28C40" }}
                    />
                    <span className="font-medium">{pol.name}</span>
                    <span className="text-[#7C6A52] group-hover:text-[#A8523B]">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Location */}
        {ev.place && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
              Location
            </p>
            <button
              onClick={() => onNavigateTo?.({ kind: "place", data: ev.place })}
              className="flex items-center gap-2 text-[12.5px] text-[#34291F] hover:text-[#A8523B] transition-colors group cursor-pointer"
            >
              <span>📍</span>
              <span className="font-medium">{ev.place.name}</span>
              <span className="text-[#7C6A52] group-hover:text-[#A8523B]">→</span>
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
        className="w-full text-left px-6 py-3 text-[11px] text-[#7C6A52] hover:text-[#A8523B] transition-colors border-b border-[#D4BE98] tracking-wide cursor-pointer font-medium bg-[#F2E8D5]/60"
      >
        {hasBack ? "‹ Back" : "‹ Back to Overview"}
      </button>

      <div className="px-6 pt-5 pb-8 space-y-5">
        <div>
          <span className="inline-block text-[9.5px] font-semibold text-[#293E63] uppercase tracking-wider px-2 py-0.5 rounded bg-[#DDE5ED] border border-[#BACCDD] mb-2">
            {(place?.type || "place").replace("_", " ")}
          </span>

          <h2 className="font-serif text-[23px] font-bold text-[#34291F] leading-tight">
            {place?.name}
          </h2>

          {place?.modernState && (
            <p className="text-[11.5px] text-[#7C6A52] mt-1 tracking-wide">
              Now in {place.modernState}
            </p>
          )}

          {coords && (
            <button
              onClick={() => {
                const [lng, lat] = coords;
                onExploreOnMap?.([lat, lng], null);
              }}
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-[#A8523B] text-[#FAF5EB] rounded text-[11.5px] font-medium hover:bg-[#93422E] transition-colors cursor-pointer"
            >
              Explore on map →
            </button>
          )}
        </div>

        {place?.description && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-1.5">
              Description
            </p>
            <p className="text-[12.5px] text-[#34291F] leading-relaxed">
              {place.description}
            </p>
          </div>
        )}

        {loading && (
          <p className="text-[11.5px] text-[#7C6A52] italic">Loading details…</p>
        )}

        {polities.length > 0 && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
              Associated Powers
            </p>
            <ul className="space-y-1.5">
              {polities.map((pol) => (
                <li key={pol._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "polity_id", data: pol._id })}
                    className="flex items-center gap-2 text-[12.5px] text-[#34291F] hover:text-[#A8523B] transition-colors group cursor-pointer"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: pol.colorHex || "#C28C40" }}
                    />
                    <span className="font-medium">{pol.name}</span>
                    <span className="text-[#7C6A52] group-hover:text-[#A8523B]">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {events.length > 0 && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
              Associated Events
            </p>
            <ul className="space-y-1.5">
              {events.map((ev) => (
                <li key={ev._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "event", data: ev })}
                    className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-[#EFE4CE] transition-colors group cursor-pointer"
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: EVENT_COLORS[ev.type] || EVENT_COLORS.other }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-[#34291F] group-hover:text-[#A8523B] leading-snug">
                        {ev.title}
                      </div>
                      <div className="text-[10.5px] text-[#7C6A52] mt-0.5 capitalize">
                        {ev.year} CE · {ev.type}
                      </div>
                    </div>
                    <span className="text-[#7C6A52] group-hover:text-[#A8523B] text-[11px] self-center">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {rulers.length > 0 && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
              Notable Figures
            </p>
            <ul className="space-y-1.5">
              {rulers.map((r) => (
                <li key={r._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "ruler", data: r })}
                    className="flex items-center gap-2 text-[12.5px] text-[#34291F] hover:text-[#A8523B] transition-colors group cursor-pointer"
                  >
                    <span>👤</span>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-[#7C6A52] group-hover:text-[#A8523B]">→</span>
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
        className="w-full text-left px-6 py-3 text-[11px] text-[#7C6A52] hover:text-[#A8523B] transition-colors border-b border-[#D4BE98] tracking-wide cursor-pointer font-medium bg-[#F2E8D5]/60"
      >
        {hasBack ? "‹ Back" : "‹ Back"}
      </button>

      <div className="px-6 pt-5 pb-8 space-y-5">
        <div>
          {ruler.imageUrl && (
            <img
              src={ruler.imageUrl}
              alt={ruler.name}
              className="w-20 h-20 rounded-md object-cover border border-[#D4BE98] mb-3 shadow-xs"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <h2 className="font-serif text-[23px] font-bold text-[#34291F] leading-tight">
            {ruler.name}
          </h2>
          <p className="text-[11.5px] text-[#7C6A52] mt-1 tracking-wide">
            {ruler.title || "Ruler"} · {ruler.reignStart}–{ruler.reignEnd} CE
          </p>

          {ruler.polity?.name && (
            <button
              onClick={onViewPolity}
              className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 bg-[#EFE4CE] border border-[#D4BE98] rounded text-[11.5px] text-[#34291F] hover:text-[#A8523B] transition-colors cursor-pointer"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ruler.polity.colorHex || "#C28C40" }}
              />
              <span className="font-medium">{ruler.polity.name}</span>
              <span className="text-[#7C6A52]">→</span>
            </button>
          )}
        </div>

        <div className="border-t border-[#D4BE98]/70 pt-4 space-y-2.5 text-[12.5px]">
          {ruler.birthYear && <Row label="Born" value={`${ruler.birthYear} CE`} />}
          {ruler.deathYear && <Row label="Died" value={`${ruler.deathYear} CE`} />}
        </div>

        {ruler.bio && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-1.5">
              Biography
            </p>
            <p className="text-[12.5px] text-[#34291F] leading-relaxed">
              {ruler.bio}
            </p>
          </div>
        )}

        {/* Notable places */}
        {ruler.places && ruler.places.length > 0 && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
              Notable Places
            </p>
            <ul className="space-y-1.5">
              {ruler.places.map((p) => {
                const coords = p.location?.coordinates;
                return (
                  <li key={p._id} className="flex items-baseline gap-2">
                    <span className="text-[#7C6A52] capitalize text-[10.5px]">{p.type}</span>
                    <button
                      onClick={() => {
                        if (onNavigateTo) onNavigateTo({ kind: "place", data: p });
                        else if (coords && onExploreOnMap) {
                          const [lng, lat] = coords;
                          onExploreOnMap([lat, lng], null);
                        }
                      }}
                      className="text-[12.5px] text-[#34291F] hover:text-[#A8523B] transition-colors cursor-pointer"
                    >
                      {p.name} <span className="text-[#7C6A52]">→</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Events */}
        {loadingEvents && (
          <p className="text-[11.5px] text-[#7C6A52] italic">Loading events…</p>
        )}
        {events && events.length > 0 && (
          <div className="border-t border-[#D4BE98]/70 pt-4">
            <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
              Events
            </p>
            <ul className="space-y-1.5">
              {events.map((ev) => (
                <li key={ev._id}>
                  <button
                    onClick={() => onNavigateTo?.({ kind: "event", data: ev })}
                    className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-[#EFE4CE] transition-colors group cursor-pointer"
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: EVENT_COLORS[ev.type] || EVENT_COLORS.other }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-[#34291F] group-hover:text-[#A8523B] leading-snug">
                        {ev.title}
                      </div>
                      <div className="text-[10.5px] text-[#7C6A52] mt-0.5 capitalize">
                        {ev.year} CE · {ev.type}
                      </div>
                    </div>
                    <span className="text-[#7C6A52] group-hover:text-[#A8523B] text-[11px] self-center">
                      →
                    </span>
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

// ── Shared Primitives ─────────────────────────────────────────────────────
function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-[#D4BE98]/40">
      <span className="text-[#7C6A52] text-[11px] uppercase tracking-wide whitespace-nowrap font-medium">
        {label}
      </span>
      <span className="text-[#34291F] font-medium text-right">{value}</span>
    </div>
  );
}

function ConfidenceRow({ confidence }) {
  const isHigh = confidence === "high";
  const isMed = confidence === "medium";
  return (
    <div className="flex items-baseline justify-between gap-4 pb-2 border-b border-[#D4BE98]/40">
      <span className="text-[#7C6A52] text-[11px] uppercase tracking-wide font-medium">
        Boundary Confidence
      </span>
      <div className="flex items-center gap-2">
        <div className="flex gap-1 h-1.5 w-12">
          <div className="flex-1 bg-[#A8523B] rounded-full" />
          <div className={`flex-1 rounded-full ${isHigh || isMed ? "bg-[#A8523B]" : "bg-[#D4BE98]"}`} />
          <div className={`flex-1 rounded-full ${isHigh ? "bg-[#A8523B]" : "bg-[#D4BE98]"}`} />
        </div>
        <span className="text-[#34291F] capitalize text-[11.5px] font-medium">
          {confidence || "Medium"}
        </span>
      </div>
    </div>
  );
}

function SourcesList({ sources }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="border-t border-[#D4BE98]/70 pt-4">
        <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-1">
          Sources
        </p>
        <p className="text-[11.5px] text-[#7C6A52] italic">
          Wikidata; DBpedia; hand-digitized territory polygons
        </p>
      </div>
    );
  }
  return (
    <div className="border-t border-[#D4BE98]/70 pt-4">
      <p className="text-[10px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase mb-2">
        Sources
      </p>
      <ul className="space-y-1.5">
        {sources.map((s) => (
          <li key={s._id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[#7C6A52] hover:text-[#A8523B] transition-colors leading-snug flex items-baseline gap-1 group underline decoration-[#D4BE98] underline-offset-2"
            >
              <span>{s.title}</span>
              <span className="text-[10px]">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
