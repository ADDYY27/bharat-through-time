import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Popup,
  Marker,
  Polyline,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { STORIES, POWER_TIMELINES } from "../data/storyData";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Factory for numbered chapter map icons
function createChapterMarkerIcon(chapterNumber, isActive) {
  if (isActive) {
    return L.divIcon({
      className: "chapter-active-icon",
      html: `
        <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:#A8523B;opacity:0.35;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative;width:20px;height:20px;border-radius:50%;background:#A8523B;border:2px solid #FAF5EB;box-shadow:0 0 8px rgba(20,16,12,0.6);display:flex;align-items:center;justify-content:center;color:#FAF5EB;font-family:'Fraunces',serif;font-size:11px;font-weight:700;">
            ${chapterNumber}
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  return L.divIcon({
    className: "chapter-inactive-icon",
    html: `
      <div style="width:16px;height:16px;border-radius:50%;background:#FAF5EB;border:1.5px solid #7C6A52;box-shadow:0 0 5px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#34291F;font-family:'Inter',sans-serif;font-size:9.5px;font-weight:600;cursor:pointer;">
        ${chapterNumber}
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Sub-component to smoothly fly map to active chapter's geographic bounds
function StoryMapController({ target, zoom }) {
  const map = useMap();
  const prevCoordRef = useRef(null);

  useEffect(() => {
    if (!target) return;
    const coordKey = `${target[0]}_${target[1]}_${zoom}`;
    if (prevCoordRef.current === coordKey) return;
    prevCoordRef.current = coordKey;

    map.flyTo(target, zoom || 6, {
      duration: 1.3,
      easeLinearity: 0.25,
    });
  }, [map, target, zoom]);

  return null;
}

export default function StoryView({
  currentYear,
  onYearChange,
  onCompareJump,
}) {
  const [selectedStoryId, setSelectedStoryId] = useState(STORIES[0].id);

  const currentStory =
    STORIES.find((s) => s.id === selectedStoryId) || STORIES[0];

  // Initialize activeChapterIndex matching currentYear if available
  const [activeChapterIndex, setActiveChapterIndex] = useState(() => {
    if (currentYear) {
      const idx = STORIES[0].chapters.findIndex((ch) => ch.year === currentYear);
      if (idx !== -1) return idx;
    }
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5, 1, 2
  const [mobileTab, setMobileTab] = useState("map"); // "chapters" | "map" | "context"

  const [territories, setTerritories] = useState([]);
  const [loadingTerritories, setLoadingTerritories] = useState(false);

  const activeChapter =
    currentStory.chapters[activeChapterIndex] || currentStory.chapters[0];

  // Notify parent of year change whenever active chapter changes
  useEffect(() => {
    if (activeChapter) {
      onYearChange?.(activeChapter.year);
    }
  }, [activeChapter, onYearChange]);

  // Synchronize active chapter if external year changes (e.g. from top header slider or milestones)
  const prevYearRef = useRef(currentYear);
  useEffect(() => {
    if (currentYear === prevYearRef.current) return;
    prevYearRef.current = currentYear;
    if (currentYear === activeChapter.year) return;

    const matchIdx = currentStory.chapters.findIndex((ch) => ch.year === currentYear);
    if (matchIdx !== -1) {
      setActiveChapterIndex(matchIdx);
      setIsPlaying(false);
    }
  }, [currentYear, currentStory.chapters, activeChapter.year]);

  // Load territories for active chapter's year
  useEffect(() => {
    let cancelled = false;
    async function loadTerritories() {
      if (!activeChapter) return;
      setLoadingTerritories(true);
      try {
        const res = await fetch(`${API_BASE}/history/${activeChapter.year}`);
        if (!res.ok) throw new Error("Failed to fetch territories");
        const data = await res.json();
        if (!cancelled) setTerritories(data.territories || []);
      } catch {
        if (!cancelled) setTerritories([]);
      } finally {
        if (!cancelled) setLoadingTerritories(false);
      }
    }
    loadTerritories();
    return () => {
      cancelled = true;
    };
  }, [activeChapter]);

  // Autoplay timer handling
  useEffect(() => {
    if (!isPlaying) return;

    const baseDelay = 5000;
    const intervalMs = Math.round(baseDelay / playbackSpeed);

    const timer = setInterval(() => {
      setActiveChapterIndex((prev) => {
        if (prev >= currentStory.chapters.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, currentStory.chapters.length]);

  const handleSelectChapter = useCallback((idx) => {
    setActiveChapterIndex(idx);
    setIsPlaying(false);
    const target = currentStory.chapters[idx];
    if (target) onYearChange?.(target.year);
  }, [currentStory.chapters, onYearChange]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    const nextIdx = Math.max(0, activeChapterIndex - 1);
    setActiveChapterIndex(nextIdx);
    const target = currentStory.chapters[nextIdx];
    if (target) onYearChange?.(target.year);
  }, [activeChapterIndex, currentStory.chapters, onYearChange]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    const nextIdx = Math.min(currentStory.chapters.length - 1, activeChapterIndex + 1);
    setActiveChapterIndex(nextIdx);
    const target = currentStory.chapters[nextIdx];
    if (target) onYearChange?.(target.year);
  }, [activeChapterIndex, currentStory.chapters, onYearChange]);

  const togglePlayPause = useCallback(() => {
    if (!isPlaying && activeChapterIndex === currentStory.chapters.length - 1) {
      setActiveChapterIndex(0);
      const target = currentStory.chapters[0];
      if (target) onYearChange?.(target.year);
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying, activeChapterIndex, currentStory.chapters, onYearChange]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Ignore if typing inside input or select
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "ArrowLeft" || e.key === "j") {
        e.preventDefault();
        handlePrev();
      } else if (e.code === "ArrowRight" || e.key === "k") {
        e.preventDefault();
        handleNext();
      } else if (e.key >= "1" && e.key <= "6") {
        const targetIdx = parseInt(e.key, 10) - 1;
        if (targetIdx < currentStory.chapters.length) {
          handleSelectChapter(targetIdx);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause, handlePrev, handleNext, handleSelectChapter, currentStory.chapters.length]);

  // Timeline year calculations (1700–1820)
  const MIN_YEAR = 1700;
  const MAX_YEAR = 1820;
  const yearPositionPct = Math.max(
    0,
    Math.min(100, ((activeChapter.year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100)
  );

  // Click handler on "Who Held Power" timeline chart
  function handleTimelineClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetYear = Math.round(MIN_YEAR + ratio * (MAX_YEAR - MIN_YEAR));

    // Find the closest chapter to the clicked year
    let closestIdx = 0;
    let minDiff = Infinity;
    currentStory.chapters.forEach((ch, idx) => {
      const diff = Math.abs(ch.year - targetYear);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    handleSelectChapter(closestIdx);
    const target = currentStory.chapters[closestIdx];
    if (target) onYearChange?.(target.year);
  }

  // Chapter coordinates for the dotted narrative path
  const narrativeRoutePoints = currentStory.chapters.map((ch) => ch.coordinates);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#FAF5EB] overflow-hidden" role="main">
      {/* ── Mobile Tab Segmented Switcher (Visible only on < md screens) ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-[#F2E8D5] border-b border-[#D4BE98]">
        <span className="font-serif text-[14px] font-bold text-[#34291F]">
          Story Mode
        </span>
        <div className="flex items-center bg-[#FAF5EB] border border-[#D4BE98] rounded-md p-0.5 text-[11px]" role="tablist">
          <button
            role="tab"
            aria-selected={mobileTab === "chapters"}
            onClick={() => setMobileTab("chapters")}
            className={`px-2.5 py-1 rounded transition-colors ${
              mobileTab === "chapters"
                ? "bg-[#A8523B] text-[#FAF5EB] font-medium"
                : "text-[#7C6A52]"
            }`}
          >
            Chapters ({currentStory.chapters.length})
          </button>
          <button
            role="tab"
            aria-selected={mobileTab === "map"}
            onClick={() => setMobileTab("map")}
            className={`px-2.5 py-1 rounded transition-colors ${
              mobileTab === "map"
                ? "bg-[#A8523B] text-[#FAF5EB] font-medium"
                : "text-[#7C6A52]"
            }`}
          >
            Map
          </button>
          <button
            role="tab"
            aria-selected={mobileTab === "context"}
            onClick={() => setMobileTab("context")}
            className={`px-2.5 py-1 rounded transition-colors ${
              mobileTab === "context"
                ? "bg-[#A8523B] text-[#FAF5EB] font-medium"
                : "text-[#7C6A52]"
            }`}
          >
            Causal Chain
          </button>
        </div>
      </div>

      {/* ── Main 3-Column Story Layout ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 overflow-hidden relative">
        {/* ── LEFT PANEL: Chapter List & Autoplay Controls ────────────── */}
        <aside
          aria-label="Story Chapters and Playback"
          className={`w-full md:w-[320px] lg:w-[350px] shrink-0 h-full flex flex-col bg-[#F2E8D5] border-r border-[#D4BE98] min-h-0 ${
            mobileTab === "chapters" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Story Selector Header matching Figma */}
          <div className="p-4 border-b border-[#D4BE98] bg-[#EFE4CE]">
            <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#7C6A52] mb-1">
              Story
            </div>
            <select
              value={selectedStoryId}
              onChange={(e) => {
                setSelectedStoryId(e.target.value);
                setActiveChapterIndex(0);
                setIsPlaying(false);
              }}
              className="w-full bg-[#FAF5EB] border border-[#D4BE98] rounded px-2.5 py-1.5 font-serif text-[15px] font-bold text-[#34291F] focus:outline-none focus:border-[#A8523B] cursor-pointer shadow-2xs"
            >
              {STORIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.era})
                </option>
              ))}
            </select>

            <div className="text-[11px] text-[#7C6A52] mt-2 flex items-center justify-between">
              <span>{currentStory.totalChapters} chapters · {currentStory.era}</span>
            </div>

            {/* Chapter Progress Dashes matching Figma mockup */}
            <div className="flex items-center gap-1.5 mt-2.5" aria-hidden="true">
              {currentStory.chapters.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    idx === activeChapterIndex
                      ? "bg-[#A8523B]"
                      : idx < activeChapterIndex
                      ? "bg-[#A8523B]/60"
                      : "bg-[#D4BE98]"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Chapter List (independently scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0" role="list">
            {currentStory.chapters.map((ch, idx) => {
              const isActive = idx === activeChapterIndex;
              return (
                <button
                  key={ch.id}
                  id={`story-chapter-${ch.number}`}
                  onClick={() => handleSelectChapter(idx)}
                  role="listitem"
                  aria-current={isActive ? "step" : undefined}
                  className={`text-left p-3 rounded-md transition-all cursor-pointer relative border ${
                    isActive
                      ? "bg-[#FAF5EB] border-[#A8523B] shadow-xs"
                      : "bg-[#F2E8D5] border-[#DECDB3] hover:bg-[#FAF5EB]/60 hover:border-[#D4BE98]"
                  }`}
                >
                  {/* Left accent bar on active */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#A8523B] rounded-r" />
                  )}

                  <div className="flex items-baseline justify-between gap-2 mb-1 pl-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52]">
                      {ch.number}. {ch.title}
                    </span>
                    <span className="font-serif text-[13px] font-bold text-[#A8523B] tabular-nums">
                      {ch.year}
                    </span>
                  </div>

                  <div className="text-[10.5px] text-[#7C6A52] italic mb-1.5 pl-1">
                    {ch.location}
                  </div>

                  <p className="text-[11.5px] text-[#7C6A52] leading-relaxed line-clamp-2 pl-1">
                    {ch.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Autoplay & Playback Bar */}
          <div className="p-3.5 bg-[#EFE4CE] border-t border-[#D4BE98] flex flex-col gap-2.5 shrink-0 shadow-xs">
            <div className="flex items-center justify-between text-[11px] text-[#7C6A52]">
              <span className="text-[10px] font-bold tracking-[0.16em] uppercase">
                Autoplay
              </span>
              {/* Speed Pills */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#7C6A52] mr-1">Speed</span>
                {[0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    id={`story-speed-${spd}x`}
                    onClick={() => setPlaybackSpeed(spd)}
                    aria-label={`Playback speed ${spd}x`}
                    className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      playbackSpeed === spd
                        ? "bg-[#A8523B] text-[#FAF5EB] font-bold"
                        : "bg-[#FAF5EB] text-[#7C6A52] hover:bg-[#E8D8B8]"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Controls Buttons */}
            <div className="flex items-center justify-between gap-2">
              <button
                id="story-prev-btn"
                onClick={handlePrev}
                disabled={activeChapterIndex === 0}
                aria-label="Previous chapter"
                className="flex-1 py-1.5 px-2 bg-[#FAF5EB] border border-[#D4BE98] rounded text-[12px] font-medium text-[#34291F] hover:bg-[#E8D8B8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-center"
              >
                Previous
              </button>

              <button
                id="story-play-btn"
                onClick={togglePlayPause}
                aria-label={isPlaying ? "Pause autoplay" : "Start autoplay"}
                className="flex-1 py-1.5 px-3 bg-[#A8523B] text-[#FAF5EB] border border-[#93422E] rounded text-[12px] font-semibold hover:bg-[#93422E] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                id="story-next-btn"
                onClick={handleNext}
                disabled={activeChapterIndex === currentStory.chapters.length - 1}
                aria-label="Next chapter"
                className="flex-1 py-1.5 px-2 bg-[#FAF5EB] border border-[#D4BE98] rounded text-[12px] font-medium text-[#34291F] hover:bg-[#E8D8B8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-center"
              >
                Next
              </button>
            </div>
          </div>

        </aside>

        {/* ── CENTER PANEL: Interactive Leaflet Map & Timeline Overlay ── */}
        <section
          aria-label="Story Historical Map"
          className={`flex-1 relative bg-[#0E1112] h-full min-h-0 flex flex-col ${
            mobileTab === "map" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Leaflet Map Area */}
          <div className="flex-1 relative w-full h-full min-h-0">
            <MapContainer
              center={activeChapter.coordinates}
              zoom={activeChapter.zoom || 6}
              className="w-full h-full"
              zoomControl={false}
            >
              <StoryMapController
                target={activeChapter.coordinates}
                zoom={activeChapter.zoom || 6}
              />
              <ZoomControl position="bottomright" />

              {/* Dark Charcoal Indian Heritage basemap filter */}
              <TileLayer
                className="heritage-dark-tiles"
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* Dotted narrative path connecting all chapter coordinates */}
              <Polyline
                positions={narrativeRoutePoints}
                pathOptions={{
                  color: "#A8523B",
                  weight: 2,
                  dashArray: "4 6",
                  opacity: 0.65,
                }}
              />

              {/* Historical Territories Polygons for this Chapter Year */}
              {territories.map((t) => {
                const isWeak = t.representation === "weak";
                const baseColor = t.polity?.colorHex || "#C28C40";
                return (
                  <GeoJSON
                    key={`${activeChapter.year}-${t._id}`}
                    data={t.geometry}
                    style={{
                      fillColor: baseColor,
                      fillOpacity: isWeak ? 0.12 : 0.45,
                      color: baseColor,
                      weight: isWeak ? 1 : 1.5,
                      opacity: isWeak ? 0.4 : 0.9,
                      dashArray: isWeak ? "4 4" : undefined,
                    }}
                  >
                    <Popup>
                      <div className="p-1 max-w-[220px]">
                        <div className="font-serif text-[15px] font-bold text-[#34291F]">
                          {t.polity?.name}
                        </div>
                        {isWeak && (
                          <div className="text-[10px] text-[#A8523B] italic mt-0.5">
                            Approximate presence ({activeChapter.year} CE)
                          </div>
                        )}
                        <div className="text-[11px] text-[#7C6A52] mt-1">
                          Capital:{" "}
                          <span className="text-[#34291F] font-medium">
                            {t.polity?.capital?.name || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </GeoJSON>
                );
              })}

              {/* Plotted Chapter Route Markers (1 through 6) */}
              {currentStory.chapters.map((ch, idx) => {
                const isChapterActive = idx === activeChapterIndex;
                const icon = createChapterMarkerIcon(ch.number, isChapterActive);
                return (
                  <Marker
                    key={ch.id}
                    position={ch.coordinates}
                    icon={icon}
                    eventHandlers={{
                      click: () => handleSelectChapter(idx),
                    }}
                  >
                    <Popup>
                      <div className="p-1">
                        <div className="text-[10px] uppercase font-bold text-[#A8523B] tracking-wider">
                          Chapter {ch.number} · {ch.year} CE
                        </div>
                        <div className="font-serif text-[15px] font-bold text-[#34291F] mt-0.5">
                          {ch.title}
                        </div>
                        <div className="text-[11px] text-[#7C6A52] mt-0.5">
                          {ch.location}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Floating Chapter Narrative Card (matching Figma position and typography) */}
            <div className="absolute top-4 left-4 z-[1000] max-w-sm sm:max-w-md bg-[#FAF5EB]/95 backdrop-blur-xs border border-[#D4BE98] rounded-md p-4 shadow-md pointer-events-auto transition-all duration-300">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#7C6A52] mb-1">
                <span>
                  CHAPTER {activeChapter.number} OF {currentStory.totalChapters}
                </span>
                <span className="font-serif text-[13px] text-[#A8523B] font-bold tabular-nums">
                  {activeChapter.year} CE
                </span>
              </div>
              <h2 className="font-serif text-[19px] sm:text-[21px] font-bold text-[#34291F] leading-tight mb-1">
                {activeChapter.title}
              </h2>
              <div className="text-[11px] text-[#A8523B] font-medium mb-2 flex items-center gap-1.5">
                <span>📍 {activeChapter.location}</span>
                {activeChapter.dateString && (
                  <span className="text-[#7C6A52]">· {activeChapter.dateString}</span>
                )}
                {loadingTerritories && (
                  <span className="text-[10px] text-[#7C6A52] animate-pulse">
                    (updating territories…)
                  </span>
                )}
              </div>
              <p className="text-[12px] sm:text-[12.5px] text-[#5A4938] leading-relaxed">
                {activeChapter.summary}
              </p>
            </div>
          </div>

          {/* ── Bottom Overlay: "WHO HELD POWER · 1700 - 1820" Timeline Chart ── */}
          <div className="bg-[#FAF5EB] border-t border-[#D4BE98] px-4 py-2.5 shrink-0 z-20 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#7C6A52]">
                  Who Held Power
                </span>
                <span className="text-[10px] text-[#7C6A52]">· 1700 – 1820 CE</span>
              </div>
              <div className="text-[10.5px] font-serif font-bold text-[#A8523B]">
                Current Chapter: {activeChapter.year} CE
              </div>
            </div>

            {/* Two-column layout: fixed label column on left, shared track container on right */}
            <div className="flex select-none pt-1 pb-1">
              {/* Left Column: Power Names and Verified Lifespan Badges */}
              <div className="w-44 sm:w-52 shrink-0 flex flex-col gap-1 pr-3">
                {POWER_TIMELINES.map((power) => (
                  <div
                    key={power.id}
                    className="h-4 flex items-center justify-between text-[10px] text-[#7C6A52]"
                    title={`${power.name}: ${power.lifespanLabel} (${power.statusNote})`}
                  >
                    <span className="font-medium text-[#34291F] truncate pr-1">
                      {power.name}
                    </span>
                    <span className="text-[8.5px] tabular-nums text-[#7C6A52] shrink-0 font-medium opacity-85">
                      {power.lifespanLabel}
                    </span>
                  </div>
                ))}
              </div>

              {/* Right Column: Shared Timeline Track Container with Needle and Bars */}
              <div
                className="flex-1 relative flex flex-col gap-1 cursor-pointer"
                onClick={handleTimelineClick}
                role="slider"
                aria-label="Who held power timeline scrubber"
                aria-valuemin={MIN_YEAR}
                aria-valuemax={MAX_YEAR}
                aria-valuenow={activeChapter.year}
              >
                {/* Subtle vertical year grid guidelines at 1700, 1730, 1760, 1790, 1820 */}
                <div className="absolute inset-0 pointer-events-none z-0 flex justify-between" aria-hidden="true">
                  <div className="w-[1px] h-full bg-[#D4BE98]/40" />
                  <div className="w-[1px] h-full bg-[#D4BE98]/30" />
                  <div className="w-[1px] h-full bg-[#D4BE98]/30" />
                  <div className="w-[1px] h-full bg-[#D4BE98]/30" />
                  <div className="w-[1px] h-full bg-[#D4BE98]/40" />
                </div>

                {/* Terracotta Needle for Active Year — Aligned 1:1 with Track */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-[#A8523B] z-30 pointer-events-none transition-all duration-300"
                  style={{ left: `${yearPositionPct}%` }}
                >
                  <div className="w-2.5 h-2.5 -ml-1 -top-1 absolute rounded-full bg-[#A8523B] border-2 border-[#FAF5EB] shadow-xs" />
                </div>

                {POWER_TIMELINES.map((power) => {
                  const startPct = Math.max(
                    0,
                    ((power.visibleStart - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100
                  );
                  const endPct = Math.min(
                    100,
                    ((power.visibleEnd - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100
                  );
                  const widthPct = Math.max(1, endPct - startPct);
                  const isActiveInThisYear =
                    activeChapter.year >= power.actualStart &&
                    activeChapter.year <= power.actualEnd;

                  return (
                    <div
                      key={power.id}
                      className="h-4 flex items-center relative z-10"
                    >
                      <div className="w-full h-3 bg-[#EAE0CB] rounded-xs relative overflow-hidden">
                        <div
                          className={`h-full relative flex items-center justify-between transition-opacity ${
                            power.continuesBefore ? "border-l border-dashed border-[#FAF5EB]/60" : "rounded-l-xs border-l-2 border-[#FAF5EB]"
                          } ${
                            power.continuesAfter
                              ? "border-r border-dashed border-[#FAF5EB]/60"
                              : "rounded-r-xs border-r-2 border-[#14100C]"
                          }`}
                          style={{
                            marginLeft: `${startPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: power.color,
                            opacity: isActiveInThisYear ? 0.95 : 0.45,
                          }}
                          title={`${power.name}: ${power.lifespanLabel} — ${power.statusNote}`}
                        >
                          {/* Indicator for continuation before 1700 */}
                          {power.continuesBefore && (
                            <span className="text-[7.5px] text-[#FAF5EB] font-bold pl-0.5 leading-none select-none opacity-90 z-20">
                              ◀
                            </span>
                          )}

                          {/* Inner Sultanate era highlight for Mysore (1761–1799) */}
                          {power.sultanateStart && (
                            <div
                              className="absolute top-0 bottom-0 bg-[#354B3A] border-x border-[#FAF5EB]/50 flex items-center justify-center px-1"
                              style={{
                                left: `${((power.sultanateStart - power.visibleStart) / (power.visibleEnd - power.visibleStart)) * 100}%`,
                                width: `${((power.sultanateEnd - power.sultanateStart) / (power.visibleEnd - power.visibleStart)) * 100}%`,
                              }}
                              title="Mysore Sultanate under Hyder Ali & Tipu Sultan (1761–1799)"
                            >
                              <span className="text-[7px] text-[#FAF5EB] font-serif font-bold tracking-tight opacity-95 select-none hidden sm:inline whitespace-nowrap">
                                Sultanate (1761–1799)
                              </span>
                            </div>
                          )}

                          <span className="flex-1" />

                          {/* Indicator for continuation after 1820 */}
                          {power.continuesAfter && (
                            <span className="text-[7.5px] text-[#FAF5EB] font-bold pr-0.5 leading-none select-none opacity-90 z-20">
                              ▶
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Axis Labels aligned with the 0% - 100% track */}
                <div className="flex justify-between text-[9px] text-[#7C6A52] pt-0.5 select-none">
                  <span>1700</span>
                  <span>1730</span>
                  <span>1760</span>
                  <span>1790</span>
                  <span>1820</span>
                </div>
              </div>
            </div>

            {/* Explanatory legend footnote */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[8.5px] text-[#7C6A52] pt-1.5 border-t border-[#D4BE98]/50 mt-1.5 gap-1">
              <span>
                ◀ / ▶ indicators designate historical lifespans extending before 1700 or beyond 1820. Solid end-caps mark verified dissolution within the window (Maratha Confederacy: 1818).
              </span>
              <span className="italic shrink-0">Visible timeline window: 1700 – 1820 CE</span>
            </div>
          </div>
        </section>

        {/* ── RIGHT PANEL: Causal Chain, Key Figures & Compare Link ───── */}
        <aside
          aria-label="Historical Context and Causal Chain"
          className={`w-full md:w-[320px] lg:w-[360px] shrink-0 h-full flex flex-col bg-[#F2E8D5] border-l border-[#D4BE98] overflow-y-auto p-4 sidebar-rail ${
            mobileTab === "context" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Causal Chain Section matching Figma boxes */}
          <div className="flex flex-col gap-2.5 mb-5">
            {/* Because Of */}
            <div className="p-3 bg-[#FAF5EB] border border-[#DECDB3] rounded-md shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52]">
                  Because Of
                </span>
                <span className="font-serif text-[11px] font-bold text-[#7C6A52] tabular-nums">
                  {activeChapter.causalChain.becauseOf.year}
                </span>
              </div>
              <div className="font-serif text-[13px] font-bold text-[#34291F] mb-0.5">
                {activeChapter.causalChain.becauseOf.title}
              </div>
              <p className="text-[11.5px] text-[#5A4938] leading-relaxed">
                {activeChapter.causalChain.becauseOf.description}
              </p>
            </div>

            {/* Connecting Arrow */}
            <div className="text-center text-[#A8523B] font-bold text-[12px] -my-1" aria-hidden="true">
              ↓
            </div>

            {/* This Chapter */}
            <div className="p-3 bg-[#FAF5EB] border-2 border-[#A8523B] rounded-md shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8523B]">
                  This Chapter
                </span>
                <span className="font-serif text-[12px] font-bold text-[#A8523B] tabular-nums">
                  {activeChapter.causalChain.thisChapter.year}
                </span>
              </div>
              <div className="font-serif text-[14px] font-bold text-[#34291F] mb-0.5">
                {activeChapter.causalChain.thisChapter.title}
              </div>
              <p className="text-[11.5px] text-[#34291F] font-medium leading-relaxed">
                {activeChapter.causalChain.thisChapter.description}
              </p>
            </div>

            {/* Connecting Arrow */}
            <div className="text-center text-[#A8523B] font-bold text-[12px] -my-1" aria-hidden="true">
              ↓
            </div>

            {/* Led To */}
            <div className="p-3 bg-[#FAF5EB] border border-[#DECDB3] rounded-md shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#293E63]">
                  Led To
                </span>
                <span className="font-serif text-[11px] font-bold text-[#293E63] tabular-nums">
                  {activeChapter.causalChain.ledTo.year}
                </span>
              </div>
              <div className="font-serif text-[13px] font-bold text-[#34291F] mb-0.5">
                {activeChapter.causalChain.ledTo.title}
              </div>
              <p className="text-[11.5px] text-[#5A4938] leading-relaxed">
                {activeChapter.causalChain.ledTo.description}
              </p>
            </div>
          </div>

          {/* Key Figures matching Figma pill/card layout */}
          <div className="mb-5">
            <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#7C6A52] mb-2">
              Key Figures
            </div>
            <div className="flex flex-col gap-1.5">
              {activeChapter.keyFigures?.map((fig) => (
                <div
                  key={fig.name}
                  className="p-2 bg-[#FAF5EB] border border-[#DECDB3] rounded flex flex-col shadow-2xs"
                >
                  <span className="font-serif text-[13px] font-bold text-[#34291F]">
                    {fig.name}
                  </span>
                  <span className="text-[10.5px] text-[#7C6A52]">{fig.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence Meter matching Figma */}
          <div className="p-3 bg-[#FAF5EB] border border-[#D4BE98] rounded-md mb-5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#34291F] mb-1">
              <span className="uppercase tracking-wider text-[10px] text-[#7C6A52]">
                Confidence
              </span>
              <span className="text-[#A8523B] font-mono text-[10.5px]">
                {activeChapter.confidenceRating} ({activeChapter.confidence}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[#EAE0CB] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#A8523B] rounded-full transition-all duration-500"
                style={{ width: `${activeChapter.confidence}%` }}
              />
            </div>
            <p className="text-[10.5px] text-[#7C6A52] italic leading-tight">
              {activeChapter.confidenceNote}
            </p>
          </div>

          {/* Compare Jump Action matching Figma */}
          {activeChapter.compareSuggestion && (
            <div className="mt-auto pt-3 border-t border-[#D4BE98]">
              <button
                id="story-compare-btn"
                onClick={() =>
                  onCompareJump?.(
                    activeChapter.compareSuggestion.yearA,
                    activeChapter.compareSuggestion.yearB
                  )
                }
                className="w-full py-2.5 px-3 bg-[#A8523B] text-[#FAF5EB] rounded-md text-[12px] font-semibold hover:bg-[#93422E] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>⚖️</span>
                <span>{activeChapter.compareSuggestion.label}</span>
              </button>
              <div className="text-[10px] text-center text-[#7C6A52] mt-1.5">
                Switch to side-by-side comparative atlas
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
