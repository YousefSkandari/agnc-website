"use client";

// d4 at 1200px and below: the 30 days as week rows (Cal-4-week-rows). Monday-first rows of small post tiles, a lane
// label over each row naming the week, the key in the widest run of empty cells, and the open day's brief straight
// under its row (the caller renders it; it lands in row `briefRow`).
import type { ReactNode } from "react";
import type { CalDay } from "@/content/calendar";
import { reels } from "@/lib/media";
import { Glyph } from "./CalParts";
import { CAL_DOOR, tileAria, tileLabel, type DayView, type RowWeek } from "./calView";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Props = {
  views: readonly DayView[];
  weeks: readonly RowWeek[];
  open: string | null;
  // The row holding the open day, or -1
  briefRow: number;
  brief: ReactNode;
  // `keyboard`: opened with Enter or Space, so focus moves into the brief
  onOpen: (id: string, keyboard: boolean) => void;
};

// One day: the post's picture (our work) or its format glyph (a sample), the day's short label and its outline.
// Everything inside is decoration; the button's label says the day, date, title, format, job and whose post it is.
function Tile({ d, x, open, eager, onOpen }: { d: CalDay; x: DayView; open: boolean; eager: boolean; onOpen: Props["onOpen"] }) {
  const m = d.media;
  return (
    <button
      type="button"
      id={`cal-t-${d.id}`}
      className={cx(
        "cal-tile",
        m ? "cal-tile--work" : "cal-tile--sample",
        d.idx === CAL_DOOR && "is-d1",
        x.dim && "is-dim",
        x.past && "is-past",
        open && "is-open",
      )}
      aria-label={tileAria(d, x)}
      aria-expanded={open}
      aria-controls={open ? "cal-rbrief" : undefined}
      onClick={(e) => onOpen(d.id, e.detail === 0)}
    >
      {m ? (
        <>
          <img
            className="cal-timg"
            src={m.kind === "video" ? m.poster : m.src}
            alt=""
            width={m.width}
            height={m.height}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
          />
          <span className="cal-tfmt" aria-hidden="true">
            <Glyph day={d} size={11} stroke={2} />
          </span>
        </>
      ) : (
        <span className="cal-tglyph" aria-hidden="true">
          <Glyph day={d} size={18} stroke={1.6} />
        </span>
      )}
      <span className="cal-tdim" aria-hidden="true" />
      <span className="cal-tlab" aria-hidden="true">
        {tileLabel(d, x)}
      </span>
      <span className="cal-tedge" aria-hidden="true" />
    </button>
  );
}

export default function CalRows({ views, weeks, open, briefRow, brief, onOpen }: Props) {
  return (
    <div className="cal-rw">
      <div className="cal-rwh" aria-hidden="true">
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
        <span>SUN</span>
      </div>
      <div className="cal-rws" role="group" aria-label="The 30 days, week by week">
        {weeks.map((w, r) => (
          <div key={w.key} className="cal-rwk" role="group" aria-label={w.aria}>
            <div className={cx("cal-rlane", w.opening && "is-opening")} aria-hidden="true">
              {w.opening && <span className="cal-rdot" />}
              <span className="cal-rlab">{w.label}</span>
              <span className="cal-rline" />
              <span className="cal-rrange">{w.range}</span>
            </div>
            <ol className="cal-rrow">
              {w.tiles.map((t) => (
                <li key={t.day.id} style={{ gridColumn: t.col + 1 }}>
                  <Tile d={t.day} x={views[t.day.idx]} open={open === t.day.id} eager={r < 2} onOpen={onOpen} />
                </li>
              ))}
              {w.legend && (
                <li
                  className={cx("cal-rkey", !w.legend.end && "is-start")}
                  aria-hidden="true"
                  style={{ gridColumn: `${w.legend.col + 1} / span ${w.legend.span}` }}
                >
                  <span className="cal-rkeyi">
                    <img className="cal-rkeyw" src={reels.room.poster} alt="" width={9} height={12} />
                    OUR WORK
                  </span>
                  <span className="cal-rkeyi">
                    <span className="cal-rkeys" />
                    SAMPLE
                  </span>
                  <span className="cal-rkeyi">
                    <span className="cal-rkeyd" />
                    OPENING DAY
                  </span>
                </li>
              )}
            </ol>
            {r === briefRow && brief}
          </div>
        ))}
      </div>
    </div>
  );
}
