"use client";

// d4, "Thirty days. Every post planned.": the example 30-day launch plan (artboard B-desktop 366-606, logic
// 1662-1871; phone B-phone-5). Above 1200px a week grid with a brief under the open day's row; at 1200px and below
// a sideways swiper with the brief under it. The opening day is shared with the form's step 3 (useOpening).
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import PlanButton from "@/components/ui/PlanButton";
import { CAL_DAYS, calIndex, type CalDay } from "@/content/calendar";
import { MQ, useLondonToday, useMediaQuery, usePhone } from "@/lib/client/device";
import { useOpening } from "@/lib/client/opening";
import { addDays, OPENING_MAX_DAYS } from "@/lib/dates";
import { useOverlay } from "@/lib/client/overlay";
import { useActiveSection, useSectionRef } from "@/lib/client/sections";
import { DeskBrief, PhoneBrief, type BriefNav } from "./CalBrief";
import { Glyph, LogoPlate } from "./CalParts";
import CalSwiper from "./CalSwiper";
import {
  CAL_COUNT,
  CAL_FILTERS,
  CAL_SHOWN_LAST,
  calStatus,
  cellAria,
  dayView,
  filterLive,
  layoutWeeks,
  matchFrom,
  type CalFilter,
  type DayView,
} from "./calView";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// Smooth scrolling only with motion on and no reduced-motion setting
function smooth(): boolean {
  return document.documentElement.dataset.motion === "on" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const isSwiper = useMediaQuery(MQ.swiper);
  const isPhone = usePhone();
  const section = useActiveSection();
  const overlay = useOverlay();
  const overlayOpen = overlay.state.kind !== "none";

  const [filter, setFilter] = useState<CalFilter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [cur, setCur] = useState(0);
  const [announce, setAnnounce] = useState("");

  const swRef = useRef<HTMLDivElement>(null);
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

  const { opening: openDate, status } = calStatus(opening, today);
  const views = useMemo(() => CAL_DAYS.map((d) => dayView(d, openDate, today, filter)), [openDate, today, filter]);
  const weeks = useMemo(() => layoutWeeks(openDate, more), [openDate, more]);
  const openIdx = open ? calIndex(open) : -1;

  // ----- the swiper's current card -----
  // While a programmatic smooth scroll runs, its passing positions are not the current card
  const target = useRef<number | null>(null);
  const targetTimer = useRef(0);
  const frame = useRef(0);
  // The card last chosen by a tap, a filter jump or the brief. On a wide swiper the last few cards can never reach
  // the start, so at the end of the scroll a chosen card that is fully in view stays current.
  const chosen = useRef<number | null>(null);

  const measure = useCallback(() => {
    frame.current = 0;
    const sw = swRef.current;
    if (!sw) return;
    const cards = sw.querySelectorAll<HTMLElement>("[data-card]");
    const x = sw.scrollLeft + 16;
    let best = 0;
    let bd = Infinity;
    cards.forEach((c, i) => {
      const dd = Math.abs(c.offsetLeft - x);
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    });
    const atEnd = sw.scrollLeft >= sw.scrollWidth - sw.clientWidth - 1;
    const ch = chosen.current !== null ? cards[chosen.current] : null;
    if (atEnd && ch && ch.offsetLeft >= sw.scrollLeft && ch.offsetLeft + ch.offsetWidth <= sw.scrollLeft + sw.clientWidth) {
      best = chosen.current as number;
    } else if (target.current === null) {
      chosen.current = null;
    }
    if (target.current !== null) {
      if (best !== target.current) return;
      target.current = null;
    }
    setCur((c) => (c === best ? c : best));
  }, []);

  const onSwScroll = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(measure);
  }, [measure]);

  useEffect(() => {
    const sw = swRef.current;
    const onEnd = () => {
      target.current = null;
      measure();
    };
    sw?.addEventListener("scrollend", onEnd);
    return () => {
      sw?.removeEventListener("scrollend", onEnd);
      if (frame.current) cancelAnimationFrame(frame.current);
      window.clearTimeout(targetTimer.current);
    };
  }, [measure]);

  // Scroll the swiper so card i sits at the start (D 1687-1695)
  const swTo = useCallback(
    (i: number, animate: boolean) => {
      setCur(i);
      chosen.current = i;
      const sw = swRef.current;
      const card = sw?.querySelectorAll<HTMLElement>("[data-card]")[i];
      if (!sw || !card) return;
      window.clearTimeout(targetTimer.current);
      target.current = animate ? i : null;
      if (animate)
        targetTimer.current = window.setTimeout(() => {
          target.current = null;
          measure();
        }, 1000);
      sw.scrollTo({ left: card.offsetLeft - 16, behavior: animate ? "smooth" : "auto" });
    },
    [measure],
  );

  // Coming into the swiper layout with a day already current: show that card
  const curRef = useRef(cur);
  curRef.current = cur;
  useEffect(() => {
    if (isSwiper) swTo(curRef.current, false);
  }, [isSwiper, swTo]);

  // ----- handlers (D 1676-1757) -----
  const pickFilter = (job: CalFilter) => {
    setFilter(job);
    setAnnounce(filterLive(job));
    if (isSwiper && job !== "all") {
      const t = matchFrom(cur, job);
      if (t !== cur) swTo(t, smooth());
    }
  };

  const closeBrief = (refocus: boolean) => {
    const id = open;
    if (!id) return;
    setOpen(null);
    if (refocus) {
      const sw = isSwiper;
      after.current = () => document.getElementById(`${sw ? "cal-p-" : "cal-c-"}${id}`)?.focus();
    }
  };

  const openDay = (id: string) => {
    // Clicking the open day again closes it
    if (open === id) {
      closeBrief(false);
      return;
    }
    const i = calIndex(id);
    setOpen(id);
    if (i > CAL_SHOWN_LAST) setMore(true);
    const sw = isSwiper;
    const phone = isPhone;
    if (sw) swTo(i, smooth());
    after.current = () => {
      const el = document.getElementById(sw ? "cal-pbrief" : "cal-brief");
      if (!el) return;
      const behavior: ScrollBehavior = smooth() ? "smooth" : "auto";
      if (sw) el.focus({ preventScroll: true });
      // Phone: the brief sits 56px from the top. Elsewhere it scrolls only as far as it must.
      if (phone) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 56, behavior });
      else el.scrollIntoView({ block: "nearest", behavior });
    };
  };

  const step = (dir: -1 | 1) => {
    if (openIdx < 0) return;
    const t = openIdx + dir;
    if (t < 0 || t > CAL_COUNT - 1) return;
    setOpen(CAL_DAYS[t].id);
    if (t > CAL_SHOWN_LAST) setMore(true);
    const sw = isSwiper;
    if (sw) swTo(t, false);
    // On the grid the brief can move to another row and remount: keep focus on the same control
    const which = dir < 0 ? "prev" : "next";
    after.current = () => {
      const box = document.getElementById(sw ? "cal-pbrief" : "cal-brief");
      if (box && !box.contains(document.activeElement)) box.querySelector<HTMLElement>(`[data-step="${which}"]`)?.focus();
    };
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

  // Esc anywhere in d4 closes the brief and returns to its day
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closeBrief(true);
    }
  };

  const nav: BriefNav = {
    first: openIdx <= 0,
    last: openIdx >= CAL_COUNT - 1,
    onPrev: () => step(-1),
    onNext: () => step(1),
    onClose: () => closeBrief(true),
  };
  const openDayData = openIdx > -1 ? CAL_DAYS[openIdx] : null;

  return (
    <section id="d4" ref={ref} aria-labelledby="d4-h" className="cal" onKeyDown={onKey}>
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
                onChange={(e) => setOpeningDate(e.target.value)}
              />
            </div>
            <div className="cal-chips" role="group" aria-label="Show posts by their job">
              {CAL_FILTERS.map((f) => (
                <button key={f.id} type="button" className="chipb" aria-pressed={filter === f.id} onClick={() => pickFilter(f.id)}>
                  {f.label}
                </button>
              ))}
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
          {announce}
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
              const hasBrief = !isSwiper && !!openDayData && w.cells.some((c) => c.day.idx === openIdx);
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

        <CalSwiper
          views={views}
          open={open}
          cur={cur}
          canPlay={isSwiper && section.id === "d4"}
          overlayOpen={overlayOpen}
          shown={isSwiper}
          phone={isPhone}
          swRef={swRef}
          onScroll={onSwScroll}
          onOpen={openDay}
        >
          {isSwiper && openDayData && <PhoneBrief day={openDayData} x={views[openIdx]} nav={nav} />}
        </CalSwiper>

        <div className="cal-close">
          <p className="cal-closeq">Want this for your opening?</p>
          <PlanButton />
        </div>
      </div>
    </section>
  );
}
