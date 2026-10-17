import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const KIND_THEMES = {
  polity: {
    label: "Polity & Empire",
    tagBg: "bg-[#F3EADB]",
    tagText: "text-[#C28C40]",
    border: "border-[#E2D2B5]",
    accent: "#C28C40",
  },
  ruler: {
    label: "Historical Figure",
    tagBg: "bg-[#EAE0CB]",
    tagText: "text-[#7C6A52]",
    border: "border-[#D4BE98]",
    accent: "#7C6A52",
  },
  place: {
    label: "Place & Stronghold",
    tagBg: "bg-[#DDE5ED]",
    tagText: "text-[#293E63]",
    border: "border-[#BACCDD]",
    accent: "#293E63",
  },
  event: {
    label: "Historical Event",
    tagBg: "bg-[#F4DFD7]",
    tagText: "text-[#A8523B]",
    border: "border-[#E5BDB2]",
    accent: "#A8523B",
  },
};

export default function EntityProfileModal({
  entity: initialEntity,
  isOpen,
  onClose,
  onExploreOnMap,
  onNavigateToEntity,
}) {
  const [currentEntity, setCurrentEntity] = useState(initialEntity);
  const [navHistory, setNavHistory] = useState([]);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Sync when initial entity changes from outside
  useEffect(() => {
    setCurrentEntity(initialEntity);
    setNavHistory([]);
  }, [initialEntity]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Fetch full entity profile from backend API
  useEffect(() => {
    if (!isOpen || !currentEntity?.id) return;

    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    const kind = currentEntity.kind;
    const id = currentEntity.id;

    fetch(`${API_BASE}/history/${kind}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setDetailData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(err.message || "Failed to load detailed profile");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentEntity]);

  if (!isOpen || !currentEntity) return null;

  // Connected navigation handler
  function navigateTo(targetEntity) {
    setNavHistory((prev) => [...prev, currentEntity]);
    setCurrentEntity(targetEntity);
    onNavigateToEntity?.(targetEntity);
  }

  function navigateBack() {
    if (navHistory.length === 0) return;
    const prev = navHistory[navHistory.length - 1];
    setNavHistory((prevList) => prevList.slice(0, -1));
    setCurrentEntity(prev);
    onNavigateToEntity?.(prev);
  }

  const theme = KIND_THEMES[currentEntity.kind] || KIND_THEMES.ruler;

  // Extract fields whether using fresh fetch or instant preview fallback
  const rulerObj = detailData?.ruler || currentEntity.ruler || (currentEntity.kind === "ruler" ? detailData : null);
  const eventObj = (currentEntity.kind === "event" ? detailData : null) || currentEntity.event;
  const placeObj = detailData?.place || currentEntity.placeData || (currentEntity.kind === "place" ? detailData : null);
  const polityObj = detailData?.polity || (currentEntity.kind === "polity" ? detailData : null);

  const title =
    eventObj?.title ||
    rulerObj?.name ||
    placeObj?.name ||
    polityObj?.name ||
    currentEntity.label;

  const subtitle =
    rulerObj?.title ||
    (eventObj ? `${eventObj.year} CE · ${eventObj.type}` : null) ||
    (placeObj?.type ? `${placeObj.type.replace("_", " ")} ${placeObj.modernState ? `· ${placeObj.modernState}` : ""}` : null) ||
    polityObj?.type ||
    currentEntity.sublabel;

  const description =
    rulerObj?.bio ||
    eventObj?.description ||
    placeObj?.description ||
    polityObj?.description ||
    "Historical records for this entry are maintained in the Bharat Through Time repository.";

  const jumpYear =
    currentEntity.jumpYear ||
    eventObj?.year ||
    rulerObj?.reignStart ||
    polityObj?.period?.start;

  const coordinates =
    placeObj?.location?.coordinates ||
    (rulerObj?.places?.[0]?.location?.coordinates) ||
    null;

  // Connected records extracted from detailData
  const relatedRulers =
    detailData?.rulers ||
    (eventObj?.rulers?.length ? eventObj.rulers : []) ||
    (rulerObj ? [rulerObj] : []);

  const relatedEvents =
    detailData?.events ||
    (eventObj ? [eventObj] : []);

  const relatedPolities =
    (polityObj ? [polityObj] : []) ||
    (eventObj?.polities?.length ? eventObj.polities : []) ||
    (rulerObj?.polity ? [rulerObj.polity] : []) ||
    (placeObj?.polities?.length ? placeObj.polities : []);

  const relatedPlaces =
    (placeObj ? [placeObj] : []) ||
    (eventObj?.place ? [eventObj.place] : []) ||
    (rulerObj?.places?.length ? rulerObj.places : []) ||
    (polityObj?.capital ? [polityObj.capital] : []);

  const sources =
    detailData?.sources ||
    eventObj?.sources ||
    rulerObj?.sources ||
    placeObj?.sources ||
    polityObj?.sources ||
    [];

  const previousEntity = navHistory.length > 0 ? navHistory[navHistory.length - 1] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#FAF5EB] border border-[#D4BE98] rounded-lg shadow-2xl flex flex-col overflow-hidden text-[#34291F] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header Navigation Bar & Breadcrumb ─────────────────────── */}
        <div className="flex items-center justify-between border-b border-[#D4BE98] px-5 py-3.5 bg-[#F2E8D5]/80">
          <div className="flex items-center gap-2 text-[12px] text-[#7C6A52] overflow-x-auto no-scrollbar">
            {previousEntity ? (
              <button
                onClick={navigateBack}
                className="flex items-center gap-1 text-[11.5px] font-semibold text-[#A8523B] hover:text-[#93422E] transition-colors cursor-pointer mr-1"
                title={`Back to ${previousEntity.label}`}
              >
                <span>← Back</span>
                <span className="max-w-[120px] truncate hidden sm:inline">({previousEntity.label})</span>
              </button>
            ) : (
              <span className="uppercase font-semibold tracking-wider text-[10px]">Explore</span>
            )}

            <span>›</span>

            <span
              className={`text-[9.5px] uppercase px-1.5 py-0.5 rounded border font-medium shrink-0 ${theme.tagBg} ${theme.tagText} ${theme.border}`}
            >
              {currentEntity.kind}
            </span>

            <span className="text-[#34291F] font-medium truncate max-w-[200px]">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onExploreOnMap && (
              <button
                onClick={() => {
                  onExploreOnMap(currentEntity, coordinates, jumpYear);
                  onClose();
                }}
                className="px-3 py-1.5 bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] text-[12px] font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>🗺️</span>
                <span className="hidden sm:inline">Explore on Map</span>
                <span className="sm:hidden">Map</span>
                {jumpYear && <span className="text-[10px] opacity-80 tabular-nums">({jumpYear} CE)</span>}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#7C6A52] hover:text-[#34291F] hover:bg-[#EFE4CE] rounded transition-colors cursor-pointer text-[14px]"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Scrollable Profile Body ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Entity Hero Title Banner */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Visual Portrait or Monogram Avatar */}
            <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-md bg-[#EFE4CE] border border-[#D4BE98] flex items-center justify-center overflow-hidden shadow-inner">
              {rulerObj?.imageUrl ? (
                <img
                  src={rulerObj.imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="text-center p-2">
                  <span className="font-serif text-[28px] font-bold text-[#A8523B]">
                    {title.charAt(0)}
                  </span>
                  <span className="block text-[9.5px] uppercase tracking-wider text-[#7C6A52] mt-0.5">
                    {currentEntity.kind}
                  </span>
                </div>
              )}
            </div>

            {/* Title & Core Subheadings */}
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border tracking-wider ${theme.tagBg} ${theme.tagText} ${theme.border}`}
                >
                  {theme.label}
                </span>

                {jumpYear && (
                  <span className="text-[11.5px] font-medium text-[#7C6A52] bg-[#F2E8D5] px-2 py-0.5 rounded border border-[#D4BE98] tabular-nums">
                    {jumpYear} CE
                  </span>
                )}
              </div>

              <h2 className="font-serif text-[24px] sm:text-[28px] font-bold text-[#34291F] leading-tight">
                {title}
              </h2>

              {subtitle && (
                <p className="text-[14px] text-[#A8523B] font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* ── Key Historical Attributes Grid ────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F2E8D5]/60 border border-[#D4BE98] rounded-md text-[12px]">
            {/* Ruler attributes */}
            {rulerObj && (
              <>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Reign / Active</span>
                  <span className="font-semibold text-[#34291F] tabular-nums">
                    {rulerObj.reignStart ?? "—"} – {rulerObj.reignEnd ?? "—"} CE
                  </span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Lifespan</span>
                  <span className="font-semibold text-[#34291F] tabular-nums">
                    {rulerObj.birthYear ? `${rulerObj.birthYear}` : "—"} – {rulerObj.deathYear ? `${rulerObj.deathYear} CE` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Dynasty</span>
                  <span className="font-semibold text-[#34291F]">
                    {rulerObj.dynasty || rulerObj.polity?.name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Title</span>
                  <span className="font-semibold text-[#34291F]">
                    {rulerObj.title || "Ruler"}
                  </span>
                </div>
              </>
            )}

            {/* Event attributes */}
            {eventObj && (
              <>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Year</span>
                  <span className="font-semibold text-[#34291F] tabular-nums">{eventObj.year} CE</span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Classification</span>
                  <span className="font-semibold text-[#34291F] capitalize">{eventObj.type}</span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Site / Place</span>
                  <span className="font-semibold text-[#34291F]">{eventObj.place?.name || "Unspecified"}</span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Combatants / Powers</span>
                  <span className="font-semibold text-[#34291F]">{eventObj.polities?.length || 1} Polities</span>
                </div>
              </>
            )}

            {/* Place attributes */}
            {placeObj && (
              <>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Category</span>
                  <span className="font-semibold text-[#34291F] capitalize">{placeObj.type?.replace("_", " ") || "City"}</span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Modern State</span>
                  <span className="font-semibold text-[#34291F]">{placeObj.modernState || "India"}</span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Coordinates</span>
                  <span className="font-semibold text-[#34291F] tabular-nums">
                    {coordinates ? `${coordinates[1]?.toFixed(2)}°N, ${coordinates[0]?.toFixed(2)}°E` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Associated Powers</span>
                  <span className="font-semibold text-[#34291F]">{placeObj.polities?.length || 1} Recorded</span>
                </div>
              </>
            )}

            {/* Polity attributes */}
            {polityObj && (
              <>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Entity Type</span>
                  <span className="font-semibold text-[#34291F] capitalize">{polityObj.type}</span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Historical Period</span>
                  <span className="font-semibold text-[#34291F] tabular-nums">
                    {polityObj.period?.start ?? "—"} – {polityObj.period?.end ?? "—"} CE
                  </span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Capital</span>
                  <span className="font-semibold text-[#34291F]">{polityObj.capital?.name || "Seat of Power"}</span>
                </div>
                <div>
                  <span className="text-[#7C6A52] block text-[10px] uppercase tracking-wider">Map Color</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[#34291F]">
                    <span
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: polityObj.colorHex || "#C28C40" }}
                    />
                    <span>{polityObj.colorHex || "#C28C40"}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Main Narrative Bio / Description ─────────────────────────── */}
          <div className="space-y-2">
            <h3 className="font-serif text-[17px] font-bold text-[#34291F]">
              Historical Narrative & Significance
            </h3>
            <p className="text-[13.5px] text-[#34291F] leading-relaxed whitespace-pre-line bg-[#FAF5EB] p-4 rounded-md border border-[#D4BE98]/60">
              {description}
            </p>
          </div>

          {/* Event Outcome Callout (If Event) */}
          {eventObj?.outcome && (
            <div className="p-4 bg-[#F4DFD7]/50 border-l-4 border-[#A8523B] rounded-r-md space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#A8523B] tracking-wider block">
                Historical Outcome & Ramifications
              </span>
              <p className="text-[13px] text-[#34291F] font-medium leading-relaxed">
                {eventObj.outcome}
              </p>
            </div>
          )}

          {/* ── Connected Historical Entities (Relational Exploration) ────── */}
          <div className="space-y-4 pt-2 border-t border-[#D4BE98]/60">
            <h3 className="font-serif text-[17px] font-bold text-[#34291F]">
              Connected Historical Entities
            </h3>

            {/* 1. Connected Polities */}
            {relatedPolities.length > 0 && currentEntity.kind !== "polity" && (
              <div className="space-y-2">
                <span className="text-[10.5px] font-semibold text-[#7C6A52] uppercase tracking-wider block">
                  Associated Polity / Realm
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {relatedPolities.map((pol) => {
                    const polId = pol._id || pol.id;
                    if (!polId) return null;
                    return (
                      <button
                        key={`pol-${polId}`}
                        onClick={() =>
                          navigateTo({
                            kind: "polity",
                            id: polId,
                            label: pol.name,
                            sublabel: pol.type,
                            jumpYear: pol.period?.start,
                          })
                        }
                        className="text-left p-2.5 bg-[#F2E8D5]/70 hover:bg-[#EFE4CE] border border-[#D4BE98] rounded-md transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: pol.colorHex || "#C28C40" }}
                          />
                          <div>
                            <div className="text-[13px] font-medium text-[#34291F] group-hover:text-[#A8523B] transition-colors">
                              {pol.name}
                            </div>
                            <div className="text-[10.5px] text-[#7C6A52] capitalize">
                              {pol.type}
                            </div>
                          </div>
                        </div>
                        <span className="text-[12px] text-[#7C6A52] group-hover:text-[#A8523B] transition-colors">
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Connected Rulers & Figures */}
            {relatedRulers.length > 0 && currentEntity.kind !== "ruler" && (
              <div className="space-y-2">
                <span className="text-[10.5px] font-semibold text-[#7C6A52] uppercase tracking-wider block">
                  Associated Rulers & Commanders ({relatedRulers.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {relatedRulers.slice(0, 6).map((r) => {
                    const rId = r._id || r.id;
                    if (!rId) return null;
                    return (
                      <button
                        key={`ruler-${rId}`}
                        onClick={() =>
                          navigateTo({
                            kind: "ruler",
                            id: rId,
                            label: r.name,
                            sublabel: r.title || r.polity?.name,
                            jumpYear: r.reignStart,
                            ruler: r,
                          })
                        }
                        className="text-left p-2.5 bg-[#F2E8D5]/70 hover:bg-[#EFE4CE] border border-[#D4BE98] rounded-md transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="text-[13px] font-medium text-[#34291F] group-hover:text-[#A8523B] transition-colors">
                            {r.name}
                          </div>
                          <div className="text-[10.5px] text-[#7C6A52]">
                            {r.title || "Historical Figure"}{" "}
                            {r.reignStart ? `(${r.reignStart}–${r.reignEnd ?? ""} CE)` : ""}
                          </div>
                        </div>
                        <span className="text-[12px] text-[#7C6A52] group-hover:text-[#A8523B] transition-colors">
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Connected Places & Capitals */}
            {relatedPlaces.length > 0 && currentEntity.kind !== "place" && (
              <div className="space-y-2">
                <span className="text-[10.5px] font-semibold text-[#7C6A52] uppercase tracking-wider block">
                  Associated Places & Strongholds ({relatedPlaces.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {relatedPlaces.map((pl) => {
                    const plId = pl._id || pl.id;
                    if (!plId) return null;
                    return (
                      <button
                        key={`place-${plId}`}
                        onClick={() =>
                          navigateTo({
                            kind: "place",
                            id: plId,
                            label: pl.name,
                            sublabel: pl.modernState ? `${pl.modernState} · ${pl.type}` : pl.type,
                            placeData: pl,
                          })
                        }
                        className="text-left p-2.5 bg-[#F2E8D5]/70 hover:bg-[#EFE4CE] border border-[#D4BE98] rounded-md transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="text-[13px] font-medium text-[#34291F] group-hover:text-[#A8523B] transition-colors">
                            {pl.name}
                          </div>
                          <div className="text-[10.5px] text-[#7C6A52]">
                            {pl.modernState || "India"} · {pl.type?.replace("_", " ") || "City"}
                          </div>
                        </div>
                        <span className="text-[12px] text-[#7C6A52] group-hover:text-[#A8523B] transition-colors">
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Connected Events */}
            {relatedEvents.length > 0 && currentEntity.kind !== "event" && (
              <div className="space-y-2">
                <span className="text-[10.5px] font-semibold text-[#7C6A52] uppercase tracking-wider block">
                  Watershed Events & Engagements ({relatedEvents.length})
                </span>
                <div className="space-y-2">
                  {relatedEvents.slice(0, 5).map((ev) => {
                    const evId = ev._id || ev.id;
                    if (!evId) return null;
                    return (
                      <button
                        key={`event-${evId}`}
                        onClick={() =>
                          navigateTo({
                            kind: "event",
                            id: evId,
                            label: ev.title,
                            sublabel: `${ev.year} · ${ev.type}`,
                            jumpYear: ev.year,
                            event: ev,
                          })
                        }
                        className="w-full text-left p-2.5 bg-[#F2E8D5]/70 hover:bg-[#EFE4CE] border border-[#D4BE98] rounded-md transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="text-[13px] font-medium text-[#34291F] group-hover:text-[#A8523B] transition-colors">
                            {ev.title}
                          </div>
                          <div className="text-[10.5px] text-[#7C6A52]">
                            {ev.year} CE · {ev.type?.toUpperCase()}
                          </div>
                        </div>
                        <span className="text-[12px] text-[#7C6A52] group-hover:text-[#A8523B] transition-colors">
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Primary & Secondary Sources Section ──────────────────────── */}
          <div className="space-y-3 pt-3 border-t border-[#D4BE98]/60">
            <h3 className="font-serif text-[17px] font-bold text-[#34291F]">
              Historical References & Sources
            </h3>

            {sources.length > 0 ? (
              <ul className="space-y-2">
                {sources.map((src, idx) => (
                  <li
                    key={src._id || idx}
                    className="p-3 bg-[#FAF5EB] border border-[#D4BE98]/80 rounded-md flex items-center justify-between text-[12.5px]"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-[9.5px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#EAE0CB] text-[#7C6A52] border border-[#D4BE98] shrink-0">
                        {src.type || "Source"}
                      </span>
                      <span className="font-medium text-[#34291F] truncate">{src.title}</span>
                    </div>

                    {src.url ? (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11.5px] text-[#A8523B] hover:underline font-medium shrink-0 flex items-center gap-1"
                      >
                        <span>External Link</span>
                        <span>↗</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-[#7C6A52] italic shrink-0">Catalogued</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-[#7C6A52] italic bg-[#FAF5EB] p-3 rounded border border-[#D4BE98]/60">
                Compiled from historical survey records, contemporary chronicles, and regional gazetteers maintained in the Bharat Through Time archive.
              </p>
            )}
          </div>

          {/* Loading status indicator for background relation fetch */}
          {loading && (
            <div className="p-3 bg-[#EFE4CE]/60 rounded text-[11.5px] text-[#7C6A52] flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#A8523B] border-t-transparent rounded-full animate-spin" />
              <span>Fetching connected records from historical graph…</span>
            </div>
          )}

          {fetchError && (
            <div className="p-3 bg-[#F4DFD7]/40 rounded text-[11.5px] text-[#A8523B]">
              Note: Full relational graph details could not be refreshed ({fetchError}).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
