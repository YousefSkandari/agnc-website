// Every photo and video on the site, all our own work, served from public/. Sizes are the real file sizes, so each
// image reserves its space before it loads (no layout shift).
export type ReelId = "room" | "process" | "share" | "fajitas" | "fire" | "opening" | "courses";
export type PhotoId = "spread" | "mezze" | "wraps" | "labneh" | "nes" | "gaby";

export type Reel = {
  id: ReelId;
  video: string;
  poster: string;
  width: number;
  height: number;
  // Describes what the video shows, for screen readers
  label: string;
};

export type Photo = {
  id: PhotoId;
  src: string;
  width: number;
  height: number;
  alt: string;
};

const reel = (id: ReelId, file: string, label: string): Reel => ({
  id,
  video: `/work/${file}.mp4`,
  poster: `/work/${file}.jpg`,
  width: 576,
  height: 1024,
  label,
});

export const reels: Record<ReelId, Reel> = {
  room: reel("room", "reel-the-room", "Inside a new restaurant: painted murals, seating and the counter"),
  process: reel("process", "reel-the-process", "Kitchen prep, frying and plating, ending on the full table"),
  share: reel("share", "reel-made-to-share", "Hands tearing bread through a bowl of hummus, from above"),
  fajitas: reel("fajitas", "reel-fajitas", "Chicken fajitas at Beirut Station: griddle steam, the wrap being built, a tray with fries"),
  fire: reel("fire", "reel-fire-and-bread", "Skewers over an open flame, the shop sign, wraps and a mezze spread"),
  opening: reel("opening", "reel-opening-day", "Opening day at Beirut Station, a queue round the block"),
  courses: reel("courses", "reel-three-courses", "A split screen of starter, main and dessert"),
};

export const photos: Record<PhotoId, Photo> = {
  spread: { id: "spread", src: "/work/food-spread.webp", width: 900, height: 1125, alt: "The full table from above" },
  mezze: { id: "mezze", src: "/work/food-mezze.webp", width: 720, height: 1280, alt: "Mezze from above: vine leaves, salad, lemon, labneh" },
  wraps: { id: "wraps", src: "/work/food-wraps.webp", width: 720, height: 1280, alt: "Wraps, fries and garlic sauce" },
  labneh: { id: "labneh", src: "/work/food-labneh.webp", width: 1200, height: 800, alt: "Labneh with olive oil, close up" },
  nes: { id: "nes", src: "/work/nes.webp", width: 800, height: 1000, alt: "Nes, walking up warm stone stairs" },
  gaby: { id: "gaby", src: "/work/gaby.webp", width: 800, height: 1000, alt: "Gaby, seated in a black hoodie" },
};

export const brand = {
  logo: { src: "/agnc-logo.svg", alt: "agnc. media" },
  // Decorative wordmark behind the hero and footer
  outline: { src: "/agnc-outline.svg" },
};

// The hero post: opening day at Beirut Station. Its poster is the first image on the page and loads first.
export const heroReel = reels.opening;
