import { useState } from "react";
import HistoryMap from "./components/HistoryMap";
import Sidebar from "./components/Sidebar";
import CompareView from "./components/CompareView";

const MIN_YEAR = 1700;
const MAX_YEAR = 1820;

// Era milestones matching the Figma design reference
const ERA_MILESTONES = [
  { label: "1700", year: 1700, isYear: true },
  { label: "Late Mughal", year: 1715, start: 1707, end: 1735 },
  { label: "Maratha Rise", year: 1737, start: 1720, end: 1755 },
  { label: "Carnatic Wars", year: 1752, start: 1746, end: 1763 },
  { label: "Mysore", year: 1780, start: 1761, end: 1799 },
  { label: "Bengal", year: 1765, start: 1757, end: 1775 },
  { label: "Sikh Empire", year: 1805, start: 1799, end: 1820 },
  { label: "1820", year: 1820, isYear: true },
];

function App() {
  const [year, setYear] = useState(1780);
  const [territories, setTerritories] = useState([]);
  const [rulers, setRulers] = useState([]);
  const [selectedPolityId, setSelectedPolityId] = useState(null);
  const [selectedRuler, setSelectedRuler] = useState(null);
  const [activeTab, setActiveTab] = useState("map"); // "map" | "story" | "explore" | "compare"
  const [mobilePanel, setMobilePanel] = useState("map"); // "map" | "sidebar" (for narrow screens)

  // ── Knowledge-graph navigation ──────────────────────────────────────────
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [navStack, setNavStack] = useState([]);

  // For "Explore on Map": { center: [lat, lng], zoom?: number }
  const [mapFlyTo, setMapFlyTo] = useState(null);

  function navigateTo(entity) {
    setNavStack((prev) => {
      const current =
        selectedEntity ||
        (selectedRuler ? { kind: "ruler", data: selectedRuler } : null) ||
        (selectedPolityId ? { kind: "polity_id", data: selectedPolityId } : null);
      return current ? [...prev, current] : prev;
    });
    setSelectedEntity(entity);
    setSelectedRuler(null);
    setSelectedPolityId(null);
    setMobilePanel("sidebar");
  }

  function navigateBack() {
    if (navStack.length === 0) {
      setSelectedEntity(null);
      setSelectedRuler(null);
      setSelectedPolityId(null);
      return;
    }
    const prev = navStack[navStack.length - 1];
    const rest = navStack.slice(0, -1);
    setNavStack(rest);

    if (prev.kind === "polity_id") {
      setSelectedEntity(null);
      setSelectedRuler(null);
      setSelectedPolityId(prev.data);
    } else if (prev.kind === "ruler") {
      setSelectedEntity(null);
      setSelectedRuler(prev.data);
      setSelectedPolityId(null);
    } else {
      setSelectedEntity(prev);
      setSelectedRuler(null);
      setSelectedPolityId(null);
    }
  }

  function clearEntity() {
    setSelectedEntity(null);
    setSelectedRuler(null);
    setSelectedPolityId(null);
    setNavStack([]);
  }

  function exploreOnMap(coords, jumpYear) {
    if (jumpYear) setYear(jumpYear);
    if (coords) setMapFlyTo({ center: coords, ts: Date.now() });
    setMobilePanel("map");
  }

  // ── Legacy handlers ─────────────────────────────────────────────────────
  function selectPolity(id) {
    setSelectedPolityId(id);
    setSelectedRuler(null);
    setSelectedEntity(null);
    setNavStack([]);
    if (id) setMobilePanel("sidebar");
  }

  function selectRuler(result) {
    if (result.jumpYear) setYear(result.jumpYear);
    if (result.polityId) setSelectedPolityId(result.polityId);
    setSelectedRuler(result.ruler || null);
    setSelectedEntity(null);
    setNavStack([]);
    setMobilePanel("sidebar");
  }

  const isCompareMode = activeTab === "compare";

  // Calculate timeline progress percentage for filled track styling
  const sliderProgress = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  return (
    <div className="h-screen bg-[#F2E8D5] text-[#34291F] flex flex-col font-sans selection:bg-[#F4DFD7] selection:text-[#A8523B]">
      {/* ── Main Header ──────────────────────────────────────────────── */}
      <header className="bg-[#F2E8D5] border-b border-[#D4BE98] px-4 sm:px-6 pt-3.5 pb-2.5 flex flex-col gap-2.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-[21px] sm:text-[23px] font-bold text-[#34291F] tracking-tight leading-none">
              Bharat Through Time
            </h1>
            <span className="text-[11.5px] sm:text-[12px] text-[#7C6A52] italic font-normal tracking-wide whitespace-nowrap">
              an atlas of the subcontinent
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: "map", label: "Historical Map" },
              { id: "story", label: "Timeline / Story" },
              { id: "explore", label: "Explore" },
              { id: "compare", label: "Compare" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "text-[12px] sm:text-[12.5px] px-2.5 sm:px-3.5 py-1.5 transition-all relative font-medium whitespace-nowrap cursor-pointer",
                    isActive
                      ? "text-[#A8523B] font-semibold"
                      : "text-[#7C6A52] hover:text-[#34291F]",
                  ].join(" ")}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#A8523B] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Selected Year & Era Milestone Slider (shown on Map tab) ────── */}
        {!isCompareMode && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-0.5">
            {/* Year Callout */}
            <div className="flex items-center sm:flex-col justify-between sm:justify-start shrink-0 sm:min-w-[90px]">
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-[28px] sm:text-[32px] font-bold text-[#A8523B] leading-none tabular-nums">
                  {year}
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-semibold tracking-wider text-[#7C6A52] uppercase">
                  CE
                </span>
              </div>

              {/* Mobile View Toggle (Map vs Sidebar) */}
              <div className="flex md:hidden items-center bg-[#FAF5EB] border border-[#D4BE98] rounded-md p-0.5 text-[11px]">
                <button
                  onClick={() => setMobilePanel("map")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    mobilePanel === "map"
                      ? "bg-[#A8523B] text-[#FAF5EB] font-medium"
                      : "text-[#7C6A52]"
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setMobilePanel("sidebar")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    mobilePanel === "sidebar"
                      ? "bg-[#A8523B] text-[#FAF5EB] font-medium"
                      : "text-[#7C6A52]"
                  }`}
                >
                  Context ({territories.length})
                </button>
              </div>
            </div>

            {/* Slider Track with Era Milestones */}
            <div className="flex-1 flex flex-col justify-center min-w-0 pr-1 sm:pr-2">
              <div className="relative w-full flex items-center py-1">
                <input
                  type="range"
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  step={1}
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  style={{
                    background: `linear-gradient(to right, #A8523B 0%, #A8523B ${sliderProgress}%, #D4BE98 ${sliderProgress}%, #D4BE98 100%)`,
                  }}
                  className="timeline-slider w-full"
                  aria-label="Historical year slider"
                />
              </div>

              {/* Era Milestones row */}
              <div className="flex justify-between items-center text-[10.5px] sm:text-[11px] text-[#7C6A52] pt-0.5 select-none overflow-x-auto no-scrollbar gap-2 sm:gap-0">
                {ERA_MILESTONES.map((milestone) => {
                  const isActive =
                    milestone.isYear
                      ? year === milestone.year
                      : milestone.start && milestone.end
                      ? year >= milestone.start && year <= milestone.end
                      : false;

                  return (
                    <button
                      key={milestone.label}
                      onClick={() => setYear(milestone.year)}
                      className={[
                        "transition-colors hover:text-[#A8523B] cursor-pointer whitespace-nowrap",
                        isActive
                          ? "text-[#A8523B] font-semibold underline underline-offset-4 decoration-[#A8523B]"
                          : "text-[#7C6A52]",
                      ].join(" ")}
                      title={`Jump to ${milestone.year} CE`}
                    >
                      {milestone.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Main View Area ───────────────────────────────────────────── */}
      {isCompareMode ? (
        <CompareView />
      ) : activeTab === "story" ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-[#FAF5EB] text-center">
          <div className="max-w-md p-6 bg-[#F2E8D5] border border-[#D4BE98] rounded-md shadow-xs">
            <h2 className="font-serif text-[22px] font-bold text-[#34291F] mb-2">
              Timeline / Story View
            </h2>
            <p className="text-[13px] text-[#7C6A52] leading-relaxed mb-4">
              Story mode chapters (such as "The rise of Mysore") are scheduled for Part 2.
              Explore the interactive Historical Map for {year} CE.
            </p>
            <button
              onClick={() => setActiveTab("map")}
              className="px-4 py-2 bg-[#A8523B] text-[#FAF5EB] text-[12.5px] font-medium rounded hover:bg-[#93422E] transition-colors cursor-pointer"
            >
              Return to Historical Map
            </button>
          </div>
        </div>
      ) : activeTab === "explore" ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-[#FAF5EB] text-center">
          <div className="max-w-md p-6 bg-[#F2E8D5] border border-[#D4BE98] rounded-md shadow-xs">
            <h2 className="font-serif text-[22px] font-bold text-[#34291F] mb-2">
              Explore View
            </h2>
            <p className="text-[13px] text-[#7C6A52] leading-relaxed mb-4">
              Topic cards across civilisations, empires, battles, people, and places will arrive in
              the next phase. Use the search box or sidebar on the Historical Map.
            </p>
            <button
              onClick={() => setActiveTab("map")}
              className="px-4 py-2 bg-[#A8523B] text-[#FAF5EB] text-[12.5px] font-medium rounded hover:bg-[#93422E] transition-colors cursor-pointer"
            >
              Return to Historical Map
            </button>
          </div>
        </div>
      ) : (
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
          {/* Map canvas */}
          <div
            className={`flex-1 relative bg-[#0E1112] min-h-0 h-full ${
              mobilePanel === "sidebar" ? "hidden md:block" : "block"
            }`}
          >
            <HistoryMap
              year={year}
              onDataLoaded={setTerritories}
              onRulersLoaded={setRulers}
              selectedPolityId={selectedPolityId}
              onSelectPolity={selectPolity}
              onYearChange={setYear}
              onSelectRuler={selectRuler}
              onSelectEntity={navigateTo}
              mapFlyTo={mapFlyTo}
            />
          </div>

          {/* Historical Overview Sidebar */}
          <div
            className={`w-full md:w-auto h-full min-h-0 flex-shrink-0 ${
              mobilePanel === "map" ? "hidden md:flex" : "flex"
            } flex-col`}
          >
            <Sidebar
              year={year}
              territories={territories}
              rulers={rulers}
              selectedPolityId={selectedPolityId}
              selectedRuler={selectedRuler}
              onSelectPolity={selectPolity}
              onClearRuler={() => setSelectedRuler(null)}
              selectedEntity={selectedEntity}
              navStack={navStack}
              onNavigateTo={navigateTo}
              onNavigateBack={navigateBack}
              onClearEntity={clearEntity}
              onExploreOnMap={exploreOnMap}
            />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
