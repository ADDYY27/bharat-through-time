import { CATEGORY_CONFIG } from "../utils/storyTokens";
import { formatPeriod } from "../utils/formatYear";
import StoryLocatorMap from "./StoryLocatorMap";

export default function FeaturedStoryCard({ story, onSelectStory }) {
  if (!story) return null;

  const categoryConfig = CATEGORY_CONFIG[story.category] || CATEGORY_CONFIG.civilisation;
  const periodLabel = formatPeriod(story.period);
  const chapterCount = story.chapterCount ?? (story.chapters ? story.chapters.length : 0);

  return (
    <section className="bg-[#FAF5EB] border border-[#D4BE98] rounded-xl p-5 sm:p-7 shadow-xs mb-8 transition-all hover:border-[#A8523B]/40">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Information Area */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#7C6A52]">
                FEATURED STORY
              </span>
              <span
                className={`text-[9.5px] uppercase font-semibold px-2 py-0.5 rounded border tracking-wider ${categoryConfig.tagBg} ${categoryConfig.tagText} ${categoryConfig.tagBorder}`}
              >
                {categoryConfig.singular}
              </span>
            </div>

            <h2 className="font-serif text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#34291F] tracking-tight leading-tight mb-2">
              {story.title}
            </h2>

            <div className="flex items-center gap-2 text-[12.5px] mb-3">
              <span className="font-semibold text-[#A8523B] tabular-nums">
                {periodLabel}
              </span>
              <span className="text-[#DECDB3]">·</span>
              <span className="text-[#7C6A52] font-medium">{story.region}</span>
            </div>

            <p className="text-[13.5px] sm:text-[14px] text-[#554332] leading-relaxed mb-6 max-w-2xl">
              {story.deck}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onSelectStory(story.slug)}
              className="inline-flex items-center gap-2 bg-[#A8523B] hover:bg-[#93422E] text-[#FAF5EB] text-[13px] font-semibold px-4 py-2 rounded shadow-xs transition-colors cursor-pointer"
            >
              <span>Read the full story</span>
              <span>→</span>
            </button>

            <span className="text-[12px] text-[#7C6A52]">
              {story.readMinutes} min read · {chapterCount} chapters
            </span>
          </div>
        </div>

        {/* Right Locator Map Area */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
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
    </section>
  );
}
