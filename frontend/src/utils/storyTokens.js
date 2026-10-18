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
  },
  war: {
    id: "war",
    label: "Wars & battles",
    singular: "War",
    tagBg: "bg-[#F5DFD6]",
    tagText: "text-[#A8523B]",
    tagBorder: "border-[#E8C5B8]",
    hex: "#A8523B",
  },
  empire: {
    id: "empire",
    label: "Empires & dynasties",
    singular: "Empire",
    tagBg: "bg-[#F9ECCF]",
    tagText: "text-[#8C6218]",
    tagBorder: "border-[#EDD59F]",
    hex: "#8C6218",
  },
  faith: {
    id: "faith",
    label: "Faiths & ideas",
    singular: "Faith",
    tagBg: "bg-[#DEE3EC]",
    tagText: "text-[#293E63]",
    tagBorder: "border-[#C3CDE0]",
    hex: "#293E63",
  },
  trade: {
    id: "trade",
    label: "Journeys & trade",
    singular: "Trade",
    tagBg: "bg-[#D7EAE4]",
    tagText: "text-[#1E5C4E]",
    tagBorder: "border-[#B7D8CD]",
    hex: "#1E5C4E",
  },
};

export const STORY_ERAS = [
  { id: "all", label: "All eras" },
  { id: "ancient", label: "Ancient (before 500 BCE)", query: "ancient" },
  { id: "classical", label: "Classical (500 BCE – 600 CE)", query: "classical" },
  { id: "medieval", label: "Medieval (600 – 1500)", query: "medieval" },
  { id: "early-modern", label: "Early modern (1500 – 1820)", query: "early-modern" },
];
