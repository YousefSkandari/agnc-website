"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMotion } from "./motion";
import { useSaveData } from "./device";

// One video plays at a time, always muted, started from script after hydration (never an autoPlay attribute in the
// server HTML). With motion off or Save-Data on, nothing starts by itself: only a press of play does.
//
// It also times "your longest stop": how long one of our posts stayed at least 60% on screen, playing, with the tab
// visible. Rounded down to a tenth of a second. Held in memory only: nothing is sent or stored.
export type Stop = { postId: string; seconds: number };

// What a play attempt came to. Only "refused" (the browser said no: NotAllowedError, e.g. Low Power Mode) should show
// "Tap to play". "aborted" means a pause() or a new src interrupted the attempt (AbortError), which is not a refusal.
// "missing" means no video is registered under that key.
export type PlayResult = "playing" | "refused" | "aborted" | "missing";

type Entry = {
  el: HTMLVideoElement;
  postId: string | null;
  visible: boolean;
  playing: boolean;
  start: number | null;
  // When another video's play() paused this one (0 when it was not). A video pushed aside like this starts again
  // once the one that took over stops, if it still wants to play.
  preemptedAt: number;
  preempting: boolean;
  wants: () => boolean;
  resume: () => void;
  held: () => boolean;
};

// What a video tells the provider so it can be started again after another one has taken over and let go:
// whether it still wants to play, how to start it, and whether the visitor paused it (a pause they chose gives
// nothing else the turn)
export type Wants = { wants: () => boolean; resume: () => void; held: () => boolean };

type Ctx = {
  register: (key: string, el: HTMLVideoElement, postId: string | null, wants?: Wants) => void;
  unregister: (key: string, el: HTMLVideoElement) => void;
  setPostId: (key: string, postId: string | null) => void;
  play: (key: string) => Promise<PlayResult>;
  stop: Stop | null;
};

