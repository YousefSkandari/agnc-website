"use client";

// d4's brief: one open day at a time. On the desktop grid it opens under the week row holding the day (D 452-500);
// on the week rows (1200px and below) under the row of the tapped tile, with a caret pointing at it (Cal-4).
import { useEffect, useState, type CSSProperties } from "react";
import { CAL_JOBS, type CalDay } from "@/content/calendar";
import { IconClose, IconNext, IconPrev } from "@/components/ui/icons";
import { useSaveData } from "@/lib/client/device";
import { useManagedVideo } from "@/lib/client/playback";
import { briefCode, rowCode, rowDate, type DayView } from "./calView";
import { Glyph, LogoMark, LogoPlate, PauseButton, PlayChip, PlayRound, videoUi } from "./CalParts";

export type BriefNav = {
  first: boolean;
  last: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

const rowsOf = (d: CalDay): [string, string][] => [
  ["FORMAT", d.fmt],
  ["ITS JOB", CAL_JOBS[d.job]],
  ["THE HOOK", d.hook],
  ["GOES OUT", d.out],
  ["WHY", d.why],
];

// Previous and next stay focusable at the ends (aria-disabled), so focus never drops to the page
function Controls({ nav }: { nav: BriefNav }) {
  return (
    <div className="cal-bctl">
      <button
        type="button"
        className={`icob cal-ib${nav.first ? " cal-ib--disabled" : ""}`}
        aria-label="Previous day"
        aria-disabled={nav.first || undefined}
        data-step="prev"
        onClick={() => {
          if (!nav.first) nav.onPrev();
        }}
      >
        <IconPrev size={20} />
      </button>
      <button
        type="button"
        className={`icob cal-ib${nav.last ? " cal-ib--disabled" : ""}`}
        aria-label="Next day"
        aria-disabled={nav.last || undefined}
        data-step="next"
        onClick={() => {
          if (!nav.last) nav.onNext();
        }}
      >
        <IconNext size={20} />
      </button>
      <button type="button" className="icob cal-ib" aria-label="Close the brief" onClick={nav.onClose}>
        <IconClose size={20} />
      </button>
    </div>
  );
}

// Reports whether any part of the element is on screen
function useOnScreen(el: Element | null, set: (on: boolean) => void) {
  useEffect(() => {
    if (!el) {
      set(false);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      set(true);
      return;
    }
    const io = new IntersectionObserver(([en]) => set(en.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [el, set]);
}

// The reel in a brief: muted, looped, key "cal", no postId (the calendar does not count towards the stop timer).
// Like the hero, it plays only while on screen with no overlay open, and a reel the visitor paused stays paused. It
// remounts per day (keyed by the caller), so a new day may start by itself again. `round`: the rows' narrow frame,
// where the play chip becomes a round button.
function BriefReel({ day, overlayOpen, round = false }: { day: CalDay; overlayOpen: boolean; round?: boolean }) {
  const m = day.media;
  const [onScreen, setOnScreen] = useState(false);
  const v = useManagedVideo("cal", { active: onScreen && !overlayOpen });
  useOnScreen(v.element, setOnScreen);
  const saveData = useSaveData();
  if (!m || m.kind !== "video") return null;
  const ui = videoUi(v, saveData);
  return (
    <>
      <video
        ref={v.ref}
        className="cal-bvid"
        src={m.video}
        poster={m.poster}
        muted
        playsInline
        loop
        preload={v.autoplay ? "auto" : "none"}
        aria-label={m.alt}
      />
      {ui.chip ? (
        round ? (
          <PlayRound v={v} tap={ui.tap} className="cal-rbplay" />
        ) : (
          <PlayChip v={v} tap={ui.tap} className="cal-chip" iconSize={18} />
        )
      ) : (
        <PauseButton v={v} className={round ? "cal-vbtn cal-rbpause" : "cal-vbtn cal-bpause"} />
      )}
    </>
  );
}

export function DeskBrief({ day, x, nav, overlayOpen }: { day: CalDay; x: DayView; nav: BriefNav; overlayOpen: boolean }) {
  const m = day.media;
  const frame = ["cal-bmedia", !m ? "cal-bmedia--sample" : day.id === "d1" ? "cal-bmedia--d1" : ""].filter(Boolean).join(" ");
  return (
    <div id="cal-brief" className="cal-brief cal-bin" role="region" aria-labelledby="cal-bt">
      <div className={frame}>
        {m?.kind === "video" && <BriefReel key={day.id} day={day} overlayOpen={overlayOpen} />}
        {m?.kind === "image" && <img className="cal-bimg" src={m.src} alt={m.alt} width={m.width} height={m.height} />}
        {m ? (
          <span className="cal-bstamp">
            <LogoMark />
            <span>{day.mark}</span>
          </span>
        ) : (
          <>
            <span className="cal-sbadge cal-bsbadge">SAMPLE</span>
            <span className="cal-bsample">
              <span className="cal-bsglyph" aria-hidden="true">
                <Glyph day={day} size={64} />
              </span>
              <span className="cal-bsfmt">{day.fmtWord}.</span>
              <span className="cal-bsnote">We write this one for you.</span>
            </span>
          </>
        )}
      </div>
      <div className="cal-bbody">
        <div className="cal-bhead">
          <p className="cal-bcode">{briefCode(day, x)}</p>
          <Controls nav={nav} />
        </div>
        <h3 id="cal-bt" className="cal-bt">
          {day.title}
        </h3>
        <dl className="cal-bdl">
          {rowsOf(day).map(([k, val]) => (
            <div key={k} className="cal-brow">
              <dt>{k}</dt>
              <dd>{val}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// The week rows' brief (Cal-4): the post on the left, the code, title, format and job beside it with the controls
// under them, then the hook, when it goes out and why across the full width. `col` places the caret over the tapped
// tile; `slide` grows it open (a fresh open with motion on; stepping or moving between rows never slides).
export function RowBrief({
  day,
  x,
  nav,
  overlayOpen,
  col,
  slide,
}: {
  day: CalDay;
  x: DayView;
  nav: BriefNav;
  overlayOpen: boolean;
  col: number;
  slide: boolean;
}) {
  const m = day.media;
  const wide = !!m && m.ratio > 0.6;
  const frame = ["cal-rbmedia", !m ? "cal-rbmedia--sample" : day.id === "d1" ? "cal-rbmedia--d1" : ""].filter(Boolean).join(" ");
  const date = rowDate(x);
  return (
    <div className={`cal-rb${slide ? " is-slide" : ""}`} style={{ "--col": col } as CSSProperties}>
      <svg className="cal-rbcaret" aria-hidden="true" focusable="false" width="16" height="9" viewBox="0 0 16 9">
        <path d="M0 9 L8 0.5 L16 9 Z" />
      </svg>
      <div className="cal-rbgrow">
        <div className="cal-rbclip">
          <div id="cal-rbrief" className="cal-rbp" role="region" tabIndex={-1} aria-labelledby="cal-rbt">
            <div className="cal-rbtop">
              <div className={frame}>
                {m?.kind === "video" && <BriefReel key={day.id} day={day} overlayOpen={overlayOpen} round />}
                {m?.kind === "image" && (
                  <img
                    className={`cal-rbimg${wide ? " is-wide" : ""}`}
                    src={m.src}
                    alt={m.alt}
                    width={m.width}
                    height={m.height}
                  />
                )}
                {m ? (
                  <LogoPlate className="cal-rbplate" />
                ) : (
                  <span className="cal-rbsample">
                    <span className="cal-rbsglyph" aria-hidden="true">
                      <Glyph day={day} size={28} />
                    </span>
                    <span className="cal-rbsfmt">{day.fmtWord}.</span>
                  </span>
                )}
              </div>
              <div className="cal-rbside">
                <p className="cal-rbcode">
                  <span className={day.id === "d1" ? "is-gold" : undefined}>{rowCode(day, x)}</span>
                  {date && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span className={`cal-rbdate${x.past ? " is-past" : ""}`}>{date}</span>
                    </>
                  )}
                </p>
                <p className="cal-rbmark">
                  {day.work ? <span>{day.mark}</span> : <span className="cal-rbsbadge">SAMPLE</span>}
                </p>
                <h3 id="cal-rbt" className="cal-rbt">
                  {day.title}
                </h3>
                <dl className="cal-rbdl">
                  <div>
                    <dt>FORMAT</dt>
                    <dd>{day.fmt}</dd>
                  </div>
                  <div>
                    <dt>ITS JOB</dt>
                    <dd>{CAL_JOBS[day.job]}</dd>
                  </div>
                </dl>
                <Controls nav={nav} />
              </div>
            </div>
            <dl className="cal-rbdl cal-rbdl--more">
              <div>
                <dt>THE HOOK</dt>
                <dd>{day.hook}</dd>
              </div>
              <div>
                <dt>GOES OUT</dt>
                <dd>{day.out}</dd>
              </div>
              <div>
                <dt>WHY</dt>
                <dd>{day.why}</dd>
              </div>
            </dl>
            {!day.work && <p className="cal-rbnote">We write this one for you.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
