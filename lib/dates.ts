import { booking } from "./config";

// Calendar dates are handled as "YYYY-MM-DD" strings in London time, so a call booked late at night still counts
// from the London date it was booked on.
export type Ymd = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function londonToday(now = new Date()): Ymd {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: booking.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function toUtcNoon(d: Ymd) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12));
}

export function addDays(d: Ymd, n: number): Ymd {
  const t = toUtcNoon(d);
  t.setUTCDate(t.getUTCDate() + n);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

// How far ahead an opening date may be (the form, the d4 calendar and /api/submit all use it)
export const OPENING_MAX_DAYS = 730;

export const weekdayOf = (d: Ymd) => toUtcNoon(d).getUTCDay();

export function daysBetween(a: Ymd, b: Ymd) {
  return Math.round((toUtcNoon(b).getTime() - toUtcNoon(a).getTime()) / 86400000);
}

export const formatDay = (d: Ymd, opts: Intl.DateTimeFormatOptions) =>
  toUtcNoon(d).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

export const longDate = (d: Ymd) => formatDay(d, { weekday: "long", day: "numeric", month: "long" });

// The real instant of a London wall-clock time, allowing for British Summer Time
export function londonToUtc(d: Ymd, time: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, day, h, min);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: booking.timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess - (wall - guess));
}

// The call days on offer for a form sent today: day 3 and day 4, moved on past any day Nes & Gaby don't take calls
export function offeredDates(now = new Date()): Ymd[] {
  const today = londonToday(now);
  const want = booking.daysAhead.length;
  const out: Ymd[] = [];
  for (let n = Math.min(...booking.daysAhead); out.length < want && n < 30; n++) {
    const d = addDays(today, n);
    if (booking.callDays.includes(weekdayOf(d))) out.push(d);
  }
  return out;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

// A real calendar date written YYYY-MM-DD
export function isYmd(v: unknown): v is Ymd {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, 12));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

// "Sun 1 Nov"
export function shortDay(d: Ymd) {
  const [, m, day] = d.split("-").map(Number);
  return `${WEEKDAYS[weekdayOf(d)]} ${day} ${MONTHS[m - 1]}`;
}

// "Nov"
export const shortMonth = (d: Ymd) => MONTHS[Number(d.split("-")[1]) - 1];
