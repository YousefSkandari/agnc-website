// d4's view logic, ported from the artboard (B-desktop logic block, _calView, lines 1758-1871) and the week rows at
// 1200px and below (Cal-4-week-rows). Pure functions only: no React, no window. Dates are London "YYYY-MM-DD"
// strings, and nothing here runs with a date until after hydration (useLondonToday is null on the server).
import {
  CAL_DAYS,
  CAL_GLYPH,
  CAL_JOBS,
  CAL_PHASE,
  CAL_WEEKDAY_FULL,
  type CalDay,
  type CalJob,
  type CalPhase,
} from "@/content/calendar";
import { addDays, daysBetween, MONTHS, shortDay, weekdayOf, WEEKDAYS, type Ymd } from "@/lib/dates";
import type { Opening } from "@/lib/client/opening";

export type CalFilter = "all" | CalJob;

export const CAL_FILTERS: readonly { id: CalFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "found", label: CAL_JOBS.found },
  { id: "followed", label: CAL_JOBS.followed },
  { id: "in", label: CAL_JOBS.in },
  { id: "back", label: CAL_JOBS.back },
];

// Days 1 to 17 show in the grid; "And 13 more." holds the rest
export const CAL_SHOWN_LAST = 16;
export const CAL_COUNT = CAL_DAYS.length;

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const ALREADY_OPEN = "Already open. Your plan covers your next 30 days.";

// The status line under the controls (D 1760-1766). `opening` is only a date when it is after today.
export function calStatus(opening: Opening, today: Ymd | null): { opening: Ymd | null; status: string } {
  const d = opening.kind === "date" && opening.date ? opening.date : null;
  if (d && today && daysBetween(today, d) > 0) {
    const days = daysBetween(today, d);
    const friday = weekdayOf(d) === 5 ? "" : " This sample opens on a Friday.";
    return { opening: d, status: `You open ${shortDay(d)}. That’s ${days}${days === 1 ? " day." : " days."}${friday}` };
  }
  if ((d && today) || opening.kind === "open") return { opening: null, status: ALREADY_OPEN };
  return { opening: null, status: "" };
}

export function filterLive(filter: CalFilter): string {
  if (filter === "all") return "Showing all 30 days.";
  return `Showing ${CAL_DAYS.filter((d) => d.job === filter).length} of 30 days: ${CAL_JOBS[filter]}. The others are dimmed.`;
}

export type DayView = {
  // The real date when an opening date is set
  dt: Ymd | null;
  past: boolean;
  match: boolean;
  // Filtered out or already passed: the picture, glyph and outline dim; labels drop to muted
  dim: boolean;
  // "Wed"
  wd: string;
  // "20 NOV", or "" when undated
  date: string;
};

const dayNum = (d: Ymd) => Number(d.slice(8, 10));
const monthIdx = (d: Ymd) => Number(d.slice(5, 7)) - 1;

export function dayView(d: CalDay, opening: Ymd | null, today: Ymd | null, filter: CalFilter): DayView {
  const dt = opening ? addDays(opening, d.off) : null;
  // Before tomorrow, i.e. today or earlier
  const past = !!(dt && today && daysBetween(today, dt) <= 0);
  const match = filter === "all" || d.job === filter;
  return {
    dt,
    past,
    match,
    dim: !match || past,
    wd: dt ? WEEKDAYS[weekdayOf(dt)] : d.wd,
    date: dt ? `${dayNum(dt)} ${MONTHS[monthIdx(dt)]}`.toUpperCase() : "",
  };
}

const markWords = (d: CalDay) => (d.bs ? "Our work, for Beirut Station" : d.work ? "Our work" : "Sample");

// Desktop cell (D 1782-1784): "3 to go, Tuesday. Reel. Fill tables. Our work, for Beirut Station."
export function cellAria(d: CalDay, x: DayView): string {
  const date = x.dt ? `, ${dayNum(x.dt)} ${MONTHS[monthIdx(x.dt)]}` : "";
  return `${d.words}, ${CAL_WEEKDAY_FULL[x.wd]}${date}. ${d.fmtWord}. ${CAL_JOBS[d.job]}. ${markWords(d)}.`;
}

