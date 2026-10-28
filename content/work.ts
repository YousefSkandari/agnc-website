// The work shown on the home page. Drop the files into public/work/ and point `src` at them, e.g. "/work/opening-night.mp4".
// Videos (.mp4 or .webm) play silently on a loop; add a `poster` image so something shows while they load.
// Items without `src` show as striped placeholders until the real media is in.
export type WorkKind = "Reels" | "Photos" | "Launches";

export type WorkItem = {
  kind: WorkKind;
  label: string; // the small tag in the corner, e.g. "REEL · 0:15"
  client: string;
  caption: string;
  aspect: "9/16" | "2/3" | "4/5" | "1/1" | "3/2";
  src?: string;
  poster?: string;
  featured?: boolean; // shown in the hero strip (the first five featured items)
};

// The grid flows down each column in turn, so tall reels and wide photos are mixed through the list rather than grouped.
export const work: WorkItem[] = [
  { kind: "Reels", label: "REEL · 0:20", client: "Beirut Station", caption: "The process", aspect: "9/16",
    src: "/work/reel-the-process.mp4", poster: "/work/reel-the-process.jpg", featured: true },
  { kind: "Photos", label: "PHOTO", client: "Portrait shoot", caption: "Backgammon, from above", aspect: "3/2", src: "/work/shoot-backgammon.webp" },
  { kind: "Photos", label: "PHOTO", client: "Beirut Station", caption: "The full table", aspect: "4/5", src: "/work/food-spread.webp" },
  { kind: "Photos", label: "PHOTO", client: "Beirut Station", caption: "Mezze, from above", aspect: "4/5", src: "/work/food-mezze.webp", featured: true },
  { kind: "Reels", label: "REEL · 0:17", client: "Beirut Station", caption: "Chicken fajitas", aspect: "9/16",
    src: "/work/reel-fajitas.mp4", poster: "/work/reel-fajitas.jpg" },
  { kind: "Photos", label: "PHOTO", client: "Portrait shoot", caption: "Coffee, after lunch", aspect: "3/2", src: "/work/shoot-coffee.webp" },
  { kind: "Launches", label: "REEL · 0:35", client: "Beirut Station", caption: "Opening day, queue round the block", aspect: "9/16",
    src: "/work/reel-opening-day.mp4", poster: "/work/reel-opening-day.jpg", featured: true },
  { kind: "Photos", label: "PHOTO", client: "Beirut Station", caption: "Labneh and oil", aspect: "3/2", src: "/work/food-labneh.webp" },
  { kind: "Photos", label: "PHOTO", client: "Beirut Station", caption: "Fajita tray", aspect: "4/5", src: "/work/food-fajita-tray.webp" },
  { kind: "Photos", label: "PHOTO", client: "Beirut Station", caption: "Wraps and garlic sauce", aspect: "4/5", src: "/work/food-wraps.webp", featured: true },
  { kind: "Launches", label: "REEL · 0:17", client: "Beirut Station", caption: "First look inside", aspect: "9/16",
    src: "/work/reel-the-room.mp4", poster: "/work/reel-the-room.jpg" },
  { kind: "Photos", label: "PHOTO", client: "Location shoot", caption: "Wind off the water", aspect: "3/2", src: "/work/shoot-sea.webp" },
  { kind: "Reels", label: "REEL · 0:21", client: "Beirut Station", caption: "Made to share", aspect: "9/16",
    src: "/work/reel-made-to-share.mp4", poster: "/work/reel-made-to-share.jpg", featured: true },
  { kind: "Photos", label: "PHOTO", client: "Portrait shoot", caption: "Profile and map", aspect: "3/2", src: "/work/shoot-map.webp" },
  { kind: "Reels", label: "REEL · 0:14", client: "Beirut Station", caption: "Fire and fresh bread", aspect: "9/16",
    src: "/work/reel-fire-and-bread.mp4", poster: "/work/reel-fire-and-bread.jpg" },
  { kind: "Reels", label: "REEL · 0:09", client: "Beirut Station", caption: "Starter, main, dessert", aspect: "9/16",
    src: "/work/reel-three-courses.mp4", poster: "/work/reel-three-courses.jpg" },
];

// The photo band further down the page: portrait shots at 2:3 that drift past in a loop.
export const shoots: { src: string; alt: string }[] = [
  { src: "/work/shoot-map-room.webp", alt: "A man in a fez, seen from behind, faces a map hung in a bright window" },
  { src: "/work/shoot-arch-walk.webp", alt: "A woman in white walks towards the camera through a stone archway" },
  { src: "/work/shoot-portrait.webp", alt: "Close portrait of an older man in a dark suit and striped tie" },
  { src: "/work/shoot-arches.webp", alt: "A woman in a long black dress framed by a row of stone arches" },
  { src: "/work/shoot-sea-wall.webp", alt: "Three women in black and white posed on a sea wall" },
  { src: "/work/shoot-window.webp", alt: "A woman in a white feathered skirt stands by a bright window" },
  { src: "/work/shoot-arch-portrait.webp", alt: "Portrait of a woman in a black dress beneath an archway" },
];
