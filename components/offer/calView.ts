// d4's view logic, ported from the artboard (B-desktop logic block, _calView, lines 1758-1871) and the phone screen
// (B-phone-5, matchFrom and the card labels). Pure functions only: no React, no window. Dates are London "YYYY-MM-DD"
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
  return `Showing ${CAL_DAYS.filter((d) => d.job === filter).length} of 30 days.`;
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

// Phone card (B-phone-5 539, amendment K6): the full month, then "Show the brief."
export function cardAria(d: CalDay, x: DayView): string {
  const date = x.dt ? `, ${dayNum(x.dt)} ${MONTHS_FULL[monthIdx(x.dt)]}` : "";
  return `${d.words}, ${CAL_WEEKDAY_FULL[x.wd]}${date}. ${d.fmtWord}. ${CAL_JOBS[d.job]}. ${markWords(d)}. Show the brief.`;
}

// "3 TO GO · TUE" plus " 20 NOV" when dated (the brief's code line)
export const briefCode = (d: CalDay, x: DayView) => `${d.code} · ${x.wd.toUpperCase()}${x.dt ? ` ${x.date}` : ""}`;

// "3 TO GO · TUE" (the phone card's first label line; the date sits on its own line under it)
export const cardCode = (d: CalDay, x: DayView) => `${d.code} · ${x.wd.toUpperCase()}`;

export const glyphOf = (d: CalDay) => ({ d: CAL_GLYPH[d.glyph], dash: d.glyph === "stories" ? "3 2.4" : undefined });

// The swiper's filter jump (B-phone-5 288-293, amendment K9): the first match at or after `from`, else the nearest
// one before it. "All", or no match at all, stays put.
export function matchFrom(from: number, filter: CalFilter): number {
  if (filter === "all") return from;
  for (let i = from; i < CAL_COUNT; i++) if (CAL_DAYS[i].job === filter) return i;
  for (let i = from - 1; i >= 0; i--) if (CAL_DAYS[i].job === filter) return i;
  return from;
}

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
