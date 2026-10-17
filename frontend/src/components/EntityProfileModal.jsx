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
  entity,
  isOpen,
  onClose,
  onExploreOnMap,
  _onNavigateToEntity,
}) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

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
    if (!isOpen || !entity?.id) return;

    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    const kind = entity.kind;
    const id = entity.id;

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
  }, [isOpen, entity]);

  if (!isOpen || !entity) return null;

  const theme = KIND_THEMES[entity.kind] || KIND_THEMES.ruler;

  // Extract fields whether using fresh fetch or instant preview fallback
  const rulerObj = detailData?.ruler || entity.ruler || (entity.kind === "ruler" ? detailData : null);
  const eventObj = (entity.kind === "event" ? detailData : null) || entity.event;
  const placeObj = detailData?.place || entity.placeData || (entity.kind === "place" ? detailData : null);
  const polityObj = detailData?.polity || (entity.kind === "polity" ? detailData : null);

  const title =
    eventObj?.title ||
    rulerObj?.name ||
    placeObj?.name ||
    polityObj?.name ||
    entity.label;

  const subtitle =
    rulerObj?.title ||
    (eventObj ? `${eventObj.year} CE · ${eventObj.type}` : null) ||
    (placeObj?.type ? `${placeObj.type.replace("_", " ")} ${placeObj.modernState ? `· ${placeObj.modernState}` : ""}` : null) ||
    polityObj?.type ||
    entity.sublabel;

  const description =
    rulerObj?.bio ||
    eventObj?.description ||
    placeObj?.description ||
    polityObj?.description ||
    "Historical records for this entry are maintained in the Bharat Through Time repository.";

  const jumpYear =
    entity.jumpYear ||
    eventObj?.year ||
    rulerObj?.reignStart ||
    polityObj?.period?.start;

  const coordinates =
    placeObj?.location?.coordinates ||
    (rulerObj?.places?.[0]?.location?.coordinates) ||
    null;

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
        {/* ── Top Header Navigation Bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[#D4BE98] px-5 py-3.5 bg-[#F2E8D5]/80">
          <div className="flex items-center gap-2 text-[12px] text-[#7C6A52]">
            <span className="uppercase font-semibold tracking-wider text-[10px]">Explore</span>
            <span>›</span>
            <span
              className={`text-[9.5px] uppercase px-1.5 py-0.5 rounded border font-medium ${theme.tagBg} ${theme.tagText} ${theme.border}`}
            >
              {entity.kind}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onExploreOnMap && (
              <button
                onClick={() => {
                  onExploreOnMap(entity, coordinates, jumpYear);
                  onClose();
                }}
                className="px-3 py-1.5 bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] text-[12px] font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>🗺️</span>
                <span>Explore on Map</span>
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
                    {entity.kind}
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
