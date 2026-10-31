"use client";

// d4, "Thirty days. Every post planned.": the example 30-day launch plan (artboard B-desktop 366-606, logic
// 1662-1871). Above 1200px a week grid with a brief under the open day's row; at 1200px and below week rows of small
// post tiles, with the brief under the tapped tile's row (Cal-4-week-rows). The opening day is shared with the form's
// step 3 (useOpening).
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import PlanButton from "@/components/ui/PlanButton";
import { CAL_DAYS, calIndex, type CalDay } from "@/content/calendar";
import { MQ, useLondonToday, useMediaQuery } from "@/lib/client/device";
import { useOpening } from "@/lib/client/opening";
import { addDays, OPENING_MAX_DAYS } from "@/lib/dates";
import { useOverlay } from "@/lib/client/overlay";
import { useSectionRef } from "@/lib/client/sections";
import { DeskBrief, RowBrief, type BriefNav } from "./CalBrief";
import { Glyph, LogoPlate } from "./CalParts";
import CalRows from "./CalRows";
import {
  CAL_COUNT,
  CAL_FILTERS,
  CAL_SHOWN_LAST,
  calStatus,
  cellAria,
  dayView,
  dayWords,
  filterLive,
  layoutRows,
  layoutWeeks,
  stepKept,
  type CalFilter,
  type DayView,
} from "./calView";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Smooth scrolling only with motion on and no reduced-motion setting
function smooth(): boolean {
  return document.documentElement.dataset.motion === "on" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Two lines each on the phone's filter bar, so all five fit across it (Cal-4)
const CHIP_LINES: Record<CalFilter, [string, string]> = {
  all: ["All", ""],
  found: ["Get", "found"],
  followed: ["Get", "followed"],
  in: ["Fill", "tables"],
  back: ["Bring them", "back"],
};

// The part of the window the page shows through: under the sticky header (none on the phone) and above the phone's
// bottom bar while it shows
function viewBand(): { top: number; bottom: number } {
  const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
  const bar = document.querySelector<HTMLElement>(".bbar");
  const barTop = bar && bar.getClientRects().length ? bar.getBoundingClientRect().top : window.innerHeight;
  return { top, bottom: Math.min(window.innerHeight, barTop) };
}

// Bring day i's row and its open brief into view together, the row first if both do not fit (Cal-4 reveal). The
// brief's panel is measured rather than its clip, so a brief still growing open counts at its full height.
function revealRow(i: number, animate: boolean) {
  const tile = document.getElementById(`cal-t-${CAL_DAYS[i].id}`);
  const row = tile?.closest<HTMLElement>(".cal-rwk");
  if (!tile || !row) return;
  const { top, bottom } = viewBand();
  const rowTop = row.getBoundingClientRect().top - 12;
  const panel = document.getElementById("cal-rbrief");
  const end = (panel && row.contains(panel) ? panel : tile).getBoundingClientRect().bottom + 16;
  let dy = 0;
  if (end > bottom) dy = end - bottom;
  if (rowTop - dy < top) dy = rowTop - top;
  if (Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior: animate ? "smooth" : "instant" });
}

// The first day hidden behind "And 13 more." gets focus when they are shown
const FIRST_HIDDEN = CAL_DAYS[CAL_SHOWN_LAST + 1].id;

// The cell's picture and labels are one aria-hidden layer; a transparent button over the whole cell carries the
// artboard's spoken label (D 1782-1784). That keeps the label verbatim and the visible text out of the button, so
// the name never contradicts what is shown (WCAG 2.5.3).
function Cell({ d, x, open, onOpen }: { d: CalDay; x: DayView; open: boolean; onOpen: (id: string) => void }) {
  const m = d.media;
  const date = x.dt ? <span className={cx("cal-cdate", x.past && "is-past")}>{x.date}</span> : null;
  // The picture and labels are hidden from assistive tech; a transparent button over the whole day carries the
  // artboard's label (aria-label strings verbatim), so the visible text never has to match it (WCAG 2.5.3)
  return (
    <div
      className={cx(
        "cal-cell",
        m ? "cal-cell--work" : "cal-cell--sample",
        d.id === "d1" && "cal-cell--d1",
        x.dim && "is-dim",
        open && "is-open",
      )}
    >
      <span className="cal-vis" aria-hidden="true">
        {visual(d, x, date)}
      </span>
      <button
        type="button"
        id={`cal-c-${d.id}`}
        className="cal-hit"
        aria-label={cellAria(d, x)}
        aria-expanded={open}
        aria-controls={open ? "cal-brief" : undefined}
        onClick={() => onOpen(d.id)}
      />
      <span className="cal-ring" aria-hidden="true" />
    </div>
  );
}

