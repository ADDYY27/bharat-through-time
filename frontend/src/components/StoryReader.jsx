import { useState, useEffect, useRef, useMemo } from "react";
import { fetchApi } from "../utils/api";
import { CATEGORY_CONFIG } from "../utils/storyTokens";
import { formatPeriod } from "../utils/formatYear";
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
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#7C6A52]">
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

  // Separate places with db IDs vs unlinked sites
  const placesWithId = (story.links?.places || []).filter((p) => p.entityId);
  const unlinkedPlaces = (story.links?.places || []).filter((p) => !p.entityId);

  return (
    <div className="min-h-full bg-[#F2E8D5] text-[#34291F] pb-24">
      {/* ── Top Header Navigation Bar ───────────────────────────────── */}
      <div className="border-b border-[#D4BE98] bg-[#FAF5EB]/80 sticky top-0 z-20 backdrop-blur-xs px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-[12px] text-[#7C6A52] overflow-x-auto no-scrollbar">
            <button
              onClick={onBackToStories}
              className="inline-flex items-center gap-1 font-semibold text-[#A8523B] hover:text-[#93422E] transition-colors cursor-pointer"
            >
              <span>← Back to Stories</span>
            </button>
            <span className="text-[#DECDB3]">/</span>
            <span>Explore</span>
            <span className="text-[#DECDB3]">/</span>
            <span>Stories</span>
            <span className="text-[#DECDB3]">/</span>
            <span
              className={`text-[9.5px] uppercase font-semibold px-1.5 py-0.5 rounded border tracking-wide ${categoryConfig.tagBg} ${categoryConfig.tagText} ${categoryConfig.tagBorder}`}
            >
              {categoryConfig.singular}
            </span>
            <span className="text-[#DECDB3]">/</span>
            <span className="text-[#34291F] font-medium truncate max-w-[220px]">
              {story.title}
            </span>
          </div>

          {/* Reading progress badge on top bar */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#7C6A52]">
            <span>Reading progress:</span>
            <span className="font-semibold text-[#A8523B] tabular-nums">
              {readingProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Story Header Hero ────────────────────────────────────────── */}
      <header className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-8 border-b border-[#D4BE98]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <div className="mb-3">
              <span
                className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border tracking-wider ${categoryConfig.tagBg} ${categoryConfig.tagText} ${categoryConfig.tagBorder}`}
              >
                {categoryConfig.singular}
              </span>
            </div>

            <h1 className="font-serif text-[32px] sm:text-[40px] lg:text-[46px] font-bold text-[#34291F] tracking-tight leading-tight mb-4">
              {story.title}
            </h1>

            <p className="text-[15px] sm:text-[16.5px] text-[#554332] leading-relaxed mb-5 max-w-3xl">
              {story.deck}
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[12.5px] text-[#7C6A52]">
              <span className="font-semibold text-[#A8523B] tabular-nums">
                {periodLabel}
              </span>
              <span className="text-[#DECDB3]">·</span>
              <span>{story.region}</span>
              <span className="text-[#DECDB3]">·</span>
              <span>{story.readMinutes} min read</span>
              <span className="text-[#DECDB3]">·</span>
              <span>{chapterCount} chapters</span>
            </div>
          </div>

          {/* Header Locator Map */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-full max-w-xs">
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

      {/* ── Main Layout: 3 Columns (TOC, Content, Linked Records) ───── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Left Column: Table of Contents & Reading Progress ───── */}
          <aside className="lg:col-span-3">
            <div className="sticky top-20 bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-4 sm:p-5 shadow-xs">
              <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-[#7C6A52] mb-3">
                In this story
              </h2>

              <nav className="flex flex-col gap-1 mb-6">
                {(story.chapters || []).map((ch) => {
                  const isActive = activeChapter === ch.order;
                  return (
                    <button
                      key={ch.order}
                      onClick={() => scrollToChapter(ch.order)}
                      className={`text-left px-2.5 py-1.5 rounded text-[12.5px] transition-all flex items-start gap-2.5 cursor-pointer ${
                        isActive
                          ? "bg-[#F2E8D5] text-[#A8523B] font-semibold border-l-2 border-[#A8523B]"
                          : "text-[#554332] hover:text-[#34291F] hover:bg-[#F2E8D5]/50"
                      }`}
                    >
                      <span className="font-serif font-bold text-[#A8523B] tabular-nums text-[13px] shrink-0">
                        {ch.order}
                      </span>
                      <span className="line-clamp-2 leading-snug">{ch.heading}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Reading Progress Indicator */}
              <div className="pt-3 border-t border-[#DECDB3]">
                <div className="flex justify-between items-center text-[10.5px] text-[#7C6A52] mb-1.5">
                  <span>Reading progress</span>
                  <span className="font-semibold text-[#A8523B] tabular-nums">
                    {readingProgress}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EAE0CB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#A8523B] transition-all duration-150 rounded-full"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── Center Column: Facts, Timeline & Chapters ───────────── */}
          <main ref={contentRef} className="lg:col-span-6 flex flex-col gap-8">
            {/* At-a-glance Facts */}
            {story.facts && story.facts.length > 0 && (
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {story.facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="bg-[#FAF5EB] border border-[#D4BE98] rounded-md p-3 flex flex-col justify-between"
                  >
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#7C6A52] mb-1">
                      {fact.label}
                    </span>
                    <span className="text-[12px] sm:text-[12.5px] font-medium text-[#34291F] leading-snug">
                      {fact.value}
                    </span>
                  </div>
                ))}
              </section>
            )}

            {/* Story Timeline */}
            {story.timelineNodes && story.timelineNodes.length > 0 && (
              <section className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-6">
                  Story Timeline
                </span>

                <div className="relative w-full px-2 py-4">
                  {/* Timeline Bar Line */}
                  <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-[#D4BE98] -translate-y-1/2" />

                  {/* Timeline Nodes */}
                  <div className="relative flex justify-between items-center">
                    {story.timelineNodes.map((node, i) => {
                      const isActive = activeChapter === node.chapterOrder;
                      return (
                        <div
                          key={i}
                          onClick={() => scrollToChapter(node.chapterOrder)}
                          className="flex flex-col items-center group cursor-pointer"
                          style={{
                            maxWidth: "80px",
                          }}
                        >
                          {/* Dot */}
                          <div
                            className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                              isActive
                                ? "bg-[#A8523B] border-[#A8523B] ring-4 ring-[#A8523B]/20 scale-110"
                                : "bg-[#FAF5EB] border-[#A8523B] group-hover:scale-125"
                            }`}
                          />
                          {/* Label */}
                          <span
                            className={`text-[10.5px] mt-2 text-center transition-colors leading-tight ${
                              isActive
                                ? "font-bold text-[#A8523B]"
                                : "text-[#7C6A52] group-hover:text-[#34291F]"
                            }`}
                          >
                            {node.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Chapters */}
            <div className="flex flex-col gap-10">
              {(story.chapters || []).map((chapter) => {
                const hasKeyIdea = story.keyIdea && story.keyIdea.chapterOrder === chapter.order;
                return (
                  <article
                    key={chapter.order}
                    id={`chapter-${chapter.order}`}
                    className="scroll-mt-28"
                  >
                    <div className="flex items-baseline gap-3 mb-2.5">
                      <span className="font-serif text-[24px] sm:text-[28px] font-bold text-[#A8523B] tabular-nums leading-none">
                        {String(chapter.order).padStart(2, "0")}
                      </span>
                      <h3 className="font-serif text-[20px] sm:text-[23px] font-bold text-[#34291F] tracking-tight leading-snug">
                        {chapter.heading}
                      </h3>
                    </div>

                    <p className="text-[14.5px] sm:text-[15.5px] text-[#34291F] leading-relaxed font-sans mb-4">
                      {chapter.body}
                    </p>

                    {/* Key Idea Callout if attached to this chapter */}
                    {hasKeyIdea && (
                      <div className="bg-[#FAF5EB] border-l-4 border-[#A8523B] border-y border-r border-[#D4BE98] rounded-r-lg p-4 sm:p-5 my-5 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8523B] block mb-1.5">
                          KEY IDEA
                        </span>
                        <blockquote className="font-serif text-[14.5px] sm:text-[15px] italic text-[#554332] leading-relaxed">
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
          <aside className="lg:col-span-3 flex flex-col gap-6">
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
                    ? "bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] cursor-pointer shadow-xs"
                    : "bg-[#EAE0CB] text-[#7C6A52] opacity-60 cursor-not-allowed border border-[#D4BE98]"
                }`}
              >
                <span>View on map</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenRecords) onOpenRecords(story);
                }}
                className="py-2 px-3 rounded text-[12px] font-semibold bg-[#FAF5EB] hover:bg-[#F2E8D5] text-[#34291F] border border-[#D4BE98] transition-colors cursor-pointer text-center"
              >
                Open records
              </button>
            </div>

            {/* Places */}
            {story.links?.places && story.links.places.length > 0 && (
              <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-3">
                  Places
                </span>

                {/* Database linked places (clickable) */}
                {placesWithId.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-3">
                    {placesWithId.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setSelectedEntityModal({
                            kind: "place",
                            id: place.entityId._id || place.entityId,
                            label: place.name,
                          })
                        }
                        className="flex items-center justify-between p-2 rounded bg-[#F2E8D5]/60 hover:bg-[#F2E8D5] border border-[#D4BE98] text-left transition-colors cursor-pointer group"
                      >
                        <span className="text-[12.5px] font-medium text-[#34291F] group-hover:text-[#A8523B]">
                          {place.name}
                        </span>
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#DDE9DD] text-[#2B5433] border border-[#BDD4BE] font-semibold">
                          On map
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Unlinked sites (plain, non-clickable chips) */}
                {unlinkedPlaces.length > 0 && (
                  <div>
                    <span className="text-[9.5px] font-semibold uppercase text-[#7C6A52] block mb-2">
                      Key Sites
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {unlinkedPlaces.map((place, idx) => (
                        <span
                          key={idx}
                          className="text-[11.5px] px-2 py-1 rounded bg-[#EAE0CB] text-[#7C6A52] border border-[#D4BE98] select-none"
                          title="Site outside the 1700–1820 catalogued database"
                        >
                          {place.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* People & Figures */}
            {story.links?.people && story.links.people.length > 0 && (
              <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-2.5">
                  People
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {story.links.people.map((person, idx) =>
                    person.entityId ? (
                      <button
                        key={idx}
                        onClick={() =>
                          setSelectedEntityModal({
                            kind: "ruler",
                            id: person.entityId._id || person.entityId,
                            label: person.name,
                          })
                        }
                        className="text-[11.5px] font-medium px-2.5 py-1 rounded bg-[#F2E8D5] hover:bg-[#A8523B] hover:text-[#FAF5EB] text-[#34291F] border border-[#D4BE98] transition-colors cursor-pointer"
                      >
                        {person.name}
                      </button>
                    ) : (
                      <span
                        key={idx}
                        className="text-[11.5px] px-2.5 py-1 rounded bg-[#EAE0CB] text-[#7C6A52] border border-[#D4BE98] select-none"
                      >
                        {person.name}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Related Stories */}
            {story.relatedStories && story.relatedStories.length > 0 && (
              <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-2.5">
                  Related Stories
                </span>
                <div className="flex flex-col gap-2">
                  {story.relatedStories.map((relSlug) => (
                    <button
                      key={relSlug}
                      onClick={() => onSelectStory(relSlug)}
                      className="text-left p-2 rounded bg-[#F2E8D5]/60 hover:bg-[#F2E8D5] border border-[#D4BE98] transition-colors cursor-pointer group"
                    >
                      <span className="text-[12px] font-semibold text-[#34291F] group-hover:text-[#A8523B] block leading-snug">
                        {relSlug
                          .split("-")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </span>
                      <span className="text-[10.5px] text-[#A8523B] font-medium">
                        Read related story →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {story.sources && story.sources.length > 0 && (
              <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-2">
                  Sources
                </span>
                <ul className="flex flex-col gap-1 text-[11.5px] text-[#7C6A52]">
                  {story.sources.map((src, idx) => (
                    <li key={idx}>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#A8523B] hover:underline flex items-baseline gap-1"
                        >
                          <span>•</span>
                          <span>{src.title}</span>
                          <span className="text-[9px]">↗</span>
                        </a>
                      ) : (
                        <span>• {src.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confidence Level */}
            <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-2">
                Confidence
              </span>

              {/* Segmented meter: 3 segments */}
              <div className="grid grid-cols-3 gap-1 mb-2">
                <div
                  className={`h-1.5 rounded-full ${
                    ["low", "medium", "high"].includes(story.confidence)
                      ? "bg-[#A8523B]"
                      : "bg-[#EAE0CB]"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full ${
                    ["medium", "high"].includes(story.confidence)
                      ? "bg-[#A8523B]"
                      : "bg-[#EAE0CB]"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full ${
                    story.confidence === "high" ? "bg-[#A8523B]" : "bg-[#EAE0CB]"
                  }`}
                />
              </div>

              <p className="text-[11px] text-[#7C6A52] leading-tight">
                {story.confidenceNote || `${story.confidence.toUpperCase()} confidence`}
              </p>
            </div>
          </aside>
        </div>

        {/* ── Bottom Section: Next Story Recommendation Card ─────────── */}
        {story.nextStory && (
          <section className="mt-16 pt-8 border-t border-[#D4BE98]">
            <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-1">
                  NEXT STORY
                </span>
                <h3 className="font-serif text-[22px] sm:text-[26px] font-bold text-[#34291F] mb-1">
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
                onClick={() => onSelectStory(story.nextStory.slug)}
                className="inline-flex items-center gap-2 bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] font-semibold text-[13px] px-5 py-2.5 rounded shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>Continue reading</span>
                <span>→</span>
              </button>
            </div>
          </section>
        )}
      </div>

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
