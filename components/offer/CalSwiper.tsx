"use client";

// d4 at 1200px and below: the 30 days as a sideways swiper (D 512-598; B-phone-5 53-138). Ticks, cards, the counter
// and the legend. The open day's brief is rendered by the caller below this.
import { useEffect, type ReactNode, type Ref, type UIEvent } from "react";
import { CAL_DAYS, type CalDay } from "@/content/calendar";
import { useSaveData } from "@/lib/client/device";
import { useManagedVideo, type ManagedVideo } from "@/lib/client/playback";
import { cardAria, cardCode, type DayView } from "./calView";
import { Glyph, LogoPlate, PauseButton, PlayChip, videoUi } from "./CalParts";

const pad = (n: number) => String(n).padStart(2, "0");
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Props = {
  views: readonly DayView[];
  open: string | null;
  cur: number;
  // The swiper is showing (1200px and below) and d4 is the current section
  canPlay: boolean;
  // An overlay (menu, viewer, form) is open: the reel pauses
  overlayOpen: boolean;
  // The swiper is showing at all (after hydration); images near the current card load first
  shown: boolean;
  // Phone layout (B-phone-5): the play chip is a pill
  phone: boolean;
  swRef: Ref<HTMLDivElement>;
  onScroll: (e: UIEvent<HTMLDivElement>) => void;
  onOpen: (id: string) => void;
  children?: ReactNode;
};

function Card({
  d,
  x,
  isOpen,
  live,
  eager,
  v,
  onOpen,
}: {
  d: CalDay;
  x: DayView;
  isOpen: boolean;
  live: boolean;
  eager: boolean;
  v: ManagedVideo | null;
  onOpen: (id: string) => void;
}) {
  const m = d.media;
  const wide = !!m && m.ratio > 0.6;
  const date = x.dt ? <span className={cx("cal-cdate", x.past && "is-past")}>{x.date}</span> : null;
  // The picture and labels are hidden from assistive tech; a transparent button over the whole card carries the
  // artboard's label (aria-label strings verbatim), so the visible text never has to match it (WCAG 2.5.3)
  return (
    <div
      className={cx(
        "cal-pc",
        m ? "cal-pc--work" : "cal-pc--sample",
        x.dim && "is-dim",
        d.id === "d1" && "is-d1",
        wide && "is-wide",
        isOpen && "is-open",
      )}
    >
      <span className="cal-vis" aria-hidden="true">
        {m ? (
          <>
            <span className="cal-pmedia cal-dim">
              <img
                className="cal-pimg"
                src={m.kind === "video" ? m.poster : m.src}
                alt=""
                width={m.width}
                height={m.height}
                loading={eager ? "eager" : "lazy"}
                decoding="async"
              />
              {live && v && m.kind === "video" && (
                <video
                  key={d.id}
                  ref={v.ref}
                  className="cal-pvid"
                  src={m.video}
                  poster={m.poster}
                  muted
                  playsInline
                  loop
                  preload={v.autoplay ? "auto" : "none"}
                  aria-label={m.alt}
                />
              )}
            </span>
            <span className="cal-scrim" aria-hidden="true" />
            <span className="cal-pday">
              <span className="cal-pcode">{cardCode(d, x)}</span>
              {date}
            </span>
            <LogoPlate className="cal-pstamp" />
            <span className="cal-ptag">
              <Glyph day={d} size={14} />
              <span>{d.tag}</span>
            </span>
          </>
        ) : (
          <>
            <span className="cal-pmid">
              <span className="cal-pglyph cal-dim" aria-hidden="true">
                <Glyph day={d} size={40} />
              </span>
              <span className="cal-pfmt">{d.fmtWord}.</span>
            </span>
            <span className="cal-scrim" aria-hidden="true" />
            <span className="cal-pday cal-pday--bare">
              <span className="cal-pcode">{cardCode(d, x)}</span>
              {date}
            </span>
            <span className="cal-sbadge cal-psbadge">SAMPLE</span>
            <span className="cal-pjob">{d.tag}</span>
          </>
        )}
      </span>
      <button
        type="button"
        id={`cal-p-${d.id}`}
        className="cal-hit"
        aria-label={cardAria(d, x)}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "cal-pbrief" : undefined}
        onClick={() => onOpen(d.id)}
      />
      <span className="cal-ring" aria-hidden="true" />
    </div>
  );
}

export default function CalSwiper({ views, open, cur, canPlay, overlayOpen, shown, phone, swRef, onScroll, onOpen, children }: Props) {
  const saveData = useSaveData();
  const curDay = CAL_DAYS[cur];
  // The current card's reel plays only while d4 is the section in view (D 1844-1848), key "calph"
  const live = canPlay && curDay.media?.kind === "video";
  const v = useManagedVideo("calph", { active: live && !overlayOpen });
  const { clearUserPause } = v;
  // A new card may start by itself again, even if the last one was paused
  useEffect(() => {
    clearUserPause();
  }, [cur, clearUserPause]);
  const ui = videoUi(v, saveData);

  return (
    <div className="cal-ph">
      <div className="cal-ticks" aria-hidden="true">
        {CAL_DAYS.map((d, i) => {
          const x = views[i];
          return (
            <span
              key={d.id}
              className={cx("cal-tick", i === cur && "is-cur", d.id === "d1" && "is-one", x.past && "is-past", !x.match && "is-out")}
            />
          );
        })}
      </div>
      <div ref={swRef} className="cal-sw" role="region" aria-label="Your 30 days. Swipe through the posts." onScroll={onScroll}>
        {CAL_DAYS.map((d, i) => {
          const isLive = live && i === cur;
          return (
            <div key={d.id} className="cal-pcard" data-card="">
              <Card
                d={d}
                x={views[i]}
                isOpen={open === d.id}
                live={isLive}
                eager={shown && Math.abs(i - cur) <= 2}
                v={isLive ? v : null}
                onOpen={onOpen}
              />
              {isLive &&
                (ui.chip ? (
                  <PlayChip v={v} tap={ui.tap} className={phone ? "pill cal-pchip" : "cal-chip"} iconSize={phone ? 16 : 18} />
                ) : (
                  <PauseButton v={v} className="cal-vbtn cal-ppause" />
                ))}
            </div>
          );
        })}
        <span className="cal-swend" aria-hidden="true" />
      </div>
      <div className="cal-pfoot">
        <span className="cal-count" aria-hidden="true">
          {pad(cur + 1)} / 30
        </span>
        <span className="cal-pleg">
          <LogoPlate className="cal-pleglogo" />
          <span className="cal-legtx">OUR WORK</span>
        </span>
      </div>
      {children}
    </div>
  );
}