const PlaybackContext = createContext<Ctx | null>(null);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, Entry>());
  const longest = useRef<number | null>(null);
  const [stop, setStop] = useState<Stop | null>(null);
  const io = useRef<IntersectionObserver | null>(null);
  const [motion] = useMotion();

  const endStop = useCallback((e: Entry) => {
    if (e.start === null) return;
    const dur = (performance.now() - e.start) / 1000;
    e.start = null;
    if (!e.postId) return;
    if (longest.current === null || dur > longest.current) {
      longest.current = dur;
      setStop({ postId: e.postId, seconds: Math.floor(dur * 10) / 10 });
    }
  }, []);

  const evalStop = useCallback(
    (e: Entry) => {
      const run = e.visible && e.playing && document.visibilityState !== "hidden";
      if (run && e.start === null) e.start = performance.now();
      else if (!run && e.start !== null) endStop(e);
    },
    [endStop],
  );

  const observer = useCallback(() => {
    if (io.current || typeof IntersectionObserver === "undefined") return io.current;
    io.current = new IntersectionObserver(
      (list) => {
        for (const en of list) {
          for (const e of Array.from(entries.current.values())) {
            if (e.el === en.target) {
              e.visible = en.isIntersecting && en.intersectionRatio >= 0.59;
              evalStop(e);
            }
          }
        }
      },
      { threshold: [0, 0.6] },
    );
    return io.current;
  }, [evalStop]);

  // A video stopped (scrolled away, unhovered, removed, ended) and nothing else is playing: give the screen back to
  // the video pushed aside most recently, if that one still wants to play. Pauses made by play() itself (one
  // video at a time) never release, so two videos can't hand the turn back and forth.
  const release = useCallback(() => {
    requestAnimationFrame(() => {
      // Something else has already started (the next card in a strip, the next post): leave it be
      if (Array.from(entries.current.values()).some((e) => !e.el.paused)) return;
      let best: Entry | null = null;
      entries.current.forEach((e) => {
        if (e.preemptedAt && (!best || e.preemptedAt > best.preemptedAt)) best = e;
      });
      const b = best as Entry | null;
      if (!b) return;
      b.preemptedAt = 0;
      if (b.el.paused && b.wants()) b.resume();
    });
  }, []);

  const register = useCallback(
    (key: string, el: HTMLVideoElement, postId: string | null, wants?: Wants) => {
      const prev = entries.current.get(key);
      if (prev && prev.el !== el) {
        endStop(prev);
        io.current?.unobserve(prev.el);
      }
      const e: Entry = {
        el,
        postId,
        visible: false,
        playing: !el.paused,
        start: null,
        preemptedAt: 0,
        preempting: false,
        wants: wants?.wants ?? (() => false),
        resume: wants?.resume ?? (() => {}),
        held: wants?.held ?? (() => false),
      };
      entries.current.set(key, e);
      el.muted = true;
      const obs = observer();
      if (obs) obs.observe(el);
      else e.visible = true;
    },
    [endStop, observer],
  );

  const unregister = useCallback(
    (key: string, el: HTMLVideoElement) => {
      const e = entries.current.get(key);
      if (!e || e.el !== el) return;
      endStop(e);
      io.current?.unobserve(el);
      entries.current.delete(key);
      // A playing video taken off the page (a hovered card's video, the viewer closing) lets go of the screen
      if ((e.playing || !el.paused) && !e.held()) release();
    },
    [endStop, release],
  );

  const setPostId = useCallback(
    (key: string, postId: string | null) => {
      const e = entries.current.get(key);
      if (!e || e.postId === postId) return;
      endStop(e);
      e.postId = postId;
      evalStop(e);
    },
    [endStop, evalStop],
  );

  const pauseAll = useCallback((except?: string) => {
    entries.current.forEach((e, k) => {
      if (k !== except && !e.el.paused) e.el.pause();
    });
  }, []);

  const play = useCallback(
    async (key: string) => {
      const e = entries.current.get(key);
      if (!e) return "missing";
      const now = performance.now();
      entries.current.forEach((o, k) => {
        if (k === key || o.el.paused) return;
        o.preempting = true;
        o.preemptedAt = now;
        o.el.pause();
      });
      e.preemptedAt = 0;
      e.el.muted = true;
      try {
        await e.el.play();
        return "playing";
      } catch (err) {
        return err instanceof DOMException && err.name === "NotAllowedError" ? "refused" : "aborted";
      }
    },
    [],
  );

  // Track playing state for the stop timer
  useEffect(() => {
    const onEvent = (ev: Event) => {
      const t = ev.target;
      if (!(t instanceof HTMLVideoElement)) return;
      entries.current.forEach((e) => {
        if (e.el !== t) return;
        e.playing = ev.type === "playing";
        evalStop(e);
        if (ev.type === "pause" || ev.type === "ended") {
          if (e.preempting) e.preempting = false;
          else if (!e.held()) release();
        }
      });
    };
    const types = ["playing", "pause", "waiting", "ended"];
    types.forEach((t) => document.addEventListener(t, onEvent, true));
    const onVis = () => entries.current.forEach(evalStop);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      types.forEach((t) => document.removeEventListener(t, onEvent, true));
      document.removeEventListener("visibilitychange", onVis);
      io.current?.disconnect();
      io.current = null;
    };
  }, [evalStop, release]);

  // Turning motion off stops everything that is playing, and nothing pushed aside comes back by itself
  useEffect(() => {
    if (motion) return;
    entries.current.forEach((e) => (e.preemptedAt = 0));
    pauseAll();
  }, [motion, pauseAll]);

  const value = useMemo<Ctx>(
    () => ({ register, unregister, setPostId, play, stop }),
    [register, unregister, setPostId, play, stop],
  );
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

function usePlaybackCtx(): Ctx {
  const c = useContext(PlaybackContext);
  if (!c) throw new Error("PlaybackProvider is missing");
  return c;
}

export type ManagedVideoOptions = {
  // Should this video be playing now (on screen, hovered, the current post)? It only starts by itself when motion is
  // on and Save-Data is off; play() starts it regardless.
  active?: boolean;
  // Which of the seven posts this is, for the stop timer. Leave null for videos that do not count (the calendar).
  postId?: string | null;
  // Called on timeupdate with progress 0..1, for progress bars
  onProgress?: (progress: number, time: number, duration: number) => void;
};

