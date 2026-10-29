"use client";

// PACKAGE A. The reel viewer (D 749–882, logic D 1613–1660; phone P2; PORT-PLAN 1.6).
// One state machine, two layers: the three-column grid (single column at 1200px and below) and, at 640px and below,
// the full-bleed phone layer. Index 0–6 are the posts, 7 is the end card.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useModalDialog } from "@/lib/client/dialog";
import { useOverlay, useOverlayHost } from "@/lib/client/overlay";
import { useManagedVideo, type ManagedVideo } from "@/lib/client/playback";
import { usePhone, useSaveData } from "@/lib/client/device";
import { useMotion } from "@/lib/client/motion";
import { POSTS, type Post } from "@/content/posts";
import PlanButton from "@/components/ui/PlanButton";
import { IconClose, IconPause, IconPlay } from "@/components/ui/icons";
import StopCard, { useStopView } from "./StopCard";
import { setFill } from "./fill";

type Overlay = "none" | "first3" | "buttons";

const END = 7;

// Space on a focused control keeps its own meaning; only the viewer itself takes Space as pause (D 1193)
function isControl(t: EventTarget | null) {
  const n = t instanceof HTMLElement ? t.tagName : "";
  return n === "BUTTON" || n === "A" || n === "INPUT" || n === "TEXTAREA" || n === "SELECT" || n === "SUMMARY";
}

// ---------- private icons (drawn from the artboards) ----------

function IconButtonsFrame({ phone }: { phone?: boolean }) {
  return phone ? (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="14" rx="2" strokeDasharray="3 2.6" />
    </svg>
  ) : (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" strokeDasharray="3 2.5" />
    </svg>
  );
}

function IconPlanDoc() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 10V3h7l4 4v14H9v-3" />
      <path d="M16 3v4h4" />
      <path d="M2.5 14H14" />
      <path d="M10.5 10.5 14 14l-3.5 3.5" />
    </svg>
  );
}

function IconUp() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 7.5l5 5" />
    </svg>
  );
}

// ---------- shared model ----------

type Model = {
  idx: number;
  isEnd: boolean;
  post: Post;
  prev: Post | null;
  next: Post | null;
  overlay: Overlay;
  cur: ManagedVideo;
  autoplay: boolean;
  chip: boolean;
  chipTap: boolean;
  shown: boolean;
  nextPreload: "none" | "auto";
  fillRef: (el: HTMLElement | null) => void;
  go: (i: number) => void;
  close: () => void;
  toggleFirst3: () => void;
  toggleButtons: () => void;
  openForm: (el?: HTMLElement | null) => void;
};

function NextVideo({ m }: { m: Model }) {
  // The next post loads quietly 2s after this one opens (never under Save-Data). It never plays and is not managed.
  if (!m.next) return null;
  return (
    <div className="v-next" aria-hidden="true">
      <video
        key={`vnext-${m.next.id}`}
        src={m.next.reel.video}
        poster={m.next.reel.poster}
        muted
        loop
        playsInline
        preload={m.nextPreload}
        tabIndex={-1}
      />
    </div>
  );
}

function CurVideo({ m }: { m: Model }) {
  return (
    <video
      key={m.post.id}
      ref={m.cur.ref}
      className="v-video"
      src={m.post.reel.video}
      poster={m.post.reel.poster}
      muted
      loop
      playsInline
      preload={m.autoplay ? "auto" : "none"}
      aria-label={m.post.reel.label}
    />
  );
}

function PlayChip({ m, cls }: { m: Model; cls: string }) {
  return (
    <button type="button" className={cls} onClick={m.cur.play}>
      <IconPlay size={cls.includes("v-ph") ? 16 : 18} />
      {m.chipTap ? "Tap to play" : "Play the post"}
    </button>
  );
}

// ---------- desktop and tablet ----------

