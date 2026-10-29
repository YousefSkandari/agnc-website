// The example 30-day plan in d4 (artboard B-desktop logic block, CAL_MEDIA / CAL_JOBS / CAL_RAW / CAL_GLYPH /
// CAL_DAYS / CAL_PHASE, lines 1197-1273). Days with media are our own work; the rest are marked SAMPLE and never
// carry a picture. Copy is verbatim from the design. The files come from lib/media.ts; the alt text is the
// calendar's own (it describes the post as it sits in the plan).
import { photos, reels, type Photo, type Reel } from "@/lib/media";

export type CalJob = "found" | "followed" | "in" | "back";
export type CalPhase = "before" | "d1" | "after";
export type CalGlyph = "reel" | "photo" | "carousel" | "stories" | "post" | "portrait";

export type CalMedia =
  | { kind: "video"; video: string; poster: string; width: number; height: number; ratio: number; alt: string }
  | { kind: "image"; src: string; width: number; height: number; ratio: number; alt: string };

const video = (r: Reel, alt: string): CalMedia => ({
  kind: "video",
  video: r.video,
  poster: r.poster,
  width: r.width,
  height: r.height,
  ratio: r.width / r.height,
  alt,
});
const image = (p: Photo, alt: string): CalMedia => ({
  kind: "image",
  src: p.src,
  width: p.width,
  height: p.height,
  ratio: p.width / p.height,
  alt,
});

export const CAL_MEDIA = {
  opening: video(reels.opening, "Opening day at Beirut Station, a queue round the block"),
  fajitas: video(reels.fajitas, "A chicken fajita wrap at Beirut Station, from the griddle to the tray"),
  fire: video(reels.fire, "Skewers over an open flame, then the restaurant sign"),
  room: video(reels.room, "A tour of a new restaurant: painted murals, seating and the counter"),
  process: video(reels.process, "Kitchen prep, the fryer and plating, then the table from above"),
  share: video(reels.share, "Hands tearing bread through a bowl on patterned tiles, from above"),
  courses: video(reels.courses, "Starter, main and dessert on a split screen"),
  labneh: image(photos.labneh, "One dish with olive oil, close up"),
  wraps: image(photos.wraps, "Wraps, fries and garlic sauce"),
  spread: image(photos.spread, "A full table of dishes, from above"),
  mezze: image(photos.mezze, "A full spread from above, ready for the table"),
} satisfies Record<string, CalMedia>;

export type CalMediaId = keyof typeof CAL_MEDIA;

export const CAL_JOBS: Record<CalJob, string> = { found: "Get found", followed: "Get followed", in: "Fill tables", back: "Bring them back" };
export const CAL_JOB_IDS: readonly CalJob[] = ["found", "followed", "in", "back"];
export const CAL_WEEKDAY_FULL: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

// id, code, weekday, idea, format, job, media, hook, goes out, why
type Raw = [string, string, string, string, string, CalJob, CalMediaId | null, string, string, string];