export type ManagedVideo = {
  // Put on the <video>: <video ref={v.ref} muted playsInline loop preload="none" poster=... src=...>
  ref: (el: HTMLVideoElement | null) => void;
  element: HTMLVideoElement | null;
  playing: boolean;
  // The browser refused to start it (e.g. Low Power Mode): show a "Tap to play" control
  refused: boolean;
  // Whether this video may start by itself right now
  autoplay: boolean;
  // The visitor paused it (pause(), or toggle() while playing). While set, `active` never restarts it: not when an
  // overlay closes, not when it scrolls back on screen. play() clears it; call clearUserPause() when the thing shown
  // changes (a new post in the viewer) so the new one may start by itself again.
  userPaused: boolean;
  clearUserPause: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
};

export function useManagedVideo(key: string, { active = false, postId = null, onProgress }: ManagedVideoOptions = {}): ManagedVideo {
  const ctx = usePlaybackCtx();
  const { register, unregister, setPostId, play: ctxPlay } = ctx;
  const [motion] = useMotion();
  const saveData = useSaveData();
  const autoplay = motion && !saveData;
  const [element, setElement] = useState<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [refused, setRefused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const progress = useRef(onProgress);
  progress.current = onProgress;
  const postRef = useRef(postId);
  postRef.current = postId;

  const ref = useCallback((el: HTMLVideoElement | null) => setElement(el), []);

  // Read by the provider at the moment another video lets go (see release in PlaybackProvider)
  const want = useRef({ active, autoplay, userPaused: false });
  want.current.active = active;
  want.current.autoplay = autoplay;
  const attemptRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!element) return;
    register(key, element, postRef.current, {
      wants: () => want.current.active && want.current.autoplay && !want.current.userPaused,
      resume: () => attemptRef.current(),
      held: () => want.current.userPaused,
    });
    const onPlaying = () => {
      setPlaying(true);
      setRefused(false);
    };
    const onPause = () => setPlaying(false);
    const onTime = () => {
      const d = element.duration || 0;
      progress.current?.(d ? element.currentTime / d : 0, element.currentTime, d);
    };
    element.addEventListener("playing", onPlaying);
    element.addEventListener("play", onPlaying);
    element.addEventListener("pause", onPause);
    element.addEventListener("ended", onPause);
    element.addEventListener("timeupdate", onTime);
    return () => {
      element.removeEventListener("playing", onPlaying);
      element.removeEventListener("play", onPlaying);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("ended", onPause);
      element.removeEventListener("timeupdate", onTime);
      unregister(key, element);
      setPlaying(false);
    };
  }, [element, key, register, unregister]);

  useEffect(() => {
    setPostId(key, postId);
  }, [key, postId, setPostId]);

  const markUserPaused = useCallback((v: boolean) => {
    want.current.userPaused = v;
    setUserPaused(v);
  }, []);

  const attempt = useCallback(() => {
    void ctxPlay(key).then((r) => {
      if (r === "refused") setRefused(true);
      else if (r === "playing") setRefused(false);
    });
  }, [ctxPlay, key]);
  attemptRef.current = attempt;

  const play = useCallback(() => {
    markUserPaused(false);
    attempt();
  }, [attempt, markUserPaused]);

  const pause = useCallback(() => {
    markUserPaused(true);
    element?.pause();
  }, [element, markUserPaused]);

  const toggle = useCallback(() => {
    if (!element) return;
    if (element.paused) play();
    else pause();
  }, [element, play, pause]);

  const clearUserPause = useCallback(() => markUserPaused(false), [markUserPaused]);

  useEffect(() => {
    if (!element) return;
    if (active && autoplay && !userPaused) {
      attempt();
    } else if (!active && !element.paused) {
      element.pause();
    }
  }, [element, active, autoplay, userPaused, attempt]);

  return { ref, element, playing, refused, autoplay, userPaused, clearUserPause, play, pause, toggle };
}

// Your longest stop so far on this visit, or null before any
export function useLongestStop(): Stop | null {
  return usePlaybackCtx().stop;
}