function visual(d: CalDay, x: DayView, date: JSX.Element | null) {
  const m = d.media;
  return (
    <>
      {m ? (
        <>
          <img
            className="cal-cimg cal-dim"
            src={m.kind === "video" ? m.poster : m.src}
            alt=""
            width={m.width}
            height={m.height}
            loading="lazy"
            decoding="async"
          />
          <span className="cal-cday">
            <span>{d.day}</span>
            {date}
          </span>
          <LogoPlate className="cal-cstamp" />
          <span className="cal-ctag">
            <Glyph day={d} size={14} />
            <span>{d.tag}</span>
          </span>
        </>
      ) : (
        <>
          <span className="cal-cday cal-cday--bare">
            <span>{d.day}</span>
            {date}
          </span>
          <span className="cal-sbadge">SAMPLE</span>
          <span className="cal-sglyph cal-dim" aria-hidden="true">
            <Glyph day={d} size={32} />
          </span>
          <span className="cal-sfoot">
            <span className="cal-sfmt">{d.fmtWord.toUpperCase()}</span>
            <span className="cal-sjob">{d.tag}</span>
          </span>
        </>
      )}
    </>
  );
}

export default function Calendar() {
  const ref = useSectionRef("d4");
  const today = useLondonToday();
  const { opening, setOpeningDate } = useOpening();
  const isRows = useMediaQuery(MQ.swiper);
  const overlay = useOverlay();
  const overlayOpen = overlay.state.kind !== "none";

  const [filter, setFilter] = useState<CalFilter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  // The rows' brief grows open: a fresh open with motion on. Moving to another day in the same row keeps it as it
  // was (the brief stays mounted); stepping into another row never slides.
  const [slide, setSlide] = useState(false);
  // Each announcement is a new node, so a repeat of the last one (stepping back onto the same day) is read again
  const [announce, setAnnounceState] = useState({ text: "", n: 0 });
  const setAnnounce = (text: string) => setAnnounceState((a) => ({ text, n: a.n + 1 }));

  const tileRef = useRef<HTMLButtonElement>(null);
  // Work to do once the next render is on screen (focus, scrolling), like setState's callback in the artboard
  const after = useRef<(() => void) | null>(null);
  useEffect(() => {
    const f = after.current;
    if (f) {
      after.current = null;
      f();
    }
  });
  // The same, before the browser paints: the rows hold the tapped tile (or the stepped brief) still on screen while
  // the brief moves between rows, then scroll only as far as they must
  const beforePaint = useRef<(() => void) | null>(null);
  useIsoLayoutEffect(() => {
    const f = beforePaint.current;
    if (f) {
      beforePaint.current = null;
      f();
    }
  });

  // The element focused inside the calendar, while focus is in it. Kept when it was removed while focused (Chrome
  // blurs a node as it is removed), so the swap below can tell focus was lost with the old brief.
  const focusIn = useRef<Element | null>(null);
  // Whether the calendar is on screen. The observer reports after layout, so while the layouts swap this still says
  // where the reader was (the rows are far shorter than the grid, so the page reflows under them).
  const onScreen = useRef(false);
  useEffect(() => {
    const el = document.getElementById("d4");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      onScreen.current = e.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // Crossing 1200px with a day open swaps one brief for the other. If focus was in the calendar and is now gone with
  // the old brief, or sits in the layout just hidden (the grid's cells or the rows' tiles), put it on the open day's
  // tile or cell, and bring the brief into view if the calendar was on screen. Focus anywhere else, or nowhere (a tap
  // in Safari focuses nothing), is left alone and nothing scrolls.
  const wasRows = useRef(isRows);
  useIsoLayoutEffect(() => {
    if (wasRows.current === isRows) return;
    wasRows.current = isRows;
    const el = focusIn.current;
    if (!open || !el) return;
    const lost = !el.isConnected || !!el.closest(isRows ? ".cal-dt" : ".cal-rw");
    if (!lost) return;
    document.getElementById(isRows ? `cal-t-${open}` : `cal-c-${open}`)?.focus({ preventScroll: true });
    if (!onScreen.current) return;
    if (isRows) revealRow(calIndex(open), false);
    else document.getElementById("cal-brief")?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [isRows, open]);

  const { opening: openDate, status } = calStatus(opening, today);
  const views = useMemo(() => CAL_DAYS.map((d) => dayView(d, openDate, today, filter)), [openDate, today, filter]);
  const weeks = useMemo(() => layoutWeeks(openDate, more), [openDate, more]);
  const rows = useMemo(() => layoutRows(openDate), [openDate]);
  const rowOf = (i: number) => rows.findIndex((w) => w.tiles.some((t) => t.day.idx === i));
  const openIdx = open ? calIndex(open) : -1;

  // ----- handlers (D 1676-1757) -----
  const pickFilter = (job: CalFilter) => {
    setFilter(job);
    setAnnounce(filterLive(job));
  };

  // The element's top on screen now, so it can be held there through the next render
  const holdTop = (elId: string) => document.getElementById(elId)?.getBoundingClientRect().top ?? null;
  const holdStill = (elId: string, was: number | null) => {
    const el = document.getElementById(elId);
    if (!el || was === null) return;
    const dy = el.getBoundingClientRect().top - was;
    if (Math.abs(dy) > 0.5) window.scrollBy({ top: dy, behavior: "instant" });
  };

  const closeBrief = (refocus: boolean) => {
    const id = open;
    if (!id) return;
    setOpen(null);
    if (isRows) {
      const i = calIndex(id);
      beforePaint.current = () => {
        if (refocus) document.getElementById(`cal-t-${id}`)?.focus({ preventScroll: true });
        revealRow(i, smooth());
      };
    } else if (refocus) {
      after.current = () => document.getElementById(`cal-c-${id}`)?.focus();
    }
  };

  const openDay = (id: string, keyboard = false) => {
    // Clicking the open day again closes it
    if (open === id) {
      closeBrief(false);
      return;
    }
    const i = calIndex(id);
    if (isRows) {
      // The tapped tile stays where it is on screen while the brief leaves another row and opens under this one.
      // From the keyboard, focus moves into the brief.
      const tileId = `cal-t-${id}`;
      const was = holdTop(tileId);
      setSlide(openIdx > -1 && rowOf(openIdx) === rowOf(i) ? slide : smooth());
      setOpen(id);
      // So the day is there on the desktop grid too if the window widens
      if (i > CAL_SHOWN_LAST) setMore(true);
      beforePaint.current = () => {
        holdStill(tileId, was);
        if (keyboard) document.getElementById("cal-rbrief")?.focus({ preventScroll: true });
        revealRow(i, smooth());
      };
      return;
    }
    setOpen(id);
    if (i > CAL_SHOWN_LAST) setMore(true);
    after.current = () => {
      const el = document.getElementById("cal-brief");
      if (!el) return;
      // It scrolls only as far as it must
      el.scrollIntoView({ block: "nearest", behavior: smooth() ? "smooth" : "auto" });
    };
  };

  // On the rows, previous and next skip the days the filter dims (Cal-4); the grid walks every day
  const stepTo = (dir: -1 | 1) => (openIdx < 0 ? -1 : isRows ? stepKept(openIdx, dir, filter) : openIdx + dir);

  const step = (dir: -1 | 1) => {
    const t = stepTo(dir);
    if (t < 0 || t > CAL_COUNT - 1) return;
    const boxId = isRows ? "cal-rbrief" : "cal-brief";
    const had = !!document.getElementById(boxId)?.contains(document.activeElement);
    // The brief can move to another row and remount: keep focus on the same control
    const which = dir < 0 ? "prev" : "next";
    const refocus = () => {
      const box = document.getElementById(boxId);
      if (box && !box.contains(document.activeElement)) box.querySelector<HTMLElement>(`[data-step="${which}"]`)?.focus({ preventScroll: isRows });
    };
    setOpen(CAL_DAYS[t].id);
    if (t > CAL_SHOWN_LAST) setMore(true);
    // Focus stays on previous or next, so the new day is announced
    setAnnounce(`${dayWords(CAL_DAYS[t], views[t])}. ${CAL_DAYS[t].title}`);
    if (isRows) {
      // The brief holds still on screen and the rows move around it
      const was = holdTop(boxId);
      if (rowOf(openIdx) !== rowOf(t)) setSlide(false);
      beforePaint.current = () => {
        holdStill(boxId, was);
        if (had) refocus();
        revealRow(t, false);
      };
      return;
    }
    after.current = refocus;
  };

  const showAll = () => {
    setMore(true);
    after.current = () => document.getElementById(`cal-c-${FIRST_HIDDEN}`)?.focus();
  };

  const showFewer = () => {
    setMore(false);
    if (openIdx > CAL_SHOWN_LAST) setOpen(null);
    after.current = () => tileRef.current?.focus();
  };

  // Esc on a day or in its brief closes the brief and returns to the day (not from the date field or the filters)
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && open && (e.target as Element).closest(".cal-dt, .cal-rw")) {
      e.preventDefault();
      closeBrief(true);
    }
  };

  const nav: BriefNav = {
    first: stepTo(-1) < 0,
    last: stepTo(1) < 0 || stepTo(1) > CAL_COUNT - 1,
    onPrev: () => step(-1),
    onNext: () => step(1),
    onClose: () => closeBrief(true),
  };
  const openDayData = openIdx > -1 ? CAL_DAYS[openIdx] : null;

  return (
    <section
      id="d4"
      ref={ref}
      aria-labelledby="d4-h"
      className="cal"
      onKeyDown={onKey}
      onFocus={(e) => {
        focusIn.current = e.target;
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        // Focus left the calendar, unless the node was removed while focused (checked once the commit is done)
        const t = e.target;
        queueMicrotask(() => {
          if (focusIn.current === t && t.isConnected) focusIn.current = null;
        });
      }}
    >
      <div className="wrap">
        <p className="kicker cal-kick">YOUR FREE LAUNCH PLAN · AN EXAMPLE</p>
        <h2 id="d4-h" className="h2 cal-h2">
          <span className="cal-h2l">Thirty days.</span> <span className="cal-h2l">Every post planned.</span>
        </h2>

        <div className="cal-top">
          <div className="cal-ctl">
            <div className="cal-datewrap">
              <label htmlFor="cal-date" className="cal-datelab">
                YOUR OPENING DAY
              </label>
              <input
                id="cal-date"
                className="fld cal-date"
                type="date"
                min={today ?? undefined}
                max={today ? addDays(today, OPENING_MAX_DAYS) : undefined}
                value={opening.kind === "date" ? opening.date : ""}
                onChange={(e) => {
                  setSlide(false);
                  setOpeningDate(e.target.value);
                }}
              />
            </div>
            <div className="cal-chips" role="group" aria-label="Show posts by their job">
              {CAL_FILTERS.map((f) => {
                const [l1, l2] = CHIP_LINES[f.id];
                return (
                  <button
                    key={f.id}
                    type="button"
                    className="chipb"
                    aria-label={f.label}
                    aria-pressed={filter === f.id}
                    onClick={() => pickFilter(f.id)}
                  >
                    <span className="cal-chl">{l1}</span>
                    {l2 && (
                      <>
                        {" "}
                        <span className="cal-chl">{l2}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="cal-stat">
            <p id="cal-status" className="cal-status" aria-live="polite">
              {status}
            </p>
            <p className="cal-leg">
              <LogoPlate className="cal-leglogo" />
              <span className="cal-legtx">OUR WORK</span>
            </p>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          <span key={announce.n}>{announce.text}</span>
        </p>

        <div className="cal-dt">
          <div className="cal-wkh" aria-hidden="true">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>
          <div className="cal-weeks" role="group" aria-label="The 30 days">
            {weeks.map((w) => {
              const hasBrief = !isRows && !!openDayData && w.cells.some((c) => c.day.idx === openIdx);
              return (
                <div key={w.key} className="cal-week">
                  <div className="cal-lane" aria-hidden="true">
                    {w.lane.map((s) => (
                      <span key={s.key} className="cal-seg" style={{ gridColumn: `${s.col + 1} / span ${s.span}` }}>
                        <span className={cx("cal-seglab", s.tone === "cream" && "is-cream")}>{s.label}</span>
                        <span className="cal-segline" />
                      </span>
                    ))}
                  </div>
                  <ol className="cal-row">
                    {w.cells.map((c) => (
                      <li key={c.day.id} className="cal-li" style={{ gridColumn: `${c.col + 1} / span 1` }}>
                        <Cell d={c.day} x={views[c.day.idx]} open={open === c.day.id} onOpen={openDay} />
                      </li>
                    ))}
                    {w.more && (
                      <li className="cal-li cal-li--more" style={{ gridColumn: `${w.more.col + 1} / span ${w.more.span}` }}>
                        <button
                          ref={tileRef}
                          type="button"
                          className="cal-more"
                          aria-expanded="false"
                          aria-label="And 13 more: days 9 to 21"
                          onClick={showAll}
                        >
                          And 13 more.
                        </button>
                      </li>
                    )}
                  </ol>
                  {hasBrief && openDayData && (
                    <DeskBrief day={openDayData} x={views[openIdx]} nav={nav} overlayOpen={overlayOpen} />
                  )}
                </div>
              );
            })}
          </div>
          {more && (
            <div className="cal-fewer">
              <button type="button" className="ulink" aria-expanded="true" onClick={showFewer}>
                Show fewer
              </button>
            </div>
          )}
        </div>

        <CalRows
          views={views}
          weeks={rows}
          open={open}
          briefRow={isRows && openDayData ? rowOf(openIdx) : -1}
          brief={
            isRows &&
            openDayData && (
              <RowBrief
                day={openDayData}
                x={views[openIdx]}
                nav={nav}
                overlayOpen={overlayOpen}
                col={rows[rowOf(openIdx)].tiles.find((t) => t.day.idx === openIdx)?.col ?? 0}
                slide={slide}
              />
            )
          }
          onOpen={openDay}
        />

        <div className="cal-close">
          <p className="cal-closeq">Want this for your opening?</p>
          <PlanButton />
        </div>
      </div>
    </section>
  );
}
