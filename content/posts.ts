// The seven posts, in launch order (artboard B-desktop logic block, POSTS, lines 1133-1141; strip labels lines
// 285-338; phone viewer chips B-phone-2 lines 223-258). Copy is verbatim from the design.
import { reels, type Reel, type ReelId } from "@/lib/media";

export type Post = {
  id: ReelId;
  n: string;
  title: string;
  // Running time as shown, e.g. "0:17"
  len: string;
  // Viewer side panel phase line
  phase: string;
  // Phone viewer chip under the counter
  chip: string;
  // d2 strip card: the small "when" line above (null when the card has none) and the job line
  stripWhen: string | null;
  stripJob: string;
  // d2 strip card accessible name
  stripLabel: string;
  job: string;
  opensOn: string;
  goesOut: string;
  madeBy: string;
  // The one proof line, only on posts that have one
  proof?: string;
  // Only Fajitas has the "Under the buttons" check
  buttonsCheck?: boolean;
  reel: Reel;
};

export const POSTS: readonly Post[] = [
  {
    id: "room",
    n: "01",
    title: "The room",
    len: "0:17",
    phase: "THE WEEKS BEFORE DOORS",
    chip: "THE WEEKS BEFORE · SHOW THE ROOM",
    stripWhen: "WEEKS BEFORE",
    stripJob: "SHOW THE ROOM",
    stripLabel: "Weeks before: show the room. Watch post 01 full screen",
    job: "Shows people where they’ll sit before the doors open, so they plan a visit.",
    opensOn: "THE DINING ROOM WALL",
    goesOut: "TWO WEEKS BEFORE DOORS",
    madeBy: "MADE BY AGNC.",
    reel: reels.room,
  },
  {
    id: "process",
    n: "02",
    title: "The process",
    len: "0:20",
    phase: "THE WEEKS BEFORE DOORS",
    chip: "THE WEEKS BEFORE · SHOW THE KITCHEN",
    stripWhen: null,
    stripJob: "SHOW THE KITCHEN",
    stripLabel: "Show the kitchen. Watch post 02 full screen",
    job: "The work behind the plate, so people trust the food before they’ve tasted it.",
    opensOn: "“THE PROCESS:” ON SCREEN",
    goesOut: "TEN DAYS BEFORE DOORS",
    madeBy: "MADE BY AGNC.",
    reel: reels.process,
  },
  {
    id: "share",
    n: "03",
    title: "Made to share",
    len: "0:21",
    phase: "THE LAST WEEK BEFORE DOORS",
    chip: "THE LAST WEEK · MAKE THEM HUNGRY",
    stripWhen: "LAST WEEK",
    stripJob: "MAKE THEM HUNGRY",
    stripLabel: "Last week: make them hungry. Watch post 03 full screen",
    job: "The one people send to whoever they’re coming with.",
    opensOn: "A BOWL FROM ABOVE",
    goesOut: "THE WEEK BEFORE DOORS",
    madeBy: "MADE BY AGNC.",
    reel: reels.share,
  },
  {
    id: "fajitas",
    n: "04",
    title: "Fajitas",
    len: "0:17",
    phase: "THE LAST WEEK BEFORE DOORS",
    chip: "THE LAST WEEK · SELL ONE DISH BY NAME",
    stripWhen: null,
    stripJob: "SELL ONE DISH BY NAME",
    stripLabel: "Sell one dish by name. Watch post 04 full screen",
    job: "One dish, start to finish: the post that tells people what to order.",
    opensOn: "THE DISH AND ITS NAME",
    goesOut: "THE WEEK BEFORE DOORS",
    madeBy: "MADE FOR BEIRUT STATION BY AGNC.",
    buttonsCheck: true,
    reel: reels.fajitas,
  },
  {
    id: "fire",
    n: "05",
    title: "Fire & bread",
    len: "0:14",
    phase: "THE LAST WEEK BEFORE DOORS",
    chip: "THE LAST WEEK · WHAT YOU ARE AND WHERE",
    stripWhen: null,
    stripJob: "WHAT YOU ARE AND WHERE",
    stripLabel: "What you are and where. Watch post 05 full screen",
    job: "Flame, the sign, the food: what you are and where to find you, fast.",
    opensOn: "A FULL TABLE FROM ABOVE",
    goesOut: "THE DAY BEFORE DOORS",
    madeBy: "MADE BY AGNC.",
    reel: reels.fire,
  },
  {
    id: "opening",
    n: "06",
    title: "Opening day",
    len: "0:35",
    phase: "DOORS OPEN",
    chip: "DOORS OPEN · SHOW THE QUEUE",
    stripWhen: "DOORS OPEN",
    stripJob: "SHOW THE QUEUE",
    stripLabel: "Doors open: show the queue. Watch post 06 full screen",
    job: "Shows the street turned up, for everyone who wasn’t there yet.",
    opensOn: "BALLOONS ON THE SHOPFRONT",
    goesOut: "THE EVENING OF DAY ONE",
    madeBy: "WE FILMED THE DAY FOR BEIRUT STATION",
    proof: "Opening day, queue round the block.",
    reel: reels.opening,
  },
  {
    id: "courses",
    n: "07",
    title: "Three courses",
    len: "0:09",
    phase: "WEEK ONE",
    chip: "WEEK ONE · A REASON TO COME BACK",
    stripWhen: "WEEK ONE",
    stripJob: "A REASON TO COME BACK",
    stripLabel: "Week one: a reason to come back. Watch post 07 full screen",
    job: "Starter, main, dessert: a reason to come back for the full meal.",
    opensOn: "THREE PLATES AT ONCE",
    goesOut: "IN WEEK ONE",
    madeBy: "MADE BY AGNC.",
    reel: reels.courses,
  },
];

// The gold "doors" divider sits before this post in the d2 strip
export const DOORS_BEFORE: ReelId = "opening";

