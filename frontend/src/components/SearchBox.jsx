import { useEffect, useRef, useState } from "react";

const API_BASE = "http://localhost:5000/api";

const CATEGORY_ORDER = ["event", "ruler", "place", "polity"];
const CATEGORY_LABEL = { event: "Events", ruler: "People", place: "Places", polity: "Polities" };
const CATEGORY_ICON = { event: "⚔", ruler: "👤", place: "📍", polity: "🏛" };

export default function SearchBox({ onJump }) {
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/search`)
      .then((res) => res.json())
      .then((data) => setAllResults(data.results || []))
      .catch(() => setAllResults([]));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const term = query.trim().toLowerCase();
  const matches = term.length === 0 ? [] : allResults.filter((r) => r.label.toLowerCase().includes(term));

  // Group into ordered categories, capped per category so the dropdown stays scannable
  const grouped = CATEGORY_ORDER.map((kind) => ({
    kind,
    label: CATEGORY_LABEL[kind],
    items: matches.filter((r) => r.kind === kind).slice(0, 5),
  })).filter((g) => g.items.length > 0);

  function handleSelect(result) {
    onJump(result);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="absolute top-3 left-3 z-[1000] w-72">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="search history…"
        className="w-full bg-[#14120f]/95 border border-stone-800 rounded-md px-3.5 py-2 text-[12.5px] text-stone-200 placeholder:text-stone-600 outline-none focus:border-stone-600 backdrop-blur-sm shadow-lg shadow-black/30 transition-colors"
      />

      {open && grouped.length > 0 && (
        <div className="mt-1.5 bg-[#14120f]/97 border border-stone-800 rounded-md overflow-hidden backdrop-blur-sm shadow-lg shadow-black/30 max-h-[70vh] overflow-y-auto">
          {grouped.map((group, gi) => (
            <div key={group.kind} className={gi !== 0 ? "border-t border-stone-800/70" : ""}>
              <p className="text-[9.5px] text-stone-500 tracking-[0.18em] uppercase px-3.5 pt-2.5 pb-1">
                {group.label}
              </p>
              <ul>
                {group.items.map((r) => (
                  <li key={`${r.kind}-${r.id}`}>
                    <button
                      onClick={() => handleSelect(r)}
                      className="w-full text-left px-3.5 py-2 hover:bg-stone-900/70 transition-colors flex items-start gap-2"
                    >
                      <span className="text-[13px] leading-[1.4] flex-shrink-0">{CATEGORY_ICON[r.kind]}</span>
                      <div className="min-w-0">
                        <div className="text-[13px] text-stone-200 truncate">{r.label}</div>
                        <div className="text-[10.5px] text-stone-500 truncate mt-0.5">{r.sublabel}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {open && term.length > 0 && grouped.length === 0 && (
        <div className="mt-1.5 bg-[#14120f]/97 border border-stone-800 rounded-md px-3.5 py-2.5 text-[12px] text-stone-600 italic backdrop-blur-sm">
          nothing found for "{query}"
        </div>
      )}
    </div>
  );
}
