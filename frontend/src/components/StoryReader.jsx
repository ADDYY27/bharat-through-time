import { useState, useEffect, useRef, useMemo } from "react";
import { fetchApi } from "../utils/api";
import { CATEGORY_CONFIG, STORY_METADATA_LOOKUP } from "../utils/storyTokens";
import { formatPeriod, formatYear } from "../utils/formatYear";
import StoryLocatorMap from "./StoryLocatorMap";
import EntityProfileModal from "./EntityProfileModal";

export default function StoryReader({
  slug,
  onBackToStories,
  onSelectStory,
  onOpenRecords,
  onExploreOnMap,
}) {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active chapter for scroll-spy
  const [activeChapter, setActiveChapter] = useState(1);
  const [readingProgress, setReadingProgress] = useState(0);

  // Entity profile modal state for linked database records
  const [selectedEntityModal, setSelectedEntityModal] = useState(null);

  const contentRef = useRef(null);

  // Fetch full published story
  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchApi(`/stories/${slug}`, {}, 1, 15000)
      .then((data) => {
        if (isMounted) {
          setStory(data);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load story");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Scroll spy & reading progress calculation
  useEffect(() => {
    function handleScroll() {
      if (!story || !story.chapters || story.chapters.length === 0) return;

      // Calculate total page reading progress
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100));
        setReadingProgress(Math.round(progress));
      }

      // Check which chapter is currently in view
      const chapterElements = story.chapters
        .map((ch) => ({
          order: ch.order,
          el: document.getElementById(`chapter-${ch.order}`),
        }))
        .filter((item) => item.el !== null);

      const scrollPos = window.scrollY + 180;
      for (let i = chapterElements.length - 1; i >= 0; i--) {
        const { order, el } = chapterElements[i];
        if (el.offsetTop <= scrollPos) {
          setActiveChapter(order);
          break;
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [story]);

  function scrollToChapter(chapterOrder) {
    const el = document.getElementById(`chapter-${chapterOrder}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  const categoryConfig = useMemo(() => {
    if (!story) return CATEGORY_CONFIG.civilisation;
    return CATEGORY_CONFIG[story.category] || CATEGORY_CONFIG.civilisation;
  }, [story]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-[#7C6A52]">
        <div className="w-8 h-8 border-2 border-[#A8523B] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[14px]">Loading narrated story...</p>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif text-[24px] font-bold text-[#A8523B] mb-2">
          Story Not Found
        </h2>
        <p className="text-[14px] text-[#7C6A52] mb-6">
          {error || "The requested historical narrative could not be retrieved."}
        </p>
        <button
          onClick={onBackToStories}
          className="inline-flex items-center gap-1.5 bg-[#A8523B] text-[#FAF5EB] px-4 py-2 rounded text-[13px] font-medium hover:bg-[#93422E] transition-colors cursor-pointer"
        >
          ← Back to Stories
        </button>
      </div>
    );
  }

  const periodLabel = formatPeriod(story.period);
  const chapterCount = story.chapters ? story.chapters.length : 0;

  // Split places: top 3 as primary on-map places, remaining as key sites chips
  const allPlaces = story.links?.places || [];
  const primaryPlaces = allPlaces.slice(0, 3);
  const extraPlaces = allPlaces.slice(3);

  return (
    <div className="min-h-full bg-[#F2E8D5] text-[#34291F] pb-16">
      {/* ── Top Header Navigation Bar ───────────────────────────────── */}
      <div className="border-b border-[#D4BE98]/70 bg-[#FAF5EB] px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[12px] text-[#7C6A52] overflow-x-auto no-scrollbar">
            <button
              onClick={onBackToStories}
              aria-label="Back to all stories"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#FAF5EB] hover:bg-[#F2E8D5] border border-[#D4BE98] font-medium text-[#34291F] transition-colors cursor-pointer text-[12px] shadow-2xs shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8523B] focus-visible:ring-offset-1"
            >
              <span>← Back to Stories</span>
            </button>
            <div className="flex items-center gap-2 text-[#7C6A52] whitespace-nowrap">
              <span>Explore</span>
              <span className="text-[#DECDB3]">/</span>
              <span>Stories</span>
              <span className="text-[#DECDB3]">/</span>
              <span className="capitalize">{categoryConfig.singular}</span>
              <span className="text-[#DECDB3]">/</span>
              <span className="text-[#34291F] font-medium truncate max-w-[280px]">
                {story.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Wide Category-Tinted Hero Band ─────────────────────────── */}
      <div
        className={`w-full h-44 sm:h-52 md:h-60 ${
          categoryConfig.heroBg || "bg-[#EAE0CB]"
        } border-b border-[#D4BE98]/70 relative overflow-hidden transition-colors flex items-center justify-center`}
        aria-hidden="true"
      >
        {/* Subtle decorative historical watermark */}
        <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full max-w-4xl text-[#34291F]"
            fill="currentColor"
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M50 0 L50 100 M0 50 L100 50" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 3" />
          </svg>
        </div>
      </div>

      {/* ── Overlapping Story Intro Card ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-20 sm:-mt-24 md:-mt-28 relative z-10 mb-8">
        <header className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Title, Deck, Metadata & Action Buttons */}
            <div className="lg:col-span-8">
              <div className="mb-3">
                <span
                  className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded border tracking-wider ${categoryConfig.tagBg} ${categoryConfig.tagText} ${categoryConfig.tagBorder}`}
                >
                  {categoryConfig.singular}
                </span>
              </div>

              <h1 className="font-serif text-[30px] sm:text-[38px] lg:text-[44px] font-bold text-[#2C241D] tracking-tight leading-[1.12] mb-3">
                {story.title}
              </h1>

              <p className="text-[15px] sm:text-[16px] text-[#4E3E2E] leading-relaxed mb-5 max-w-2xl font-sans">
                {story.deck}
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[12.5px] text-[#7C6A52] mb-6">
                <span className="font-semibold text-[#A8523B] tabular-nums">
                  {periodLabel}
                </span>
                {story.region && (
                  <>
                    <span className="text-[#7C6A52]/60">·</span>
                    <span>{story.region}</span>
                  </>
                )}
                <span className="text-[#7C6A52]/60">·</span>
                <span>{story.readMinutes} min read</span>
                <span className="text-[#7C6A52]/60">·</span>
                <span>{chapterCount} chapters</span>
              </div>

              {/* Primary 'Start reading' & secondary 'Skip to chapters' */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => scrollToChapter(1)}
                  className="inline-flex items-center gap-2 bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] font-semibold text-[13px] px-5 py-2.5 rounded shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8523B]"
                >
                  <span>Start reading ↓</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToChapter(1)}
                  className="text-[12.5px] text-[#7C6A52] hover:text-[#34291F] underline underline-offset-4 decoration-[#D4BE98] cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8523B] rounded"
                >
                  Skip to chapters instead
                </button>
              </div>
            </div>

            {/* Right Column: Locator Map Card */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="w-full max-w-sm">
                <StoryLocatorMap
                  locator={story.locator}
                  regionLabel={story.region}
                  category={story.category}
                  onMap={story.onMap}
                />
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ── Main Layout: 3 Columns (TOC, Content, Linked Records) ───── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Table of Contents & Reading Progress ───── */}
          <aside className="lg:col-span-2">
            <div className="sticky top-20 bg-transparent flex flex-col gap-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block">
                In this story
              </span>

              <nav className="flex flex-col gap-1.5" aria-label="Table of contents">
                {(story.chapters || []).map((ch) => {
                  const isActive = activeChapter === ch.order;
                  return (
                    <button
                      key={ch.order}
                      type="button"
                      onClick={() => scrollToChapter(ch.order)}
                      className={`text-left px-2 py-1.5 rounded text-[12px] transition-all flex items-start gap-2 cursor-pointer ${
                        isActive
                          ? "bg-[#FAF5EB] text-[#2C241D] font-bold border-l-2 border-[#A8523B] shadow-2xs"
                          : "text-[#554332] hover:text-[#2C241D] hover:bg-[#FAF5EB]/60 font-normal"
                      }`}
                    >
                      <span
                        className={`font-serif font-bold text-[12.5px] tabular-nums shrink-0 ${
                          isActive ? "text-[#A8523B]" : "text-[#7C6A52]"
                        }`}
                      >
                        {ch.order}
                      </span>
                      <span className="line-clamp-2 leading-snug">{ch.heading}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Reading Progress Indicator */}
              <div className="pt-3 border-t border-[#D4BE98]/70">
                <div className="flex justify-between items-center text-[10px] text-[#7C6A52] mb-1.5">
                  <span>Reading progress</span>
                  <span className="font-semibold text-[#A8523B] tabular-nums">{readingProgress}%</span>
                </div>
                <div className="w-full h-1 bg-[#D4BE98]/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#A8523B] transition-all duration-150 rounded-full"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
              </div>

              {/* Compact Historical Story Timeline in Left Rail */}
              {story.timelineNodes && story.timelineNodes.length > 0 && (
                <div className="pt-4 border-t border-[#D4BE98]/70 hidden lg:block">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-3">
                    Story Timeline
                  </span>
                  <div className="relative pl-3 border-l border-[#D4BE98] space-y-2.5">
                    {story.timelineNodes.map((node, i) => {
                      const isActive = activeChapter === node.chapterOrder;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => scrollToChapter(node.chapterOrder)}
                          className="flex items-center gap-2 group cursor-pointer text-left focus:outline-hidden"
                        >
                          <div
                            className={`w-2 h-2 rounded-full border -ml-[17px] shrink-0 transition-all ${
                              isActive
                                ? "bg-[#A8523B] border-[#A8523B] ring-2 ring-[#A8523B]/30 scale-125"
                                : "bg-[#FAF5EB] border-[#7C6A52] group-hover:border-[#A8523B]"
                            }`}
                          />
                          <span
                            className={`text-[11px] leading-tight transition-colors ${
                              isActive
                                ? "font-bold text-[#A8523B]"
                                : "text-[#7C6A52] group-hover:text-[#34291F]"
                            }`}
                          >
                            {node.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Center Column: Facts, Timeline & Chapters ───────────── */}
          <main ref={contentRef} className="lg:col-span-7 flex flex-col gap-8">
            {/* At-a-glance Facts */}
            {story.facts && story.facts.length > 0 && (
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {story.facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="bg-[#FAF5EB] border border-[#D4BE98] rounded-md p-3 flex flex-col justify-between shadow-2xs"
                  >
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#7C6A52] mb-1">
                      {fact.label}
                    </span>
                    <span className="text-[12px] sm:text-[13px] font-medium text-[#34291F] leading-snug">
                      {fact.value}
                    </span>
                  </div>
                ))}
              </section>
            )}

            {/* Story Timeline (Center view on tablet/mobile) */}
            {story.timelineNodes && story.timelineNodes.length > 0 && (
              <section className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-5 shadow-2xs lg:hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-5">
                  Story Timeline
                </span>

                <div className="relative w-full py-4 min-h-[58px]">
                  {/* Timeline Bar Line */}
                  <div className="absolute top-5 left-3 right-3 h-[1.5px] bg-[#D4BE98]" />

                  {/* Timeline Nodes */}
                  {story.timelineNodes.map((node, i) => {
                    const isActive = activeChapter === node.chapterOrder;
                    const leftPercent =
                      typeof node.position === "number"
                        ? Math.max(5, Math.min(95, node.position * 100))
                        : (i / Math.max(1, story.timelineNodes.length - 1)) * 90 + 5;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => scrollToChapter(node.chapterOrder)}
                        className="absolute top-3.5 -translate-x-1/2 flex flex-col items-center group cursor-pointer focus:outline-hidden"
                        style={{ left: `${leftPercent}%` }}
                      >
                        {/* Dot */}
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-[1.5px] transition-all duration-200 ${
                            isActive
                              ? "bg-[#A8523B] border-[#A8523B] ring-3 ring-[#A8523B]/20 scale-110"
                              : "bg-[#FAF5EB] border-[#7C6A52] group-hover:border-[#A8523B] group-hover:scale-115"
                          }`}
                        />
                        {/* Label */}
                        <span
                          className={`text-[10px] mt-2 whitespace-nowrap text-center transition-colors leading-tight ${
                            isActive
                              ? "font-bold text-[#A8523B]"
                              : "text-[#7C6A52] group-hover:text-[#34291F]"
                          }`}
                        >
                          {node.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Chapters */}
            <div className="flex flex-col gap-10">
              {(story.chapters || []).map((chapter) => {
                const hasKeyIdea =
                  story.keyIdea && story.keyIdea.chapterOrder === chapter.order;
                const formattedOrder = String(chapter.order).padStart(2, "0");
                const chapterDate = chapter.dateLabel || (chapter.year ? formatYear(chapter.year) : null);
                const chapterEyebrow = `CHAPTER ${formattedOrder}${chapterDate ? ` · ${chapterDate}` : ""}`;

                return (
                  <article
                    key={chapter.order}
                    id={`chapter-${chapter.order}`}
                    className="scroll-mt-28 border-b border-[#D4BE98]/40 pb-8 last:border-b-0"
                  >
                    <div className="mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8523B] block mb-1">
                        {chapterEyebrow}
                      </span>
                      <h2 className="font-serif text-[23px] sm:text-[27px] font-bold text-[#2C241D] tracking-tight leading-snug">
                        {chapter.heading}
                      </h2>
                    </div>

                    <p className="text-[15.5px] sm:text-[16.5px] text-[#34291F] leading-[1.8] font-sans">
                      {chapter.body}
                    </p>

                    {/* Key Idea Callout if attached to this chapter */}
                    {hasKeyIdea && (
                      <div className="border border-[#A8523B]/80 bg-[#FAF5EB] p-4 sm:p-5 rounded-md my-6 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8523B] block mb-1.5">
                          KEY IDEA
                        </span>
                        <blockquote className="font-serif text-[14.5px] sm:text-[15px] italic text-[#4E3E2E] leading-relaxed">
                          "{story.keyIdea.text}"
                        </blockquote>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </main>

          {/* ── Right Column: Linked Records, Sources & Confidence ──── */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            {/* Action Buttons: View on map & Open records */}
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!story.onMap}
                onClick={() => {
                  if (story.onMap && onExploreOnMap) {
                    onExploreOnMap(story);
                  }
                }}
                title={
                  story.onMap
                    ? "View on historical map"
                    : "Outside the 1700–1820 atlas range"
                }
                className={`py-2 px-3 rounded text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  story.onMap
                    ? "bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] cursor-pointer shadow-2xs"
                    : "bg-[#EAE0CB] text-[#7C6A52] opacity-60 cursor-not-allowed border border-[#D4BE98]"
                }`}
              >
                <span>View on map</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenRecords) onOpenRecords(story);
                }}
                className="py-2 px-3 rounded text-[12px] font-semibold bg-[#FAF5EB] hover:bg-[#F2E8D5] text-[#34291F] border border-[#D4BE98] transition-colors cursor-pointer text-center shadow-2xs"
              >
                Open records
              </button>
            </div>

            {/* Unified Info Card */}
            <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-4 flex flex-col gap-5 shadow-2xs">
              {/* PLACES */}
              {primaryPlaces.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-2">
                    Places
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {primaryPlaces.map((place, idx) => {
                      const hasEntity = Boolean(place.entityId);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (hasEntity) {
                              setSelectedEntityModal({
                                kind: "place",
                                id: place.entityId._id || place.entityId,
                                label: place.name,
                              });
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded bg-[#F2E8D5]/70 border border-[#D4BE98] text-left transition-colors ${
                            hasEntity
                              ? "hover:bg-[#F2E8D5] cursor-pointer group"
                              : "cursor-default"
                          }`}
                        >
                          <span
                            className={`text-[12px] font-medium text-[#34291F] ${
                              hasEntity ? "group-hover:text-[#A8523B]" : ""
                            }`}
                          >
                            {place.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#DDE9DD] text-[#2B5433] border border-[#BDD4BE] font-semibold">
                            On map
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* KEY SITES (extra unlinked places) */}
              {extraPlaces.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-2">
                    Key Sites
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {extraPlaces.map((place, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-0.5 rounded bg-[#EAE0CB] text-[#7C6A52] border border-[#D4BE98] select-none"
                        title="Site outside the 1700–1820 catalogued database"
                      >
                        {place.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* PEOPLE */}
              {story.links?.people && story.links.people.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-2">
                    People
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {story.links.people.map((person, idx) => {
                      const hasEntity = Boolean(person.entityId);
                      return hasEntity ? (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setSelectedEntityModal({
                              kind: "ruler",
                              id: person.entityId._id || person.entityId,
                              label: person.name,
                            })
                          }
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded bg-[#F2E8D5] hover:bg-[#A8523B] hover:text-[#FAF5EB] text-[#34291F] border border-[#D4BE98] transition-colors cursor-pointer"
                        >
                          {person.name}
                        </button>
                      ) : (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-0.5 rounded bg-[#EAE0CB] text-[#7C6A52] border border-[#D4BE98] select-none"
                        >
                          {person.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RELATED STORIES */}
              {story.relatedStories && story.relatedStories.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-2">
                    Related Stories
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {story.relatedStories.map((relSlug) => {
                      const meta = STORY_METADATA_LOOKUP[relSlug] || {
                        title: relSlug
                          .split("-")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" "),
                        date: "",
                      };
                      return (
                        <button
                          key={relSlug}
                          type="button"
                          onClick={() => onSelectStory(relSlug)}
                          className="text-left p-2 rounded bg-[#F2E8D5]/60 hover:bg-[#F2E8D5] border border-[#D4BE98] transition-colors cursor-pointer group flex items-center justify-between gap-2"
                        >
                          <span className="text-[12px] font-medium text-[#34291F] group-hover:text-[#A8523B] leading-snug truncate">
                            {meta.title}
                          </span>
                          {meta.date && (
                            <span className="text-[10.5px] text-[#7C6A52] font-mono shrink-0">
                              {meta.date}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SOURCES */}
              {story.sources && story.sources.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-1.5">
                    Sources
                  </span>
                  <div className="text-[11.5px] text-[#7C6A52] flex flex-wrap items-center gap-1 leading-snug">
                    {story.sources.map((src, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1">
                        {src.url ? (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#A8523B] underline underline-offset-2 decoration-[#D4BE98] transition-colors"
                          >
                            {src.title}
                          </a>
                        ) : (
                          <span>{src.title}</span>
                        )}
                        {idx < story.sources.length - 1 && (
                          <span className="text-[#DECDB3]">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CONFIDENCE */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-1.5">
                  Confidence
                </span>
                <div className="grid grid-cols-3 gap-1 mb-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      ["low", "medium", "high"].includes(story.confidence)
                        ? "bg-[#A8523B]"
                        : "bg-[#D4BE98]/50"
                    }`}
                  />
                  <div
                    className={`h-1.5 rounded-full ${
                      ["medium", "high"].includes(story.confidence)
                        ? "bg-[#A8523B]"
                        : "bg-[#D4BE98]/50"
                    }`}
                  />
                  <div
                    className={`h-1.5 rounded-full ${
                      story.confidence === "high" ? "bg-[#A8523B]" : "bg-[#D4BE98]/50"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#7C6A52] leading-tight">
                  {story.confidenceNote || `${story.confidence.toUpperCase()} confidence`}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Bottom Section: Next Story Recommendation Card ─────────── */}
      {story.nextStory && (
        <section className="mt-14 border-t border-[#D4BE98] bg-[#FAF5EB] py-8 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-1">
                NEXT STORY
              </span>
              <h3 className="font-serif text-[22px] sm:text-[26px] font-bold text-[#2C241D] mb-1">
                {story.nextStory.title}
              </h3>
              <div className="flex items-center gap-2 text-[12px] text-[#7C6A52]">
                <span className="font-semibold text-[#A8523B] tabular-nums">
                  {formatPeriod(story.nextStory.period)}
                </span>
                <span>·</span>
                <span>{story.nextStory.readMinutes} min read</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectStory(story.nextStory.slug)}
              className="inline-flex items-center gap-2 bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] font-medium text-[13px] px-5 py-2.5 rounded shadow-2xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8523B]"
            >
              <span>Continue reading</span>
              <span>→</span>
            </button>
          </div>
        </section>
      )}

      {/* Entity Profile Modal for linked database records */}
      {selectedEntityModal && (
        <EntityProfileModal
          isOpen={true}
          onClose={() => setSelectedEntityModal(null)}
          initialEntity={selectedEntityModal}
        />
      )}
    </div>
  );
}
