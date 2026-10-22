import { useState, useEffect, useMemo, useRef } from "react";
import { fetchApi } from "../utils/api";
import { CATEGORY_CONFIG, STORY_ERAS } from "../utils/storyTokens";
import StoryCard from "./StoryCard";
import FeaturedStoryCard from "./FeaturedStoryCard";

const SORT_OPTIONS = [
  { id: "chronological", label: "Chronological (earliest)" },
  { id: "latest", label: "Latest" },
  { id: "alphabetical", label: "Alphabetical" },
];

export default function ExploreStories({ onSelectStory }) {
  const [stories, setStories] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    byCategory: {},
    byEra: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEra, setSelectedEra] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState("chronological");

  const searchInputRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch counts on mount
  useEffect(() => {
    let isMounted = true;
    fetchApi("/stories/counts", {}, 1, 10000)
      .then((data) => {
        if (isMounted) setCounts(data);
      })
      .catch((err) => {
        console.warn("Could not load story counts:", err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch stories list whenever filters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.append("category", selectedCategory);
    if (selectedEra !== "all") params.append("era", selectedEra);
    if (debouncedQuery.trim()) params.append("q", debouncedQuery.trim());
    if (sortBy) params.append("sort", sortBy);
    params.append("limit", "50");

    const endpoint = `/stories?${params.toString()}`;

    fetchApi(endpoint, {}, 1, 15000)
      .then((data) => {
        if (isMounted) {
          setStories(data.stories || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load stories");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedEra, debouncedQuery, sortBy]);

  // Determine featured story: first published story chronologically
  const featuredStory = useMemo(() => {
    if (selectedCategory !== "all" || selectedEra !== "all" || debouncedQuery.trim()) {
      return null; // hide featured banner when actively filtering/searching
    }
    return stories.length > 0 ? stories[0] : null;
  }, [stories, selectedCategory, selectedEra, debouncedQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Search & Filter Strip ────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#FAF5EB]/95 backdrop-blur-md border-b border-[#D4BE98] -mx-4 sm:-mx-8 px-4 sm:px-8 py-3.5 space-y-3 shadow-xs">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories by name, place, ruler, war or era…"
                className="w-full bg-[#FAF5EB] border border-[#D4BE98] rounded-md pl-10 pr-12 py-2.5 text-[13.5px] text-[#34291F] placeholder:text-[#9C8975] focus:outline-none focus:border-[#A8523B] focus:ring-1 focus:ring-[#A8523B]/30 transition-all shadow-inner"
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

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#FAF5EB] border border-[#D4BE98] rounded-md px-3 py-2 text-[12px] text-[#34291F] focus:outline-none focus:border-[#A8523B] cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      Sort: {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Found Count Badge */}
              <div className="flex items-center text-[12px] text-[#7C6A52] px-3.5 py-2 bg-[#FAF5EB] border border-[#D4BE98] rounded-md shrink-0">
                <span className="font-semibold text-[#34291F] mr-1 tabular-nums">
                  {stories.length}
                </span>{" "}
                found
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`text-[12px] sm:text-[12.5px] px-3.5 py-1.5 rounded-md border font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                selectedCategory === "all"
                  ? "bg-[#A8523B] text-[#FAF5EB] border-[#A8523B] shadow-xs"
                  : "bg-[#FAF5EB] text-[#34291F] border-[#D4BE98] hover:bg-[#F2E8D5]"
              }`}
            >
              <span>All stories</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-semibold ${
                  selectedCategory === "all" ? "bg-[#8D3823] text-white" : "bg-[#D4BE98]/60 text-[#7C6A52]"
                }`}
              >
                {counts.total || stories.length}
              </span>
            </button>

            {Object.entries(CATEGORY_CONFIG).map(([catKey, config]) => {
              const isSelected = selectedCategory === catKey;
              const count = counts.byCategory?.[catKey] ?? 0;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`text-[12px] sm:text-[12.5px] px-3.5 py-1.5 rounded-md border font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#A8523B] text-[#FAF5EB] border-[#A8523B] shadow-xs"
                      : "bg-[#FAF5EB] text-[#34291F] border-[#D4BE98] hover:bg-[#F2E8D5]"
                  }`}
                >
                  <span>{config.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-semibold ${
                      isSelected ? "bg-[#8D3823] text-white" : "bg-[#D4BE98]/60 text-[#7C6A52]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Era Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-[#D4BE98]/40">
            <span className="text-[10.5px] font-bold text-[#7C6A52] uppercase tracking-wider shrink-0 mr-1">
              ERA
            </span>
            {STORY_ERAS.map((era) => {
              const isSelected = selectedEra === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => setSelectedEra(era.id)}
                  className={`text-[11.5px] px-3 py-1 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[#2E2822] text-[#FAF5EB] border-[#2E2822] font-semibold shadow-2xs"
                      : "bg-[#FAF5EB] text-[#7C6A52] border-[#D4BE98] hover:border-[#7C6A52] hover:text-[#34291F]"
                  }`}
                >
                  {era.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Featured Story Banner (Shown on default view) ───────────── */}
      {featuredStory && (
        <FeaturedStoryCard
          story={featuredStory}
          onSelectStory={onSelectStory}
        />
      )}

      {/* ── Stories Grid ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[#D4BE98] pb-2">
          <h2 className="font-serif text-[22px] sm:text-[24px] font-bold text-[#34291F]">
            All Stories
          </h2>
          <span className="text-[12px] text-[#7C6A52] tabular-nums font-medium">
            {stories.length} {stories.length === 1 ? "story" : "stories"} found
          </span>
        </div>

        {loading ? (
          <div className="space-y-6" role="status" aria-live="polite">
            <div className="flex flex-col items-center justify-center py-6 text-[#7C6A52]">
              <div className="w-6 h-6 border-2 border-[#A8523B] border-t-transparent rounded-full animate-spin motion-reduce:animate-none mb-2.5" />
              <p className="text-[13px] font-medium text-[#7C6A52]">Loading historical narratives…</p>
            </div>
            {/* Lightweight Parchment skeleton card grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#FAF5EB] border border-[#D4BE98] rounded-md overflow-hidden animate-pulse motion-reduce:animate-none flex flex-col h-[320px]"
                >
                  <div className="h-[120px] bg-[#EAE0CB]/70 w-full" />
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-2">
                      <div className="h-3 bg-[#EAE0CB] rounded w-1/3" />
                      <div className="h-5 bg-[#EAE0CB] rounded w-4/5" />
                      <div className="h-3 bg-[#EAE0CB] rounded w-full" />
                      <div className="h-3 bg-[#EAE0CB] rounded w-2/3" />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#D4BE98]/40">
                      <div className="h-3 bg-[#EAE0CB] rounded w-1/4" />
                      <div className="h-3 bg-[#EAE0CB] rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-[#FAF5EB] border border-[#A8523B]/30 rounded-lg p-6 text-center text-[#A8523B]">
            <p className="font-semibold text-[14px] mb-1">Failed to load stories</p>
            <p className="text-[12.5px] text-[#7C6A52] mb-3">{error}</p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-[12px] font-medium underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-10 text-center text-[#7C6A52]">
            <p className="font-serif text-[18px] text-[#34291F] font-bold mb-1">
              No matching stories found
            </p>
            <p className="text-[13px] mb-4">
              Try adjusting your search terms, selecting "All stories", or choosing another historical era.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedEra("all");
                setSearchQuery("");
              }}
              className="px-3.5 py-1.5 rounded bg-[#A8523B] text-[#FAF5EB] text-[12px] font-medium hover:bg-[#93422E] transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <StoryCard
                key={story.slug}
                story={story}
                onSelectStory={onSelectStory}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
