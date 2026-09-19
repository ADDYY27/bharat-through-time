import { useRef, useState } from "react";
import HistoryMap from "./components/HistoryMap";
import Sidebar from "./components/Sidebar";
import CompareView from "./components/CompareView";

const MIN_YEAR = 1700;
const MAX_YEAR = 1820;

function App() {
  const [year, setYear] = useState(1739);
  const [territories, setTerritories] = useState([]);
  const [rulers, setRulers] = useState([]);
  const [selectedPolityId, setSelectedPolityId] = useState(null);
  const [selectedRuler, setSelectedRuler] = useState(null); // legacy: full object, or null
  const [compareMode, setCompareMode] = useState(false);

  // ── Knowledge-graph navigation ──────────────────────────────────────────
  // Each entry: { kind: 'polity'|'ruler'|'event'|'place', data: {...} }
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [navStack, setNavStack] = useState([]);

  // For "Explore on Map": { center: [lat, lng], zoom?: number }
  const [mapFlyTo, setMapFlyTo] = useState(null);

  function navigateTo(entity) {
    // Push the current view onto the stack so Back works
    setNavStack((prev) => {
      const current = selectedEntity
        || (selectedRuler ? { kind: "ruler", data: selectedRuler } : null)
        || (selectedPolityId ? { kind: "polity_id", data: selectedPolityId } : null);
      return current ? [...prev, current] : prev;
    });
    setSelectedEntity(entity);
    // Clear legacy selection so we don't render double
    setSelectedRuler(null);
    setSelectedPolityId(null);
  }

  function navigateBack() {
    if (navStack.length === 0) {
      // Nothing on stack — go to the default list
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
  }

  // ── Legacy handlers (existing code, kept intact) ────────────────────────
  function selectPolity(id) {
    setSelectedPolityId(id);
    setSelectedRuler(null);
    setSelectedEntity(null);
    setNavStack([]);
  }

  function selectRuler(result) {
    // result comes from search: { jumpYear, polityId, ruler }
    if (result.jumpYear) setYear(result.jumpYear);
    if (result.polityId) setSelectedPolityId(result.polityId);
    setSelectedRuler(result.ruler || null);
    setSelectedEntity(null);
    setNavStack([]);
  }

  return (
    <div className="h-screen bg-[#0f0e0c] text-stone-100 flex flex-col">
      <header className="px-6 pt-5 pb-4 border-b border-stone-800/70 bg-[#14120f]">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-[20px] tracking-tight text-stone-100">
              Bharat Through Time
            </h1>
            <span className="text-[11px] text-stone-600 tracking-wide">
              an atlas of the subcontinent
            </span>
          </div>

          <button
            onClick={() => setCompareMode((v) => !v)}
            className={[
              "text-[11px] tracking-wide px-3 py-1.5 rounded-md border transition-colors",
              compareMode
                ? "bg-amber-600/20 border-amber-700/50 text-amber-200"
                : "border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700",
            ].join(" ")}
          >
            {compareMode ? "✕ exit compare" : "⇄ compare two years"}
          </button>
        </div>

        {!compareMode && (
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-baseline gap-1.5 w-[72px] shrink-0">
              <span className="font-display text-[26px] text-amber-200/90 tabular-nums leading-none">
                {year}
              </span>
              <span className="text-[10px] text-stone-600 tracking-[0.12em] uppercase">CE</span>
            </div>
            <div className="flex-1 relative min-w-0">
              <input
                type="range"
                min={MIN_YEAR}
                max={MAX_YEAR}
                step={1}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer accent-amber-500/90"
              />
              <div className="flex justify-between text-[10px] text-stone-600 mt-1 tracking-wide">
                <span>{MIN_YEAR}</span>
                <span>{MAX_YEAR}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {compareMode ? (
        <CompareView />
      ) : (
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative">
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
          <Sidebar
            year={year}
            territories={territories}
            rulers={rulers}
            selectedPolityId={selectedPolityId}
            selectedRuler={selectedRuler}
            onSelectPolity={selectPolity}
            onClearRuler={() => setSelectedRuler(null)}
            // Knowledge-graph props
            selectedEntity={selectedEntity}
            navStack={navStack}
            onNavigateTo={navigateTo}
            onNavigateBack={navigateBack}
            onClearEntity={clearEntity}
            onExploreOnMap={exploreOnMap}
          />
        </main>
      )}
    </div>
  );
}

export default App;
