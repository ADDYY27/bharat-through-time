import { CATEGORY_CONFIG } from "../utils/storyTokens";
import { formatPeriod } from "../utils/formatYear";
import StoryLocatorMap from "./StoryLocatorMap";

export default function FeaturedStoryCard({ story, onSelectStory }) {
  if (!story) return null;

  const categoryConfig = CATEGORY_CONFIG[story.category] || CATEGORY_CONFIG.civilisation;
  const periodLabel = formatPeriod(story.period);
  const chapterCount = story.chapterCount ?? (story.chapters ? story.chapters.length : 0);

  return (
    <section className="bg-[#FAF5EB] border border-[#D4BE98] rounded-lg overflow-hidden shadow-xs mb-8 transition-all hover:border-[#A8523B]/40">
      {/* Category-tinted top band */}
      <div className={`w-full h-3 ${categoryConfig.heroBg || "bg-[#EAE0CB]"} border-b border-[#D4BE98]/40`} />

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Information Column */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#7C6A52]">
                FEATURED STORY
              </span>
              <span
                className={`text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${categoryConfig.tagBg} ${categoryConfig.tagText} ${categoryConfig.tagBorder}`}
              >
                {categoryConfig.singular}
              </span>
            </div>

            <h2 className="font-serif text-[28px] sm:text-[34px] lg:text-[38px] font-bold text-[#34291F] tracking-tight leading-tight mb-2.5">
              {story.title}
            </h2>

            <div className="flex items-center gap-2 text-[12.5px] mb-3">
              <span className="font-semibold text-[#A8523B] tabular-nums">
                {periodLabel}
              </span>
              <span className="text-[#DECDB3]">·</span>
              <span className="text-[#7C6A52] font-medium">{story.region}</span>
            </div>

            <p className="text-[14px] sm:text-[14.5px] text-[#554332] leading-relaxed max-w-2xl">
              {story.deck}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onSelectStory(story.slug)}
              className="inline-flex items-center gap-2 bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] text-[13px] font-semibold px-4 py-2.5 rounded shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8523B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF5EB]"
              aria-label={`Read the full featured story: ${story.title}`}
            >
              <span>Read the full story</span>
              <span>→</span>
            </button>

            <span className="text-[12px] text-[#7C6A52] font-medium">
              {story.readMinutes} min read · {chapterCount} chapters
            </span>
          </div>
        </div>

        {/* Right Locator Map Container */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md h-full">
            <StoryLocatorMap
              locator={story.locator}
              regionLabel={story.region}
              category={story.category}
              onMap={story.onMap}
              className="h-full min-h-[220px] justify-center"
            />
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