const CAL_RAW: Raw[] = [
  ["m9", "9 TO GO", "Wed", "The room, before anyone sees it.", "Reel · 0:17", "found", "room", "The murals, straight away.", "Early evening", "People want to know what it feels like to sit there before they book."],
  ["m8", "8 TO GO", "Thu", "Name, sign, date: we’re opening.", "Post", "followed", null, "Your sign, with the date on it.", "Lunchtime", "One post that says who, where and when. It’s the one people follow you from."],
  ["m7", "7 TO GO", "Fri", "The kitchen in motion.", "Reel · 0:20", "found", "process", "“The process:” on screen, over the prep.", "Friday evening", "People trust food they’ve watched being made."],
  ["m6", "6 TO GO", "Sat", "Meet who’s cooking.", "Portrait", "followed", null, "A face, straight down the lens.", "Saturday morning", "People follow people. A name and a face make the place feel open already."],
  ["m5", "5 TO GO", "Sun", "Made to share.", "Reel · 0:21", "found", "share", "Hands tearing bread through the bowl, from above.", "Sunday evening, when people plan the week", "The post people send to whoever they’re coming with."],
  ["m4", "4 TO GO", "Mon", "The menu, first look.", "Carousel", "followed", null, "Three dishes, one per slide.", "Monday lunchtime", "People decide what they’ll order before they come. Give them the menu early."],
  ["m3", "3 TO GO", "Tue", "One dish, start to finish.", "Reel · 0:17", "in", "fajitas", "Steam off the griddle.", "Tuesday evening", "One dish start to finish, so people know what to order."],
  ["m2", "2 TO GO", "Wed", "Neighbours’ night.", "Stories", "in", null, "The street, invited in.", "That evening, live", "The people nearest you are your first regulars. Let everyone else see them arrive."],
  ["m1", "1 TO GO", "Thu", "Tomorrow, we open.", "Reel · 0:14", "in", "fire", "Flame first, then the sign.", "The night before, 7pm", "A reason to come tomorrow, and the sign so they know where."],
  ["d1", "DAY ONE", "Fri", "Opening day.", "Reel · 0:35, and Stories all day", "in", "opening", "The balloons, then the queue.", "Stories live all day, then the reel that night", "Day one is the post people share. It tells the town you’re open and worth the wait."],
  ["d2", "DAY 2", "Sat", "One dish, close and slow.", "Photo · 3:2", "found", "labneh", "One dish, filling the frame.", "Saturday, before lunch", "A close-up is the post people save for later."],
  ["d3", "DAY 3", "Sun", "Thank you for day one.", "Carousel", "back", null, "The queue, then the faces.", "Sunday morning", "Thank the people who came, in public, so they come back and bring someone."],
  ["d4", "DAY 4", "Mon", "The order, in one photo.", "Photo · 9:16", "in", "wraps", "The whole order, in one frame.", "Monday, before lunch", "A Monday post for the lunch crowd: what to get, in one look."],
  ["d5", "DAY 5", "Tue", "Your stories, reshared.", "Stories", "followed", null, "Your guests’ own posts.", "Through the day", "Guests’ posts are the proof strangers trust most. Reshare them."],
  ["d6", "DAY 6", "Wed", "The whole table.", "Photo · 4:5", "in", "spread", "The table from above.", "Wednesday evening", "Midweek, show what a table for four looks like."],
  ["d7", "DAY 7", "Thu", "Starter, main, dessert.", "Reel · 0:09", "in", "courses", "Three courses at once, split screen.", "Thursday evening", "Plant the weekend visit: the whole meal in nine seconds."],
  ["d8", "DAY 8", "Fri", "First Friday.", "Photo · 9:16", "in", "mezze", "A full spread, ready for Friday.", "Friday, 4pm", "A week in, give people a reason to make Friday the night."],
  ["d9", "DAY 9", "Sat", "Saturday, full room.", "Stories", "in", null, "The room, busy.", "Saturday night, live", "A full room says it’s worth coming. Post it while it’s happening."],
  ["d10", "DAY 10", "Sun", "The family table.", "Photo", "back", null, "A big table, mid-meal.", "Sunday lunchtime", "Show the table people come back to, with the people they’d bring."],
  ["d11", "DAY 11", "Mon", "Behind the pass.", "Reel", "followed", null, "Hands at the pass, mid-service.", "Monday evening", "The quiet day is the day to show the team at work."],
  ["d12", "DAY 12", "Tue", "The dish we nearly cut.", "Carousel", "followed", null, "A story in three slides.", "Tuesday lunchtime", "A story makes people care about one dish, and come in to try it."],
  ["d13", "DAY 13", "Wed", "Name our new special.", "Stories", "followed", null, "A poll: you pick the name.", "Through the day", "Ask people to help. They follow to see what wins."],
  ["d14", "DAY 14", "Thu", "A regular’s order.", "Photo", "back", null, "Their usual, on their table.", "Thursday evening", "Two weeks in, you already have regulars. Show one."],
  ["d15", "DAY 15", "Fri", "Second Friday.", "Reel", "in", null, "Friday’s first table.", "Friday, 4pm", "Keep Friday the night people think of."],
  ["d16", "DAY 16", "Sat", "What’s on this weekend.", "Stories", "in", null, "Today’s special, on the pass.", "Saturday morning", "A reason to come today, not someday."],
  ["d17", "DAY 17", "Sun", "Two weeks in: the team.", "Carousel", "followed", null, "Everyone, before service.", "Sunday evening", "Faces people will know when they walk in."],
  ["d18", "DAY 18", "Mon", "How it’s made, start to finish.", "Reel", "found", null, "The first cut, close up.", "Monday evening", "A how-it’s-made reel reaches people who’ve never heard of you."],
  ["d19", "DAY 19", "Tue", "The new special is here.", "Post", "back", null, "The name the poll picked.", "Tuesday lunchtime", "Close the loop on the poll, and give people a reason to come back."],
  ["d20", "DAY 20", "Wed", "The table by the window.", "Photo", "in", null, "Your best seat, in daylight.", "Wednesday, 11am", "Show the seat people will ask for when they book."],
  ["d21", "DAY 21", "Thu", "Three weeks open: thank you.", "Carousel", "back", null, "The best moments of three weeks.", "Thursday evening", "Thank people, and ask them to come back for month two."],
];

