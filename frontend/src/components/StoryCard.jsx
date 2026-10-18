import { CATEGORY_CONFIG } from "../utils/storyTokens";
import { formatPeriod } from "../utils/formatYear";

export default function StoryCard({ story, onSelectStory }) {
  const categoryConfig = CATEGORY_CONFIG[story.category] || CATEGORY_CONFIG.civilisation;
  const periodLabel = formatPeriod(story.period);
  const chapterCount = story.chapterCount ?? (story.chapters ? story.chapters.length : 0);

  return (
    <article
      onClick={() => onSelectStory(story.slug)}
      className="group relative flex flex-col justify-between bg-[#FAF5EB] border border-[#D4BE98] rounded-lg p-5 transition-all duration-200 hover:shadow-md hover:border-[#A8523B]/50 cursor-pointer text-[#34291F]"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[9.5px] uppercase font-semibold px-2 py-0.5 rounded border tracking-wider ${categoryConfig.tagBg} ${categoryConfig.tagText} ${categoryConfig.tagBorder}`}
          >
            {categoryConfig.singular}
          </span>

          <span
            className={`text-[9.5px] px-2 py-0.5 rounded border font-medium ${
              story.onMap
                ? "bg-[#DDE9DD] text-[#2B5433] border-[#BDD4BE] font-semibold"
                : "bg-[#EAE0CB] text-[#7C6A52] border-[#D4BE98]"
            }`}
          >
            {story.onMap ? "On map" : "Locator"}
          </span>
        </div>

        {/* Period */}
        <div className="text-[12px] font-semibold text-[#A8523B] mb-1 tabular-nums">
          {periodLabel}
        </div>

        {/* Title */}
        <h3 className="font-serif text-[18px] sm:text-[19px] font-bold text-[#34291F] group-hover:text-[#A8523B] transition-colors leading-snug mb-2">
          {story.title}
        </h3>

        {/* Deck clamped to 3 lines */}
        <p className="text-[12.5px] text-[#7C6A52] leading-relaxed line-clamp-3 mb-4">
          {story.deck}
        </p>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#DECDB3] flex items-center justify-between text-[11.5px]">
        <span className="text-[#7C6A52]">
          {story.readMinutes} min · {chapterCount} chapters
        </span>

        <span className="font-semibold text-[#A8523B] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          Read story <span>→</span>
        </span>
      </div>
    </article>
  );
}
