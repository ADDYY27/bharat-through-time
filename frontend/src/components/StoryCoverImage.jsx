import { useState } from "react";
import { CATEGORY_CONFIG, STORY_COVERS } from "../utils/storyTokens";

export default function StoryCoverImage({
  slug,
  category = "civilisation",
  title = "",
  badges = null,
  height = "h-28",
  className = "",
}) {
  const [imgError, setImgError] = useState(false);
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.civilisation;
  const customCover = slug ? STORY_COVERS[slug] : null;

  return (
    <div
      className={`relative w-full ${height} ${config.coverBg} border-b border-[#D4BE98] overflow-hidden flex flex-col justify-between p-3 select-none transition-colors duration-200 ${className}`}
    >
      {/* Background Cover Image (when provided and valid) */}
      {customCover && !imgError && (
        <img
          src={customCover}
          alt={title || "Historical story illustration"}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80"
          loading="lazy"
        />
      )}

      {/* Subtle Historical Texture Watermark for Editorial Placeholder */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 160 120"
          className="w-full h-full max-w-[200px] text-[#34291F]/30"
          fill="currentColor"
        >
          {category === "civilisation" && (
            <path d="M20,60 Q80,20 140,60 Q80,100 20,60 Z M40,60 Q80,35 120,60 Q80,85 40,60 Z" />
          )}
          {category === "war" && (
            <path d="M30,30 L130,90 M130,30 L30,90 M80,20 L80,100" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          )}
          {category === "empire" && (
            <path d="M30,85 L80,25 L130,85 L105,85 L80,50 L55,85 Z" />
          )}
          {category === "faith" && (
            <circle cx="80" cy="60" r="35" stroke="currentColor" strokeWidth="6" fill="none" />
          )}
          {category === "trade" && (
            <path d="M25,80 Q80,45 135,80 Q105,95 25,80 Z M80,30 L80,70" />
          )}
        </svg>
      </div>

      {/* Top Badges Row Overlay */}
      {badges && <div className="relative z-10 w-full">{badges}</div>}
    </div>
  );
}