// Format glyphs: one stroke path each (24 grid); Stories is drawn as a dashed ring
export const CAL_GLYPH: Record<CalGlyph, string> = {
  reel: "M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM10.5 9.5v5l4-2.5z",
  photo: "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 14.5h18",
  carousel: "M4.5 8h9a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 18.5v-9A1.5 1.5 0 0 1 4.5 8zM8 5h10.5A1.5 1.5 0 0 1 20 6.5V17",
  stories: "M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 1 1 0-17z",
  post: "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 10h8M8 14h5",
  portrait: "M12 5.5a3.5 3.5 0 1 1 0 7a3.5 3.5 0 1 1 0-7zM5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5",
};

export type CalDay = {
  id: string;
  idx: number;
  // Days from opening day: -9 .. 20
  off: number;
  code: string;
  // Weekday of the example month ("Wed"); with an opening date set, the real weekday is worked out from it
  wd: string;
  title: string;
  fmt: string;
  job: CalJob;
  media: CalMedia | null;
  hook: string;
  out: string;
  why: string;
  // Our own work (has media) or a sample day
  work: boolean;
  // Beirut Station's own posts
  bs: boolean;
  mark: "OUR WORK · BEIRUT STATION" | "OUR WORK" | "SAMPLE";
  phase: CalPhase;
  glyph: CalGlyph;
  fmtWord: string;
  // Short day label in a cell: "9", "DAY ONE", "2"
  day: string;
  // "9 to go", "Day one", "Day 2"
  words: string;
  // The job in capitals, for the tag
  tag: string;
};

export const CAL_DAYS: readonly CalDay[] = CAL_RAW.map((r, i) => {
  const [id, code, wd, title, fmt, job, mediaId, hook, out, why] = r;
  const off = i - 9;
  const media: CalMedia | null = mediaId ? CAL_MEDIA[mediaId] : null;
  const work = !!media;
  const bs = mediaId === "opening" || mediaId === "fajitas";
  const first = fmt.split(" ")[0];
  const gk = media ? (media.kind === "video" ? "reel" : "photo") : first.toLowerCase();
  const glyph = (gk in CAL_GLYPH ? gk : "post") as CalGlyph;
  const day = id === "d1" ? "DAY ONE" : id.startsWith("m") ? code.replace(" TO GO", "") : code.replace("DAY ", "");
  return {
    id,
    idx: i,
    off,
    code,
    wd,
    title,
    fmt,
    job,
    media,
    hook,
    out,
    why,
    work,
    bs,
    mark: bs ? "OUR WORK · BEIRUT STATION" : work ? "OUR WORK" : "SAMPLE",
    phase: off < 0 ? "before" : off === 0 ? "d1" : "after",
    glyph,
    fmtWord: media ? (media.kind === "video" ? "Reel" : "Photo") : first,
    day,
    words: code.charAt(0) + code.slice(1).toLowerCase(),
    tag: CAL_JOBS[job].toUpperCase(),
  };
});

export const CAL_PHASE: Record<CalPhase, { label: string; color: "muted" | "cream" }> = {
  before: { label: "DAYS TO GO", color: "muted" },
  d1: { label: "DOORS OPEN", color: "cream" },
  after: { label: "DAYS OPEN", color: "muted" },
};

export const calIndex = (id: string) => CAL_DAYS.findIndex((d) => d.id === id);
