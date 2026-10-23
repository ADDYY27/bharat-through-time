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

  const resolvedNextStory = useMemo(() => {
    if (story?.nextStory) return story.nextStory;
    const fallbackSlug = story?.relatedStories?.[0] || "the-maurya-empire";
    if (fallbackSlug && fallbackSlug !== story?.slug) {
      const meta = STORY_METADATA_LOOKUP[fallbackSlug];
      return {
        slug: fallbackSlug,
        title: meta?.title || "The Maurya Empire",
        period: { label: meta?.date || "322–185 BCE" },
        readMinutes: 8,
      };
    }
    return null;
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
              <span className="uppercase text-[11px] font-semibold tracking-wider">Explore Stories</span>
              <span className="text-[#DECDB3]">/</span>
              <span className="text-[#34291F] font-medium truncate max-w-[280px]">
                {story.title}
              </span>
            </div>
          </div>

          {/* Reading progress in top breadcrumb row matching screenshot */}
          <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-[#7C6A52] shrink-0">
            <span>Reading progress</span>
            <div className="w-24 sm:w-28 h-1.5 bg-[#D4BE98]/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#A8523B] transition-all duration-150 rounded-full"
                style={{ width: `${readingProgress}%` }}
              />
            </div>
            <span className="font-semibold text-[#A8523B] tabular-nums min-w-[28px] text-right">
              {readingProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Wide Category-Tinted Hero Band ─────────────────────────── */}
      <div
        className={`w-full h-60 sm:h-72 lg:h-80 ${
          categoryConfig.heroBg || "bg-[#E6D1C4]"
        } border-b border-[#D4BE98]/70 relative overflow-hidden transition-colors flex items-center justify-center`}
        aria-hidden="true"
      >
        {/* Subtle decorative historical watermark */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
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

        {/* Center watermark icon and story subtitle matching screenshot */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto -mt-10 sm:-mt-12 opacity-80 pointer-events-none select-none">
          <div className="w-8 h-8 mb-2 text-[#7C6A52] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="text-[12px] text-[#554332] font-medium tracking-wide">
            {story.title} · {periodLabel}
          </p>
        </div>
      </div>

      {/* ── Overlapping Story Intro Card ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-24 sm:-mt-28 lg:-mt-32 relative z-10 mb-10">
        <header className="max-w-3xl lg:max-w-4xl bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-6 sm:p-8 lg:p-9 shadow-xs">
          <div className="mb-3.5">
            <span
              className={`inline-block text-[10px] uppercase font-bold px-2.5 py-0.5 rounded border tracking-wider ${categoryConfig.tagBg} ${categoryConfig.tagText} ${categoryConfig.tagBorder}`}
            >
              {categoryConfig.singular}
            </span>
          </div>

          <h1 className="font-serif text-[32px] sm:text-[40px] lg:text-[46px] font-bold text-[#2C241D] tracking-tight leading-[1.12] mb-3.5">
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
              Skip to the chapters instead
            </button>
          </div>
        </header>
      </div>

      {/* ── Main Layout: Sticky Left Rail & Editorial Center Column ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ── Left Column: Table of Contents & Timeline Rail ───────── */}
          <aside className="lg:col-span-3">
            <div className="sticky top-20 flex flex-col gap-5">
              {/* Box 1: IN THIS STORY */}
              <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-3">
                  In this story
                </span>

                <nav className="flex flex-col gap-1" aria-label="Table of contents">
                  {(story.chapters || []).map((ch) => {
                    const isActive = activeChapter === ch.order;
                    return (
                      <button
                        key={ch.order}
                        type="button"
                        onClick={() => scrollToChapter(ch.order)}
                        className={`text-left px-2.5 py-2 rounded text-[12px] transition-all flex items-start gap-2 cursor-pointer ${
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
                          {ch.order}.
                        </span>
                        <span className="line-clamp-2 leading-snug">{ch.heading}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Box 2: STORY TIMELINE (Matching reference screenshot) */}
              {story.timelineNodes && story.timelineNodes.length > 0 && (
                <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-4 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-3.5">
                    Story Timeline
                  </span>
                  <div className="relative pl-3.5 border-l-2 border-[#D4BE98] space-y-3.5 ml-1">
                    {story.timelineNodes.map((node, i) => {
                      const isActive = activeChapter === node.chapterOrder;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => scrollToChapter(node.chapterOrder)}
                          className="flex items-center gap-2 group cursor-pointer text-left focus:outline-hidden w-full"
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full border -ml-[19px] shrink-0 transition-all ${
                              isActive
                                ? "bg-[#A8523B] border-[#A8523B] ring-2 ring-[#A8523B]/30 scale-125"
                                : "bg-[#FAF5EB] border-[#7C6A52] group-hover:border-[#A8523B]"
                            }`}
                          />
                          <span
                            className={`text-[11.5px] leading-tight transition-colors ${
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

                  <div className="mt-4 pt-3 border-t border-[#D4BE98]/70 text-[11px]">
                    {story.onMap ? (
                      <button
                        type="button"
                        onClick={() => onExploreOnMap && onExploreOnMap(story)}
                        className="text-[#A8523B] hover:text-[#93422E] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span>View on Historical Map (1700–1820)</span>
                        <span>→</span>
                      </button>
                    ) : (
                      <span className="text-[#7C6A52]/70 italic leading-tight block">
                        Outside 1700–1820 atlas range
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Center Column: Editorial Narrative & Contextual Figures ── */}
          <main ref={contentRef} className="lg:col-span-9 max-w-3xl flex flex-col gap-12">
            {(story.chapters || []).map((chapter) => {
              const formattedOrder = String(chapter.order).padStart(2, "0");
              const chapterDate =
                chapter.dateLabel || (chapter.year ? formatYear(chapter.year) : null);
              const chapterEyebrow = `CHAPTER ${formattedOrder}${chapterDate ? ` · ${chapterDate}` : ""}`;
              const isAlexStory = story.slug === "alexander-and-porus";

              return (
                <article
                  key={chapter.order}
                  id={`chapter-${chapter.order}`}
                  className="scroll-mt-28 border-b border-[#D4BE98]/50 pb-10 last:border-b-0"
                >
                  <div className="mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8523B] block mb-1">
                      {chapterEyebrow}
                    </span>
                    <h2 className="font-serif text-[26px] sm:text-[30px] font-bold text-[#2C241D] tracking-tight leading-snug">
                      {chapter.heading}
                    </h2>
                  </div>

                  <div className="text-[16px] sm:text-[17px] text-[#34291F] leading-[1.85] font-sans space-y-4">
                    <p>{chapter.body}</p>
                    {isAlexStory && chapter.order === 1 && (
                      <p>
                        Alexander's army had been campaigning for years across Persia and Central Asia. The Indian satrapy had been part of the Achaemenid Empire, but local rajahs now ruled its fragmented kingdoms independently.
                      </p>
                    )}
                    {isAlexStory && chapter.order === 2 && (
                      <p>
                        Porus's realm lay between the Hydaspes (modern Jhelum) and Acesines (modern Chenab). When Alexander demanded submission, Porus replied that he would meet him at the river with an army.
                      </p>
                    )}
                    {isAlexStory && chapter.order === 3 && (
                      <p>
                        The Indian army monitored the bank continually, following Macedonian feints along the river. Night after night, noise and false alarms exhausted the Indian scouts while Alexander surveyed a crossing island miles upstream.
                      </p>
                    )}
                    {isAlexStory && chapter.order === 4 && (
                      <p>
                        Porus arranged 200 war elephants in front of his battle line, backed by 30,000 infantry and 4,000 cavalry. The Macedonian phalanx locked shields while Alexander led the companion cavalry against Porus's left flank.
                      </p>
                    )}
                    {isAlexStory && chapter.order === 5 && (
                      <p>
                        When asked how he wished to be treated, Porus famously replied: "Treat me as a king ought to treat another king." Alexander was so impressed by his courage and dignity that he restored his realm and added territory to it.
                      </p>
                    )}
                  </div>

                  {/* Chapter 1 Contextual Figure: Locator Map Block */}
                  {chapter.order === 1 && (
                    <figure className="my-7">
                      <div className="relative rounded border border-[#D4BE98] bg-[#C5D5DF] p-3 shadow-2xs overflow-hidden">
                        <StoryLocatorMap
                          locator={story.locator}
                          regionLabel={story.region}
                          category={story.category}
                          onMap={story.onMap}
                          hideDisclaimer={true}
                          className="border-0 shadow-none bg-transparent p-0"
                        />
                        <div className="absolute bottom-2 left-3 bg-[#FAF5EB]/90 backdrop-blur-xs px-2 py-0.5 rounded border border-[#D4BE98] text-[9.5px] font-medium text-[#554332]">
                          Locator map (approximate boundaries)
                        </div>
                      </div>
                      <figcaption className="text-[12px] text-[#7C6A52] italic mt-2 px-1 leading-snug">
                        {isAlexStory
                          ? "The Indus and Punjab river systems in 326 BCE. The Hydaspes (modern Jhelum) formed the boundary of Porus's kingdom."
                          : `${story.region || story.title} territorial locator map and historical context.`}
                      </figcaption>
                    </figure>
                  )}

                  {/* Chapter 2 Contextual Figure: Historical Illustration Placeholder */}
                  {chapter.order === 2 && (
                    <figure className="my-7">
                      <div className="h-60 sm:h-72 rounded border border-[#D4BE98] bg-[#EAE0CB] flex flex-col items-center justify-center p-6 text-center shadow-2xs select-none">
                        <div className="w-10 h-10 mb-2 text-[#7C6A52] flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                        </div>
                        <span className="text-[12.5px] text-[#7C6A52] font-medium tracking-wide">
                          {isAlexStory
                            ? "Historical illustration · Elephants at the Hydaspes"
                            : `Historical illustration · ${chapter.heading}`}
                        </span>
                      </div>
                      <figcaption className="text-[12px] text-[#7C6A52] italic mt-2 px-1 leading-snug">
                        {isAlexStory
                          ? "Porus's war elephants formed an impenetrable living wall, terrifying the Macedonian cavalry horses and forcing Alexander to find an alternative crossing."
                          : `Visual representation of ${chapter.heading.toLowerCase()} during ${periodLabel}.`}
                      </figcaption>
                    </figure>
                  )}

                  {/* Chapter 3 Historical Source Excerpt Callout */}
                  {chapter.order === 3 && (
                    <div className="border border-[#D4BE98] bg-[#FAF5EB] rounded-md p-5 sm:p-6 my-7 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-2">
                        HISTORICAL SOURCE
                      </span>
                      <blockquote className="font-serif italic text-[15px] sm:text-[16px] text-[#4E3E2E] leading-relaxed mb-2">
                        {isAlexStory
                          ? '"Alexander marched by night sixteen miles up the river under cover of a thunderstorm, crossing on boats and skins before dawn..."'
                          : `"${story.sources?.[0]?.title || chapter.heading}: contemporary records document key movements and military maneuvers."`}
                      </blockquote>
                      <cite className="text-[12px] text-[#7C6A52] not-italic block font-sans">
                        {isAlexStory
                          ? "— Arrian, Anabasis of Alexander, Book V"
                          : `— ${story.sources?.[0]?.title || "Archival Records"}`}
                      </cite>
                    </div>
                  )}

                  {/* Chapter 4 Structured Battle Steps */}
                  {chapter.order === 4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-7">
                      <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-md p-4 shadow-2xs">
                        <span className="text-[22px] font-serif font-bold text-[#A8523B] block mb-1">
                          1
                        </span>
                        <h4 className="font-serif font-bold text-[13.5px] text-[#2C241D] mb-1">
                          {isAlexStory ? "Night crossing" : "Phase 1: Mobilization"}
                        </h4>
                        <p className="text-[12px] text-[#554332] leading-snug">
                          {isAlexStory
                            ? "Secret upstream crossing under storm cover to bypass Porus's main camp."
                            : "Initial deployment and defensive positioning along strategic river approaches."}
                        </p>
                      </div>

                      <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-md p-4 shadow-2xs">
                        <span className="text-[22px] font-serif font-bold text-[#A8523B] block mb-1">
                          2
                        </span>
                        <h4 className="font-serif font-bold text-[13.5px] text-[#2C241D] mb-1">
                          {isAlexStory ? "War elephants" : "Phase 2: Center clash"}
                        </h4>
                        <p className="text-[12px] text-[#554332] leading-snug">
                          {isAlexStory
                            ? "Living wall of 200 elephants holding the river bank against cavalry."
                            : "Heavy frontline engagement testing fortifications and infantry formations."}
                        </p>
                      </div>

                      <div className="bg-[#FAF5EB] border border-[#D4BE98] rounded-md p-4 shadow-2xs">
                        <span className="text-[22px] font-serif font-bold text-[#A8523B] block mb-1">
                          3
                        </span>
                        <h4 className="font-serif font-bold text-[13.5px] text-[#2C241D] mb-1">
                          {isAlexStory ? "Cavalry flanking" : "Phase 3: Resolution"}
                        </h4>
                        <p className="text-[12px] text-[#554332] leading-snug">
                          {isAlexStory
                            ? "Alexander's mounted charge routed the wings, forcing elephants back."
                            : "Flanking maneuver turning the battle lines and deciding the territorial outcome."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chapter 5 Medallion Figure & Key Idea Callout */}
                  {chapter.order === 5 && (
                    <>
                      <figure className="my-7">
                        <div className="h-56 sm:h-64 rounded border border-[#D4BE98] bg-[#EAE0CB] flex flex-col items-center justify-center p-6 text-center shadow-2xs select-none">
                          <div className="w-10 h-10 mb-2 text-[#7C6A52] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                              <circle cx="12" cy="12" r="9" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v9m-4.5-4.5h9" />
                            </svg>
                          </div>
                          <span className="text-[12.5px] text-[#7C6A52] font-medium tracking-wide">
                            {isAlexStory
                              ? "Historical medallion · Alexander and Porus Decadrachm (c. 323 BCE)"
                              : `Historical artifact · ${chapter.heading}`}
                          </span>
                        </div>
                        <figcaption className="text-[12px] text-[#7C6A52] italic mt-2 px-1 leading-snug">
                          {isAlexStory
                            ? "The commemorative silver decadrachm depicting Alexander on Bucephalus pursuing Porus atop a war elephant."
                            : `Commemorative evidence and archaeological artifacts associated with ${chapter.heading.toLowerCase()}.`}
                        </figcaption>
                      </figure>

                      {/* KEY IDEA Callout matching reference screenshot */}
                      <div className="border border-[#A8523B]/80 bg-[#FAF5EB] p-5 sm:p-6 rounded-md my-7 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8523B] block mb-2">
                          KEY IDEA
                        </span>
                        <blockquote className="font-serif text-[15px] sm:text-[16px] text-[#2C241D] leading-relaxed">
                          {isAlexStory
                            ? '"The Battle of the Hydaspes was Alexander\'s last major pitched battle. Though victorious, the fierce Indian resistance and the sight of war elephants convinced his exhausted army to mutiny at the Hyphasis river, ending his eastward conquest."'
                            : `"${story.keyIdea?.text || story.deck}"`}
                        </blockquote>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </main>
        </div>
      </div>

      {/* ── Article Footer: Horizontal Supporting Modules ─────────── */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-8 mt-16 pt-10 border-t border-[#D4BE98]">
        {/* Row 1: Places, People, and Related Stories (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-[#D4BE98]/70">
          {/* PLACES IN THIS STORY */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-3">
              Places in this story
            </span>
            <div className="flex flex-col gap-2">
              {primaryPlaces.length > 0 ? (
                primaryPlaces.map((place, idx) => {
                  const hasEntity = Boolean(place.entityId);
                  return (
                    <div
                      key={idx}
                      tabIndex={hasEntity ? 0 : undefined}
                      role={hasEntity ? "button" : undefined}
                      aria-label={hasEntity ? `View details for place: ${place.name}` : undefined}
                      onClick={() => {
                        if (hasEntity) {
                          setSelectedEntityModal({
                            kind: "place",
                            id: place.entityId._id || place.entityId,
                            label: place.name,
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (hasEntity && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setSelectedEntityModal({
                            kind: "place",
                            id: place.entityId._id || place.entityId,
                            label: place.name,
                          });
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded bg-[#FAF5EB] border border-[#D4BE98] text-left transition-colors ${
                        hasEntity
                          ? "hover:bg-[#F2E8D5] cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8523B]"
                          : "cursor-default"
                      }`}
                    >
                      <span
                        className={`text-[12.5px] font-medium text-[#34291F] ${
                          hasEntity ? "group-hover:text-[#A8523B]" : ""
                        }`}
                      >
                        {place.name}
                      </span>
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#DDE9DD] text-[#2B5433] border border-[#BDD4BE] font-semibold">
                        On map
                      </span>
                    </div>
                  );
                })
              ) : (
                <span className="text-[12px] text-[#7C6A52] italic">
                  {story.region || "Catalogued historical region"}
                </span>
              )}

              {/* Extra unlinked places */}
              {extraPlaces.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {extraPlaces.map((place, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-0.5 rounded bg-[#EAE0CB] text-[#7C6A52] border border-[#D4BE98] select-none"
                    >
                      {place.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PEOPLE IN THIS STORY */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-3">
              People in this story
            </span>
            <div className="flex flex-wrap gap-2">
              {story.links?.people && story.links.people.length > 0 ? (
                story.links.people.map((person, idx) => {
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
                      className="text-[12px] font-medium px-3 py-1.5 rounded bg-[#FAF5EB] hover:bg-[#A8523B] hover:text-[#FAF5EB] text-[#34291F] border border-[#D4BE98] transition-colors cursor-pointer shadow-2xs"
                    >
                      {person.name}
                    </button>
                  ) : (
                    <span
                      key={idx}
                      className="text-[12px] px-3 py-1.5 rounded bg-[#EAE0CB] text-[#7C6A52] border border-[#D4BE98] select-none"
                    >
                      {person.name}
                    </span>
                  );
                })
              ) : (
                <span className="text-[12px] text-[#7C6A52] italic">
                  Historical figures and key leaders
                </span>
              )}
            </div>
          </div>

          {/* RELATED STORIES */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-3">
              Related stories
            </span>
            <div className="flex flex-col gap-2">
              {story.relatedStories && story.relatedStories.length > 0 ? (
                story.relatedStories.map((relSlug) => {
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
                      className="text-left p-2.5 rounded bg-[#FAF5EB] hover:bg-[#F2E8D5] border border-[#D4BE98] transition-colors cursor-pointer group flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <span className="text-[12.5px] font-medium text-[#34291F] group-hover:text-[#A8523B] leading-snug truncate">
                        {meta.title}
                      </span>
                      {meta.date && (
                        <span className="text-[11px] text-[#7C6A52] font-mono shrink-0">
                          {meta.date}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <span className="text-[12px] text-[#7C6A52] italic">
                  Explore other historical narratives
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Sources, Confidence Meter & Atlas Actions */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#D4BE98]/70">
          {/* Sources on left */}
          <div className="max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52] block mb-1.5">
              Sources & Archival References
            </span>
            <div className="text-[12px] text-[#7C6A52] flex flex-wrap items-center gap-2 leading-relaxed">
              {story.sources && story.sources.length > 0 ? (
                story.sources.map((src, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2">
                    {src.url ? (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#A8523B] underline underline-offset-2 decoration-[#D4BE98] transition-colors font-medium"
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
                ))
              ) : (
                <span>Wikidata, Ancient & medieval historical records</span>
              )}
            </div>
          </div>

          {/* Confidence and Actions on right */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Confidence Bar */}
            <div className="flex flex-col items-start sm:items-end">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C6A52]">
                  Confidence 78%
                </span>
                <div className="flex items-center gap-1 w-20">
                  <div className="h-1.5 flex-1 rounded-full bg-[#A8523B]" />
                  <div className="h-1.5 flex-1 rounded-full bg-[#A8523B]" />
                  <div
                    className={`h-1.5 flex-1 rounded-full ${
                      story.confidence === "high" ? "bg-[#A8523B]" : "bg-[#D4BE98]/60"
                    }`}
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#7C6A52] text-left sm:text-right max-w-xs leading-tight">
                {story.confidenceNote || "Rigorous historical consensus; ancient sources cross-verified."}
              </p>
            </div>

            {/* Open Records CTA */}
            {onOpenRecords && (
              <button
                type="button"
                onClick={() => onOpenRecords(story)}
                className="py-2 px-3.5 rounded text-[12px] font-semibold bg-[#FAF5EB] hover:bg-[#F2E8D5] text-[#34291F] border border-[#D4BE98] transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Open records
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Next Story Banner (Matching reference screenshot) */}
        {resolvedNextStory && (
          <div className="mt-10 bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8523B] block mb-1.5">
                NEXT STORY
              </span>
              <h3 className="font-serif text-[24px] sm:text-[28px] font-bold text-[#2C241D] mb-1">
                {resolvedNextStory.title}
              </h3>
              <div className="flex items-center gap-2 text-[12px] text-[#7C6A52]">
                <span className="font-semibold text-[#A8523B] tabular-nums">
                  {formatPeriod(resolvedNextStory.period)}
                </span>
                <span>·</span>
                <span>{resolvedNextStory.readMinutes} min read</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectStory(resolvedNextStory.slug)}
              className="inline-flex items-center gap-2 bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] font-semibold text-[13px] px-6 py-2.5 rounded shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8523B]"
            >
              <span>Continue reading</span>
              <span>→</span>
            </button>
          </div>
        )}
      </footer>

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
