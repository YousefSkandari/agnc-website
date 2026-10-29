// The six sections of the home page, in order. The ids are the page anchors (/#d4 etc.).
export const SECTION_IDS = ["d1", "d2", "d4", "d5", "d7", "d8"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export type Section = {
  id: SectionId;
  // Header nav cell
  nav: string;
  // Header nav cell below 980px, where space is short
  navShort: string;
  // Row in the sections menu (phone)
  menu: string;
};

export const SECTIONS: readonly Section[] = [
  { id: "d1", nav: "WHAT WE DO", navShort: "WHAT WE DO", menu: "What do you do?" },
  { id: "d2", nav: "THE POSTS", navShort: "THE POSTS", menu: "Show me the work" },
  { id: "d4", nav: "30 DAYS", navShort: "30 DAYS", menu: "What’s in the free plan?" },
  { id: "d5", nav: "HOW IT WORKS · PRICE", navShort: "PRICE", menu: "How it works, and the price" },
  { id: "d7", nav: "NES & GABY", navShort: "NES & GABY", menu: "Who are you?" },
  { id: "d8", nav: "YOUR PLAN", navShort: "YOUR PLAN", menu: "Get my free plan" },
];

export const sectionIndex = (id: SectionId) => SECTION_IDS.indexOf(id);
