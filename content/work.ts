// The work shown on the home page. Drop the files into public/work/ and point `src` at them, e.g. "/work/lebanese-opening.mp4".
// Videos (.mp4 or .webm) play silently on a loop; add a `poster` image so something shows while they load.
// Items without `src` show as striped placeholders until the real media is in.
export type WorkKind = "Reels" | "Photos" | "Launches";

export type WorkItem = {
  kind: WorkKind;
  label: string; // the small tag in the corner, e.g. "REEL · 0:15"
  client: string;
  caption: string;
  aspect: "9/16" | "1/1" | "4/5";
  src?: string;
  poster?: string;
  featured?: boolean; // shown in the hero strip (the first five featured items)
};

export const work: WorkItem[] = [
  { kind: "Reels", label: "REEL · 0:22", client: "[Client name]", caption: "Behind the grill", aspect: "9/16", featured: true },
  { kind: "Launches", label: "POST", client: "[Client name]", caption: "Menu reveal carousel", aspect: "1/1", featured: true },
  { kind: "Reels", label: "REEL · 0:15", client: "[Client name]", caption: "Opening night, 2026", aspect: "9/16", featured: true },
  { kind: "Photos", label: "PHOTO", client: "[Client name]", caption: "Signature dish shoot", aspect: "4/5", featured: true },
  { kind: "Reels", label: "REEL · 0:18", client: "[Client name]", caption: "Meet the chef", aspect: "9/16", featured: true },
  { kind: "Photos", label: "PHOTO", client: "[Client name]", caption: "The dining room", aspect: "4/5" },
  { kind: "Launches", label: "POST", client: "[Client name]", caption: "Launch day offer", aspect: "1/1" },
  { kind: "Photos", label: "PHOTO", client: "[Client name]", caption: "Mezze spread", aspect: "4/5" },
];
