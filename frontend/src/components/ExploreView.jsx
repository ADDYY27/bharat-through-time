import { useState, useEffect, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ENTITY_CONFIG = {
  all: { label: "All Records", badge: "bg-[#EAE0CB] text-[#7C6A52] border-[#D4BE98]" },
  polity: { label: "Polities & Empires", badge: "bg-[#F3EADB] text-[#C28C40] border-[#E2D2B5]" },
  ruler: { label: "Rulers & Figures", badge: "bg-[#EAE0CB] text-[#7C6A52] border-[#D4BE98]" },
  place: { label: "Places & Capitals", badge: "bg-[#DDE5ED] text-[#293E63] border-[#BACCDD]" },
  event: { label: "Events & Battles", badge: "bg-[#F4DFD7] text-[#A8523B] border-[#E5BDB2]" },
};

// Curated thematic collections based on actual database entities
const CURATED_THEMES = [
  {
    id: "powers",
    title: "Major 18th-Century Powers",
    description: "Dominant empires, confederacies, and successor kingdoms shaping the subcontinent.",
    query: "Empire",
    kindFilter: "polity",
  },
  {
    id: "conflicts",
    title: "Decisive Battles & Turning Points",
    description: "Watershed military engagements and diplomatic treaties that altered political hegemony.",
    query: "Battle",
    kindFilter: "event",
  },
  {
    id: "capitals",
    title: "Historic Capitals & Strongholds",
    description: "Imperial seats of administration, fortified citadels, and commercial crossroads.",
    query: "",
    kindFilter: "place",
  },
  {
    id: "figures",
    title: "Commanders & Visionaries",
    description: "Peshwas, Padshahs, Nizams, and regional commanders who defined the era.",
    query: "",
    kindFilter: "ruler",
  },
];

export default function ExploreView({ onExploreOnMap }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKind, setSelectedKind] = useState("all");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`${API_BASE}/search`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setItems(data.results || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load historical records");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute category counts from actual records
  const counts = useMemo(() => {
    const c = { all: items.length, polity: 0, ruler: 0, place: 0, event: 0 };
    items.forEach((item) => {
      if (c[item.kind] !== undefined) c[item.kind]++;
    });
    return c;
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchKind = selectedKind === "all" || item.kind === selectedKind;
      if (!matchKind) return false;
      if (!q) return true;
      const label = (item.label || "").toLowerCase();
      const sublabel = (item.sublabel || "").toLowerCase();
      return label.includes(q) || sublabel.includes(q);
    });
  }, [items, selectedKind, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF5EB] text-[#34291F] flex flex-col">
      {/* ── Hero Banner with Historical Context ──────────────────────────── */}
      <section className="bg-gradient-to-b from-[#F2E8D5] to-[#FAF5EB] border-b border-[#D4BE98] px-4 sm:px-8 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-[1px] w-6 bg-[#A8523B]" />
            <span className="text-[11px] font-semibold text-[#A8523B] tracking-[0.2em] uppercase">
              Historical Atlas Repository
            </span>
          </div>

          <h2 className="font-serif text-[28px] sm:text-[36px] font-bold text-[#34291F] tracking-tight leading-tight">
            Explore the Subcontinent (1700–1820 CE)
          </h2>

          <p className="text-[14px] sm:text-[15px] text-[#7C6A52] max-w-3xl leading-relaxed">
            Discover the interconnected polities, monarchs, fortified cities, and watershed conflicts
            that shaped 18th-century Bharat during the transformation from imperial hegemony to regional confederacies.
          </p>

          {/* Aggregate counts strip */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2 text-[12px] sm:text-[12.5px] text-[#7C6A52]">
            <span className="font-medium text-[#34291F]">
              <strong className="font-semibold text-[#A8523B] tabular-nums">{counts.all}</strong> Catalogued Records
            </span>
            <span className="text-[#D4BE98]">•</span>
            <span>
              <strong className="font-semibold text-[#C28C40] tabular-nums">{counts.polity}</strong> Polities
            </span>
            <span className="text-[#D4BE98]">•</span>
            <span>
              <strong className="font-semibold text-[#7C6A52] tabular-nums">{counts.ruler}</strong> Rulers & Figures
            </span>
            <span className="text-[#D4BE98]">•</span>
            <span>
              <strong className="font-semibold text-[#293E63] tabular-nums">{counts.place}</strong> Places & Capitals
            </span>
            <span className="text-[#D4BE98]">•</span>
            <span>
              <strong className="font-semibold text-[#A8523B] tabular-nums">{counts.event}</strong> Watershed Events
            </span>
          </div>
        </div>
      </section>

      {/* ── Search & Filter Controls Workspace ───────────────────────────── */}
      <section className="sticky top-0 z-20 bg-[#FAF5EB]/95 backdrop-blur-md border-b border-[#D4BE98] px-4 sm:px-8 py-4 shadow-xs">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Prominent Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, title, battle, dynasty, city, or event…"
                className="w-full bg-[#FAF5EB] border border-[#D4BE98] rounded-md pl-10 pr-9 py-2.5 text-[13.5px] text-[#34291F] placeholder:text-[#9C8975] focus:outline-none focus:border-[#A8523B] focus:ring-1 focus:ring-[#A8523B]/30 transition-all shadow-inner"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C6A52] text-[14px]">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#7C6A52] hover:text-[#34291F] px-1.5 py-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Count Badge */}
            <div className="hidden sm:flex items-center text-[12px] text-[#7C6A52] px-3 py-2 bg-[#F2E8D5] border border-[#D4BE98] rounded-md shrink-0">
              Showing <span className="font-semibold text-[#34291F] mx-1 tabular-nums">{filteredItems.length}</span> of {items.length}
            </div>
          </div>

          {/* Filter Tabs by Entity Type */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            {Object.entries(ENTITY_CONFIG).map(([kindKey, config]) => {
              const isSelected = selectedKind === kindKey;
              const count = counts[kindKey] ?? 0;
              return (
                <button
                  key={kindKey}
                  onClick={() => setSelectedKind(kindKey)}
                  className={[
                    "text-[12px] sm:text-[12.5px] px-3 py-1.5 rounded-md border font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                    isSelected
                      ? "bg-[#A8523B] text-[#FAF5EB] border-[#A8523B] shadow-xs"
                      : "bg-[#F2E8D5] text-[#34291F] border-[#D4BE98] hover:bg-[#EFE4CE]",
                  ].join(" ")}
                >
                  <span>{config.label}</span>
                  <span
                    className={[
                      "text-[10px] px-1.5 py-0.2 rounded-full tabular-nums",
                      isSelected ? "bg-[#8D3823] text-white" : "bg-[#D4BE98]/50 text-[#7C6A52]",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Main Content Area: Curated Themes & Entity Cards ─────────────── */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-8 flex-1">
        {/* Curated Discovery Shelves (Shown when not filtering by specific query) */}
        {!searchQuery && selectedKind === "all" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#D4BE98] pb-2">
              <h3 className="font-serif text-[18px] sm:text-[20px] font-bold text-[#34291F]">
                Curated Historical Themes
              </h3>
              <span className="text-[11.5px] text-[#7C6A52] italic">
                Select a theme to explore records
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {CURATED_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedKind(theme.kindFilter);
                    if (theme.query) setSearchQuery(theme.query);
                  }}
                  className="text-left p-4 bg-[#F2E8D5]/70 border border-[#D4BE98] rounded-md hover:bg-[#EFE4CE] hover:border-[#A8523B] transition-all group cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs"
                >
                  <div>
                    <span className="text-[9.5px] font-semibold text-[#A8523B] uppercase tracking-wider block mb-1">
                      {theme.kindFilter}
                    </span>
                    <h4 className="font-serif text-[15px] font-bold text-[#34291F] group-hover:text-[#A8523B] transition-colors leading-snug">
                      {theme.title}
                    </h4>
                    <p className="text-[12px] text-[#7C6A52] leading-relaxed mt-1">
                      {theme.description}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-[#A8523B] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Explore collection →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Discovery Results Grid ─────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#D4BE98] pb-2">
            <h3 className="font-serif text-[18px] sm:text-[20px] font-bold text-[#34291F]">
              {searchQuery ? `Search Results for "${searchQuery}"` : ENTITY_CONFIG[selectedKind]?.label || "Entities"}
            </h3>
            <span className="text-[12px] text-[#7C6A52] tabular-nums">
              {filteredItems.length} records found
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-2 border-[#A8523B] border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] text-[#7C6A52] animate-pulse">Loading historical entities…</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-[#F4DFD7]/40 border border-[#A8523B]/30 rounded-md text-center max-w-md mx-auto space-y-2">
              <p className="font-serif font-bold text-[#A8523B]">Unable to load records</p>
              <p className="text-[12.5px] text-[#7C6A52]">{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-3 max-w-md mx-auto">
              <p className="font-serif text-[17px] font-bold text-[#34291F]">
                No matching historical entities
              </p>
              <p className="text-[13px] text-[#7C6A52]">
                We couldn't find records matching "{searchQuery}" under the current filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedKind("all");
                }}
                className="px-3.5 py-1.5 bg-[#A8523B] text-[#FAF5EB] text-[12px] font-medium rounded hover:bg-[#93422E] transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredItems.map((item) => {
                const badgeStyle = ENTITY_CONFIG[item.kind]?.badge || "bg-[#EAE0CB] text-[#7C6A52]";
                return (
                  <article
                    key={`${item.kind}-${item.id}`}
                    className="p-4 bg-[#F2E8D5]/60 border border-[#D4BE98] rounded-md hover:bg-[#FAF5EB] hover:border-[#A8523B] transition-all flex flex-col justify-between group shadow-2xs space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9.5px] uppercase px-1.5 py-0.5 rounded border font-medium tracking-wide ${badgeStyle}`}
                        >
                          {item.kind}
                        </span>
                        {item.jumpYear && (
                          <span className="text-[10.5px] text-[#7C6A52] tabular-nums font-medium">
                            {item.jumpYear} CE
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-[16px] font-bold text-[#34291F] group-hover:text-[#A8523B] transition-colors leading-snug">
                        {item.label}
                      </h4>

                      {item.sublabel && (
                        <p className="text-[12px] text-[#7C6A52] line-clamp-2 leading-relaxed">
                          {item.sublabel}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#D4BE98]/40 flex items-center justify-between">
                      <span className="text-[11.5px] font-medium text-[#A8523B] group-hover:underline cursor-pointer">
                        View profile →
                      </span>
                      {onExploreOnMap && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExploreOnMap(item);
                          }}
                          className="text-[11px] text-[#7C6A52] hover:text-[#34291F] px-2 py-1 rounded bg-[#FAF5EB] border border-[#D4BE98] hover:border-[#A8523B] transition-colors cursor-pointer"
                          title="View on Historical Map"
                        >
                          🗺️ On Map
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
