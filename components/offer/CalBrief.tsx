"use client";

// d4's brief: one open day at a time. On the desktop grid it opens under the week row holding the day (D 452-500);
// under the phone swiper it opens below the counter (D 572-597, B-phone-5 140-176).
import { useEffect, useState } from "react";
import { CAL_JOBS, type CalDay } from "@/content/calendar";
import { IconClose, IconNext, IconPrev } from "@/components/ui/icons";
import { useSaveData } from "@/lib/client/device";
import { useManagedVideo } from "@/lib/client/playback";
import { briefCode, type DayView } from "./calView";
import { Glyph, LogoMark, PauseButton, PlayChip, videoUi } from "./CalParts";

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

// The reel in the desktop brief: muted, looped, key "cal", no postId (the calendar does not count towards the stop
// timer). Like the hero, it plays only while on screen with no overlay open, and a reel the visitor paused stays
// paused. It remounts per day (keyed by the caller), so a new day may start by itself again.
function BriefReel({ day, overlayOpen }: { day: CalDay; overlayOpen: boolean }) {
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
        <PlayChip v={v} tap={ui.tap} className="cal-chip" iconSize={18} />
      ) : (
        <PauseButton v={v} className="cal-vbtn cal-bpause" />
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

export function PhoneBrief({ day, x, nav }: { day: CalDay; x: DayView; nav: BriefNav }) {
  return (
    <div id="cal-pbrief" className="cal-pb cal-bin" tabIndex={-1} role="region" aria-labelledby="cal-pbt">
      <div className="cal-bhead cal-pbhead">
        <p className="cal-bcode cal-pbcode">{briefCode(day, x)}</p>
        <Controls nav={nav} />
      </div>
      <div className="cal-pbmark">
        {day.work ? (
          <span className="cal-pbstamp">
            <LogoMark />
            <span>{day.mark}</span>
          </span>
        ) : (
          <span className="cal-sbadge cal-pbsbadge">SAMPLE</span>
        )}
      </div>
      <h3 id="cal-pbt" className="cal-pbt">
        {day.title}
      </h3>
      <dl className="cal-pbdl">
        {rowsOf(day).map(([k, val]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>
      {!day.work && <p className="cal-pbnote">We write this one for you.</p>}
    </div>
  );
}