function ZonesDesktop() {
  const hatch = (id: string) => (
    <svg aria-hidden="true" width="100%" height="100%" className="v-hatch">
      <defs>
        <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#F3EEE4" strokeOpacity="0.16" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
  return (
    <div className="v-zones v-zin">
      <div className="v-zone v-zone-top">
        {hatch("v-hatch-top")}
        <span className="v-zlab v-zlab-top">NAME &amp; PROGRESS</span>
      </div>
      <div className="v-zone v-zone-rail">
        {hatch("v-hatch-rail")}
        <span className="v-zlab v-zlab-rail">ACTIONS</span>
      </div>
      <div className="v-zone v-zone-cap">
        {hatch("v-hatch-cap")}
        <span className="v-zlab v-zlab-cap">CAPTION &amp; BUTTONS</span>
        <p className="v-zline">
          <span>Your post has to work under the app’s buttons. Ours are framed for them.</span>
        </p>
      </div>
    </div>
  );
}

function DesktopLayer({ m }: { m: Model }) {
  const { post, isEnd, idx, overlay, cur } = m;
  const stop = useStopView();
  const first3 = overlay === "first3";
  const buttons = overlay === "buttons";
  return (
    <>
      <button type="button" className="icob v-close" aria-label="Close the posts" onClick={m.close}>
        <IconClose size={20} />
      </button>
      <div className="vgrid">
        <div className="vside v-left" aria-live="polite">
          {!isEnd && (
            <>
              {first3 && (
                <p className="v-note v-zin">
                  THE FIRST 3 SECONDS
                  <br />
                  THIS DECIDES WHETHER SOMEONE STOPS
                </p>
              )}
              <p className="v-count">
                POST {post.n} / 07 · REEL · {post.len}
              </p>
              <h2 className="v-title">{post.title}</h2>
              <p className="v-phase">{post.phase}</p>
              <p className="v-jobk">ITS JOB</p>
              <p className="v-job">{post.job}</p>
              {post.proof && <p className="v-proof">{post.proof}</p>}
              <div className="v-meta">
                <span>OPENS ON · {post.opensOn}</span>
                <span>GOES OUT · {post.goesOut}</span>
                <span>{post.madeBy}</span>
              </div>
            </>
          )}
        </div>

        <div className="vpost">
          {m.prev && (
            <div className="v-peek v-peek-prev" aria-hidden="true">
              <img src={m.prev.reel.poster} alt="" width={576} height={1024} />
            </div>
          )}
          {m.next && (
            <div className="v-peek v-peek-next" aria-hidden="true">
              <img src={m.next.reel.poster} alt="" width={576} height={1024} />
            </div>
          )}

          {!isEnd && (
            <div className="v-frame">
              <CurVideo m={m} />
              <button type="button" className="v-tap v-tap-prev" aria-label="Previous post" onClick={() => m.go(idx - 1)} />
              <button type="button" className="v-tap v-tap-next" aria-label="Next post" onClick={() => m.go(idx + 1)} />
              {!buttons && (
                <div className="v-segs" aria-hidden="true">
                  {POSTS.map((p, i) => (
                    <span key={p.id} className="v-seg">
                      <span className="v-seg-done" style={{ transform: `scaleX(${i < idx ? 1 : 0})` }} />
                      {i === idx && <span className={`v-seg-cur${first3 ? " is-loop" : ""}`} ref={m.fillRef} />}
                    </span>
                  ))}
                </div>
              )}
              {buttons && <ZonesDesktop />}
              {m.chip && <PlayChip m={m} cls="v-chip" />}
            </div>
          )}

          {isEnd && (
            <div className="v-end">
              <p className="v-end-k">YOU’VE SEEN ALL SEVEN</p>
              <h2 className="v-end-h">That’s how a launch looks.</h2>
              <StopCard variant="end" />
              <PlanButton className="v-end-pill" />
              <button type="button" className="ulink v-again" onClick={() => m.go(0)}>
                Watch again
              </button>
            </div>
          )}

          <NextVideo m={m} />
        </div>

        <div className="vside v-right">
          {!isEnd && (
            <>
              <div className="v-rail">
                {!buttons && (
                  <>
                    <button type="button" className="rowb v-row" onClick={cur.toggle}>
                      <span className="v-ico">{cur.playing ? <IconPause size={20} /> : <IconPlay size={20} />}</span>
                      <span>{cur.playing ? "Pause" : "Play"}</span>
                    </button>
                    <button type="button" className="rowb v-row" aria-pressed={first3} onClick={m.toggleFirst3}>
                      <span className={`v-ico v-ico-3s${first3 ? " is-on" : ""}`} aria-hidden="true">
                        3S
                      </span>
                      <span>First 3 seconds</span>
                    </button>
                  </>
                )}
                {post.buttonsCheck && (
                  <button type="button" className="rowb v-row" aria-pressed={buttons} onClick={m.toggleButtons}>
                    <span className={`v-ico v-ico-ring${buttons ? " is-on" : ""}`}>
                      <IconButtonsFrame />
                    </span>
                    <span>Under the buttons</span>
                  </button>
                )}
              </div>
              {stop.has && <StopCard variant="rail" />}
              <PlanButton className="v-pill" />
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ---------- phone (P2) ----------

function ZonesPhone() {
  const hatch = (id: string) => (
    <svg aria-hidden="true" width="100%" height="100%" className="v-hatch">
      <defs>
        <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#F3EEE4" strokeOpacity="0.16" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
  return (
    <div className="v-ph-zones v-zin">
      <div className="v-zone v-ph-zone-top">
        {hatch("v-ph-hatch-top")}
        <span className="v-zlab v-ph-zlab-top">Name &amp; progress</span>
      </div>
      <div className="v-zone v-ph-zone-rail">
        {hatch("v-ph-hatch-rail")}
        <span className="v-zlab v-ph-zlab-rail">Actions</span>
      </div>
      <div className="v-zone v-ph-zone-cap">
        {hatch("v-ph-hatch-cap")}
        <div className="v-ph-zcap">
          <span className="v-zlab">Caption &amp; buttons</span>
          <p className="v-ph-zline">
            <span>Your post has to work under the app’s buttons. Ours are framed for them.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function PhoneLayer({ m }: { m: Model }) {
  const { post, isEnd, idx, overlay, cur } = m;
  const first3 = overlay === "first3";
  const buttons = overlay === "buttons";

  // Gestures (P2 426–450): tap left 130px for previous, the rest for next; swipe up for next, down for previous (or
  // close on post 1); hold 250ms to pause, release to resume. Taps are ignored for 400ms after a swipe or a hold.
  const g = useRef<{ y: number; held: boolean } | null>(null);
  const holdT = useRef(0);
  const heldPause = useRef(false);
  const suppressUntil = useRef(0);
  const curRef = useRef(cur);
  curRef.current = cur;

  useEffect(() => () => window.clearTimeout(holdT.current), []);

  const resumeHeld = () => {
    if (heldPause.current) {
      heldPause.current = false;
      curRef.current.play();
    }
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    g.current = { y: e.clientY, held: false };
    window.clearTimeout(holdT.current);
    holdT.current = window.setTimeout(() => {
      if (!g.current) return;
      g.current.held = true;
      const el = curRef.current.element;
      if (el && !el.paused) {
        el.pause();
        heldPause.current = true;
      }
    }, 250);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    window.clearTimeout(holdT.current);
    const s = g.current;
    g.current = null;
    if (!s) return;
    const dy = e.clientY - s.y;
    if (s.held) {
      suppressUntil.current = Date.now() + 400;
      resumeHeld();
      return;
    }
    if (dy < -60) {
      suppressUntil.current = Date.now() + 400;
      m.go(idx + 1);
    } else if (dy > 80) {
      suppressUntil.current = Date.now() + 400;
      if (idx === 0) m.close();
      else m.go(idx - 1);
    }
  };
  const onCancel = () => {
    window.clearTimeout(holdT.current);
    g.current = null;
    resumeHeld();
  };
  const tap = (i: number) => () => {
    if (Date.now() < suppressUntil.current) return;
    m.go(i);
  };

  const nextLabel = m.next ? `SWIPE UP · NEXT: ${m.next.n} ${m.next.title.toUpperCase()}` : "SWIPE UP · THAT’S ALL SEVEN";
  const nextAria = m.next ? `Next post, ${m.next.n} of 07: ${m.next.title}` : "You’ve seen all seven. Continue";

  return (
    <div className={`v-ph${buttons ? " is-buttons" : ""}`}>
      {!isEnd && (
        <>
          <div className="v-ph-media">
            <img className="v-ph-poster" src={post.reel.poster} alt={m.shown ? "" : post.reel.label} width={576} height={1024} />
            <div className={`v-ph-vwrap${m.shown ? " is-live" : ""}`}>
              <CurVideo m={m} />
            </div>
            {m.prev && <img className="v-ph-warm" src={m.prev.reel.poster} alt="" aria-hidden="true" width={576} height={1024} />}
            <NextVideo m={m} />
          </div>
          <div className="v-ph-gest" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onCancel}>
            <button type="button" className="v-tap v-ph-tap-prev" aria-label="Previous post" onClick={tap(idx - 1)} />
            <button type="button" className="v-tap v-ph-tap-next" aria-label="Next post" onClick={tap(idx + 1)} />
          </div>
        </>
      )}

      {isEnd && (
        <div className="v-ph-end">
          <p className="v-ph-end-k">You’ve seen all seven</p>
          <h2 className="v-ph-end-h">That’s how a launch looks.</h2>
          <StopCard variant="phone" />
          <PlanButton className="v-ph-end-pill" />
          <button type="button" className="ulink v-ph-again" onClick={() => m.go(0)}>
            Watch again
          </button>
        </div>
      )}

      <div className="v-ph-ui">
        {!buttons && (
          <div className="v-ph-segs" aria-hidden="true">
            {POSTS.map((p, i) => (
              <span key={p.id} className="v-ph-seg">
                <span className="v-ph-seg-done" style={{ transform: `scaleX(${isEnd || i < idx ? 1 : 0})` }} />
                {!isEnd && i === idx && <span className="v-ph-seg-cur" ref={m.fillRef} />}
              </span>
            ))}
          </div>
        )}

        {!isEnd && !buttons && (
          <>
            <p className="v-ph-count">
              <span>
                POST {post.n} / 07 · REEL · {post.len}
              </span>
            </p>
            <p className="v-ph-chip">
              <span>{post.chip}</span>
            </p>
          </>
        )}

        {!buttons && (
          <button type="button" className="v-ph-close" aria-label="Close the posts" onClick={m.close}>
            <IconClose size={20} />
          </button>
        )}

        {!isEnd && !buttons && (
          <div className="v-ph-cap">
            {first3 && (
              <p className="v-ph-note">
                <span>
                  The first 3 seconds
                  <br />
                  This decides whether someone stops
                </span>
              </p>
            )}
            <div className="v-ph-live" aria-live="polite">
              <h2 className="v-ph-title">
                <span>{post.title}.</span>
              </h2>
              <div className="v-ph-jobwrap">
                <p className="v-ph-jobk">
                  <span>Its job</span>
                </p>
                <p className="v-ph-job">
                  <span>{post.job}</span>
                </p>
                {post.proof && (
                  <p className="v-ph-proof">
                    <span>{post.proof}</span>
                  </p>
                )}
              </div>
              <div className="v-ph-meta">
                <span>OPENS ON · {post.opensOn}</span>
                <span>GOES OUT · {post.goesOut}</span>
                <span>{post.madeBy}</span>
              </div>
            </div>
            <button type="button" className="v-ph-nextb" aria-label={nextAria} onClick={tap(idx + 1)}>
              {/* The swipe hint is for the eye; the name says which post comes next (WCAG 2.5.3 then holds) */}
              <span aria-hidden="true">
                <IconUp />
                <span>{nextLabel}</span>
              </span>
            </button>
          </div>
        )}

        {!isEnd && (
          <div className="v-ph-rail">
            <button
              type="button"
              className="v-ph-rb"
              aria-label={cur.playing ? "Pause the post" : "Play the post"}
              onClick={cur.toggle}
            >
              <span className="v-ph-circ">{cur.playing ? <IconPause size={20} /> : <IconPlay size={20} />}</span>
              <span className="v-ph-rlab">{cur.playing ? "PAUSE" : "PLAY"}</span>
            </button>
            <button type="button" className="v-ph-rb" aria-label="First 3 seconds" aria-pressed={first3} onClick={m.toggleFirst3}>
              <span className={`v-ph-circ${first3 ? " is-on" : ""}`}>
                <span className="v-ph-3s" aria-hidden="true">
                  3s
                </span>
              </span>
              <span className="v-ph-rlab">HOOK</span>
            </button>
            {post.buttonsCheck && (
              <button
                type="button"
                className="v-ph-rb v-ph-rb-keep"
                aria-label="Under the buttons"
                aria-pressed={buttons}
                onClick={m.toggleButtons}
              >
                <span className={`v-ph-circ${buttons ? " is-on" : ""}`}>
                  <IconButtonsFrame phone />
                </span>
                <span className="v-ph-rlab">BUTTONS</span>
              </button>
            )}
            <button
              type="button"
              className="v-ph-rb v-ph-plan"
              aria-label="Get your free launch plan"
              onClick={(e) => m.openForm(e.currentTarget)}
            >
              <span className="v-ph-plancirc">
                <IconPlanDoc />
              </span>
              <span className="v-ph-rlab is-cream">PLAN</span>
            </button>
          </div>
        )}
      </div>

      {!isEnd && buttons && <ZonesPhone />}
      {!isEnd && !buttons && m.chip && <PlayChip m={m} cls="v-ph-playchip" />}
    </div>
  );
}

// ---------- the dialog ----------

export default function ReelViewer() {
  useOverlayHost("reels");
  const { state, close, openForm } = useOverlay();
  const open = state.kind === "reels";
  const start = state.kind === "reels" ? state.start : 0;
  const phone = usePhone();
  const [motion] = useMotion();
  const saveData = useSaveData();
  const ref = useModalDialog(open, close, { focusSelf: true });

  const [idx, setIdx] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [nextPreload, setNextPreload] = useState<"none" | "auto">("none");
  const [wasOpen, setWasOpen] = useState(false);
  // On open, start at the requested post (set during render, so the first frame already shows it)
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setIdx(Math.max(0, Math.min(END, start)));
      setOverlay("none");
      setNextPreload("none");
    }
  }

  const isEnd = idx > 6;
  const post = POSTS[Math.min(idx, 6)];
  const prev = idx > 0 ? POSTS[Math.min(idx - 1, 6)] : null;
  const next = !isEnd && idx < 6 ? POSTS[idx + 1] : null;

  const fillEl = useRef<HTMLElement | null>(null);
  const fillRef = useCallback((el: HTMLElement | null) => {
    fillEl.current = el;
  }, []);
  const overlayNow = useRef(overlay);
  overlayNow.current = overlay;
  const motionNow = useRef(motion);
  motionNow.current = motion;
  const vidEl = useRef<HTMLVideoElement | null>(null);

  // Segments follow time. With First 3 seconds on, the post loops its first 3s (and with motion off, stops there)
  // (D 1510–1525).
  const onProgress = useCallback((p: number, t: number) => {
    if (overlayNow.current === "first3") {
      let time = t;
      const el = vidEl.current;
      if (time >= 3 && el) {
        try {
          el.currentTime = 0;
        } catch {}
        if (!motionNow.current) el.pause();
        time = 0;
      }
      setFill(fillEl.current, time / 3);
      return;
    }
    setFill(fillEl.current, p);
  }, []);

  const cur = useManagedVideo("vcur", {
    active: open && !isEnd,
    postId: open && !isEnd ? post.id : null,
    onProgress,
  });
  vidEl.current = cur.element;
  const { clearUserPause } = cur;

  // The phone poster keeps its alt and the video stays hidden until this post's video is actually playing
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = cur.element;
    setShown(false);
    if (!el) return;
    const on = () => setShown(true);
    el.addEventListener("playing", on);
    return () => el.removeEventListener("playing", on);
  }, [cur.element]);

  // The next post preloads 2s after this one opens, never under Save-Data (D 1655–1660)
  useEffect(() => {
    setNextPreload("none");
    if (!open || saveData) return;
    const t = window.setTimeout(() => setNextPreload("auto"), 2000);
    return () => window.clearTimeout(t);
  }, [open, idx, saveData]);

  // A control that disappears with the post it belonged to (Watch again, the rail rows) must not drop focus out of the
  // dialog: give it back to the dialog itself, so the arrows and Space keep working.
  useEffect(() => {
    const d = ref.current;
    if (!open || !d || !d.open) return;
    if (!d.contains(document.activeElement)) d.focus({ preventScroll: true });
  }, [open, idx, overlay, phone, ref]);

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i > END) return;
      setIdx(i);
      setOverlay("none");
      setNextPreload("none");
      clearUserPause();
    },
    [clearUserPause],
  );

  const toggleFirst3 = () => {
    const on = overlay !== "first3";
    setOverlay(on ? "first3" : "none");
    const el = cur.element;
    if (el) {
      try {
        el.currentTime = 0;
      } catch {}
      setFill(fillEl.current, 0);
      cur.play();
    }
  };
  const toggleButtons = () => setOverlay((o) => (o === "buttons" ? "none" : "buttons"));

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowRight") {
      e.preventDefault();
      go(idx + 1);
    } else if (k === "ArrowUp" || k === "ArrowLeft") {
      e.preventDefault();
      go(idx - 1);
    } else if ((k === " " || k === "Spacebar") && !isControl(e.target)) {
      e.preventDefault();
      if (!isEnd) cur.toggle();
    }
  };

  const m: Model = {
    idx,
    isEnd,
    post,
    prev,
    next,
    overlay,
    cur,
    autoplay: cur.autoplay,
    chip: !isEnd && !cur.playing && (!cur.autoplay || cur.refused),
    chipTap: cur.refused || saveData,
    shown,
    nextPreload,
    fillRef,
    go,
    close,
    toggleFirst3,
    toggleButtons,
    openForm,
  };

  return (
    <dialog ref={ref} aria-label="Our posts" className={`viewer${phone ? " viewer-ph" : ""}`} onKeyDown={onKeyDown}>
      {open && (phone ? <PhoneLayer m={m} /> : <DesktopLayer m={m} />)}
    </dialog>
  );
}