// "3 TO GO · TUE" plus " 20 NOV" when dated (the brief's code line)
export const briefCode = (d: CalDay, x: DayView) => `${d.code} · ${x.wd.toUpperCase()}${x.dt ? ` ${x.date}` : ""}`;

export const glyphOf = (d: CalDay) => ({ d: CAL_GLYPH[d.glyph], dash: d.glyph === "stories" ? "3 2.4" : undefined });

// ---------- the desktop grid (D 1798-1822) ----------

export type LaneSeg = { key: string; col: number; span: number; label: string; tone: "muted" | "cream" };
export type WeekCell = { col: number; day: CalDay };
export type Week = {
  key: string;
  lane: LaneSeg[];
  cells: WeekCell[];
  more: { col: number; span: number } | null;
};

// Monday-first column of a date
const mondayCol = (d: Ymd) => (weekdayOf(d) + 6) % 7;

// Lay the days out from the weekday nine days before doors: Wednesday when undated
export function layoutWeeks(opening: Ymd | null, showAll: boolean): Week[] {
  const startCol = opening ? mondayCol(addDays(opening, -9)) : 2;
  const last = showAll ? CAL_COUNT - 1 : CAL_SHOWN_LAST;
  const rows: { cells: WeekCell[]; more: { col: number; span: number } | null }[] = [];
  const rowAt = (r: number) => {
    while (rows.length <= r) rows.push({ cells: [], more: null });
    return rows[r];
  };
  for (let i = 0; i <= last; i++) {
    const pos = startCol + i;
    rowAt(Math.floor(pos / 7)).cells.push({ col: pos % 7, day: CAL_DAYS[i] });
  }
  if (!showAll) {
    const mp = startCol + CAL_SHOWN_LAST + 1;
    let mr = Math.floor(mp / 7);
    let mc = mp % 7;
    if (mc === 6) {
      mr += 1;
      mc = 0;
    }
    rowAt(mr).more = { col: mc, span: mc === 0 ? 2 : 7 - mc };
  }
  return rows.map((r, ri) => {
    type Mark = { col: number; end: number; phase: CalPhase; first: boolean };
    const marks: Mark[] = r.cells.map((c) => ({
      col: c.col,
      end: c.col + 1,
      phase: c.day.phase,
      first: c.day.idx === 0 || c.day.idx === 9 || c.day.idx === 10,
    }));
    if (r.more) marks.push({ col: r.more.col, end: r.more.col + r.more.span, phase: "after", first: false });
    const segs: Mark[] = [];
    marks.forEach((m, k) => {
      if (k === 0 || m.phase !== marks[k - 1].phase) segs.push({ ...m });
      else segs[segs.length - 1].end = m.end;
    });
    const lane = segs.map((g, k) => {
      const ph = CAL_PHASE[g.phase];
      return { key: `l${k}`, col: g.col, span: Math.max(1, g.end - g.col), label: g.first ? ph.label : "", tone: ph.color };
    });
    return { key: `w${ri}`, lane, cells: r.cells, more: r.more };
  });
}

// ---------- the week rows (1200px and below, Cal-4-week-rows) ----------

// Day one's place in the 30
export const CAL_DOOR = 9;

export type RowTile = { col: number; day: CalDay };
export type RowWeek = {
  key: string;
  // "Build-up", "Opening week", "Week 2"
  label: string;
  // "21–27 OCT" when dated, else "9 to go – 5 to go"
  range: string;
  // The row's group name: "Build-up: Wednesday 21 October to Sunday 25 October"
  aria: string;
  opening: boolean;
  tiles: RowTile[];
  // The key (our work, sample, opening day) sits in the wider run of empty cells
  legend: { col: number; span: number; end: boolean } | null;
};

const longDay = (d: Ymd) => `${CAL_WEEKDAY_FULL[WEEKDAYS[weekdayOf(d)]]} ${dayNum(d)} ${MONTHS_FULL[monthIdx(d)]}`;
const shortDate = (d: Ymd) => `${dayNum(d)} ${MONTHS[monthIdx(d)]}`;

