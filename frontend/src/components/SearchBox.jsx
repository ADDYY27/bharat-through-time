import { useEffect, useRef, useState } from "react";
import { fetchApi } from "../utils/api";

const CATEGORY_ORDER = ["event", "ruler", "place", "polity"];
const CATEGORY_LABEL = { event: "Events", ruler: "People", place: "Places", polity: "Polities" };
const CATEGORY_BADGE_STYLE = {
  event: "bg-[#F4DFD7] text-[#A8523B] border-[#E5BDB2]",
  ruler: "bg-[#EAE0CB] text-[#7C6A52] border-[#D4BE98]",
  place: "bg-[#DDE5ED] text-[#293E63] border-[#BACCDD]",
  polity: "bg-[#F3EADB] text-[#C28C40] border-[#E2D2B5]",
};

export default function SearchBox({ onJump }) {
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchApi("/search", {}, 1, 15000)
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
    <div ref={containerRef} className="absolute top-4 left-4 z-[1000] w-72">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="search history…"
          className="w-full bg-[#FAF5EB]/96 border border-[#D4BE98] rounded-md px-3.5 py-2 text-[12.5px] text-[#34291F] placeholder:text-[#7C6A52] outline-none focus:border-[#A8523B] focus:ring-1 focus:ring-[#A8523B]/30 backdrop-blur-md shadow-md shadow-black/20 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#7C6A52] hover:text-[#34291F] px-1"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {open && grouped.length > 0 && (
        <div className="mt-1.5 bg-[#FAF5EB]/98 border border-[#D4BE98] rounded-md overflow-hidden backdrop-blur-md shadow-lg shadow-black/25 max-h-[70vh] overflow-y-auto">
          {grouped.map((group, gi) => (
            <div key={group.kind} className={gi !== 0 ? "border-t border-[#D4BE98]/60" : ""}>
              <p className="text-[9.5px] font-semibold text-[#7C6A52] tracking-[0.18em] uppercase px-3.5 pt-2.5 pb-1 bg-[#F2E8D5]/60">
                {group.label}
              </p>
              <ul>
                {group.items.map((r) => (
                  <li key={`${r.kind}-${r.id}`}>
                    <button
                      onClick={() => handleSelect(r)}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#EFE4CE] transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-medium tracking-wide flex-shrink-0 mt-0.5 ${
                          CATEGORY_BADGE_STYLE[r.kind] || "bg-[#EAE0CB] text-[#7C6A52]"
                        }`}
                      >
                        {r.kind}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-[#34291F] truncate">{r.label}</div>
                        {r.sublabel && (
                          <div className="text-[10.5px] text-[#7C6A52] truncate mt-0.5">{r.sublabel}</div>
                        )}
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
        <div className="mt-1.5 bg-[#FAF5EB]/98 border border-[#D4BE98] rounded-md px-3.5 py-2.5 text-[12px] text-[#7C6A52] italic backdrop-blur-md shadow-md shadow-black/20">
          no results for "{query}"
        </div>
      )}
    </div>
  );
}
