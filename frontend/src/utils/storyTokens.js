/**
 * Category styling tokens and era definitions for Explore Stories
 * Reuses the Parchment / Indian Heritage theme palette
 */

export const CATEGORY_CONFIG = {
  civilisation: {
    id: "civilisation",
    label: "Civilisations",
    singular: "Civilisation",
    tagBg: "bg-[#DDE9DD]",
    tagText: "text-[#2B5433]",
    tagBorder: "border-[#BDD4BE]",
    hex: "#2B5433",
    coverBg: "bg-[#D8E6D9]",
    coverBorder: "border-[#C5D9C7]",
    heroBg: "bg-[#D8E4D7]",
    accentGlow: "rgba(43, 84, 51, 0.12)",
  },
  war: {
    id: "war",
    label: "Wars & battles",
    singular: "War",
    tagBg: "bg-[#F5DFD6]",
    tagText: "text-[#A8523B]",
    tagBorder: "border-[#E8C5B8]",
    hex: "#A8523B",
    coverBg: "bg-[#F1DDD5]",
    coverBorder: "border-[#E5C9BF]",
    heroBg: "bg-[#EBD8CE]",
    accentGlow: "rgba(168, 82, 59, 0.12)",
  },
  empire: {
    id: "empire",
    label: "Empires & dynasties",
    singular: "Empire",
    tagBg: "bg-[#F9ECCF]",
    tagText: "text-[#8C6218]",
    tagBorder: "border-[#EDD59F]",
    hex: "#8C6218",
    coverBg: "bg-[#F5E8D2]",
    coverBorder: "border-[#E5D2B3]",
    heroBg: "bg-[#F5E8D2]",
    accentGlow: "rgba(140, 98, 24, 0.12)",
  },
  faith: {
    id: "faith",
    label: "Faiths & ideas",
    singular: "Faith",
    tagBg: "bg-[#DEE3EC]",
    tagText: "text-[#293E63]",
    tagBorder: "border-[#C3CDE0]",
    hex: "#293E63",
    coverBg: "bg-[#DFE4EE]",
    coverBorder: "border-[#CAD2E2]",
    heroBg: "bg-[#DFE4EE]",
    accentGlow: "rgba(41, 62, 99, 0.12)",
  },
  trade: {
    id: "trade",
    label: "Journeys & trade",
    singular: "Trade",
    tagBg: "bg-[#D7EAE4]",
    tagText: "text-[#1E5C4E]",
    tagBorder: "border-[#B7D8CD]",
    hex: "#1E5C4E",
    coverBg: "bg-[#D5EAE3]",
    coverBorder: "border-[#BEDDD2]",
    heroBg: "bg-[#D5EAE3]",
    accentGlow: "rgba(30, 92, 78, 0.12)",
  },
};

export const STORY_ERAS = [
  { id: "all", label: "All eras" },
  { id: "ancient", label: "Ancient (before 500 BCE)", query: "ancient" },
  { id: "classical", label: "Classical (500 BCE – 600 CE)", query: "classical" },
  { id: "medieval", label: "Medieval (600 – 1500)", query: "medieval" },
  { id: "early-modern", label: "Early modern (1500 – 1820)", query: "early-modern" },
];

/**
 * Optional curated cover image references for stories (public domain / stable assets)
 */
export const STORY_COVERS = {
  "indus-valley-civilisation": null, // Uses polished category-pigmented fallback
  "alexander-and-porus": null,
  "ashoka-and-the-kalinga-war": null,
  "the-maurya-empire": null,
  "chola-seas": null,
  "hyder-ali-and-the-rise-of-mysore": null,
};