function dateRange(a: Ymd, b: Ymd): string {
  if (a === b) return shortDate(a);
  if (monthIdx(a) === monthIdx(b)) return `${dayNum(a)}–${shortDate(b)}`;
  return `${shortDate(a)} – ${shortDate(b)}`;
}

// Monday-first rows from the weekday nine days before doors (Wednesday when undated, so day one is a Friday)
export function layoutRows(opening: Ymd | null): RowWeek[] {
  const s0 = opening ? mondayCol(addDays(opening, -9)) : 2;
  const n = Math.ceil((s0 + CAL_COUNT) / 7);
  const doorRow = Math.floor((s0 + CAL_DOOR) / 7);
  const trail = n * 7 - (s0 + CAL_COUNT);
  const keyEnd = trail >= s0;
  const keySpan = keyEnd ? trail : s0;
  const weeks: RowWeek[] = [];
  for (let r = 0; r < n; r++) {
    const tiles: RowTile[] = [];
    for (let i = 0; i < CAL_COUNT; i++) if (Math.floor((s0 + i) / 7) === r) tiles.push({ col: (s0 + i) % 7, day: CAL_DAYS[i] });
    const first = tiles[0].day;
    const last = tiles[tiles.length - 1].day;
    const opens = r === doorRow;
    const label = opens ? "Opening week" : last.idx < CAL_DOOR ? "Build-up" : `Week ${r - doorRow + 1}`;
    let range: string;
    let spoken: string;
    if (opening) {
      const a = addDays(opening, first.off);
      const b = addDays(opening, last.off);
      range = dateRange(a, b);
      spoken = a === b ? longDay(a) : `${longDay(a)} to ${longDay(b)}`;
    } else {
      range = first === last ? first.words : `${first.words} – ${last.words}`;
      spoken = first === last ? first.words : `${first.words} through ${last.words}`;
    }
    const legend =
      keySpan > 1 && r === (keyEnd ? n - 1 : 0) ? { col: keyEnd ? 7 - trail : 0, span: keySpan, end: keyEnd } : null;
    weeks.push({ key: `r${r}`, label, range, aria: `${label}: ${spoken}`, opening: opens, tiles, legend });
  }
  return weeks;
}

// The tile's own label: the date when one is set, else the countdown before doors, "Open" on day one, then the day
export function tileLabel(d: CalDay, x: DayView): string {
  if (x.dt) return String(dayNum(x.dt));
  if (d.idx < CAL_DOOR) return String(CAL_DOOR - d.idx);
  return d.idx === CAL_DOOR ? "Open" : String(d.idx - CAL_DOOR + 1);
}

// "9 to go, Wednesday 21 October, already past. The room, before anyone sees it. Reel. Get found. Our work." Day
// one's tile reads "Open" until a date is set, so its name starts with that word (WCAG 2.5.3).
export function tileAria(d: CalDay, x: DayView): string {
  const open = !x.dt && d.idx === CAL_DOOR ? "Open: " : "";
  return `${open}${dayWords(d, x)}. ${d.title} ${d.fmtWord}. ${CAL_JOBS[d.job]}. ${markWords(d)}.`;
}

// "9 to go, Wednesday 21 October, already past": what stepping to a day announces
export function dayWords(d: CalDay, x: DayView): string {
  const date = x.dt ? ` ${dayNum(x.dt)} ${MONTHS_FULL[monthIdx(x.dt)]}` : "";
  const words = d.idx === CAL_DOOR && !x.dt ? d.words.toLowerCase() : d.words;
  return `${words}, ${CAL_WEEKDAY_FULL[x.wd]}${date}${x.past ? ", already past" : ""}`;
}

// The brief's code line on the rows: "9 TO GO · WED", then the date on its own (struck through once past)
export const rowCode = (d: CalDay, x: DayView) => `${d.words} · ${x.wd}`;
export const rowDate = (x: DayView) => (x.dt ? shortDate(x.dt) : "");

// Previous and next on the rows walk only the days the filter keeps: the next one that way, or -1
export function stepKept(from: number, dir: -1 | 1, filter: CalFilter): number {
  for (let i = from + dir; i >= 0 && i < CAL_COUNT; i += dir) if (filter === "all" || CAL_DAYS[i].job === filter) return i;
  return -1;
}
