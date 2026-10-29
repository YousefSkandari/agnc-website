"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

// The three full-screen layers: the sections menu (phone), the reel viewer and the plan form. Only one is open at a
// time. Opening one pushes a history entry, so the phone's back gesture closes it; the form pushes one more per step
// so back goes to the previous step. Closing returns focus to whatever opened the first layer.
export type OverlayState =
  | { kind: "none" }
  | { kind: "menu" }
  | { kind: "reels"; start: number }
  | { kind: "form"; origin: DOMRect | null };

export type OverlayKind = Exclude<OverlayState["kind"], "none">;

// Return true when the back press was used (e.g. the form went back a step); false lets it close the layer
export type BackHandler = () => boolean;

type Ctx = {
  state: OverlayState;
  // opener: the element to return focus to and, for the form, to grow from
  openForm: (opener?: HTMLElement | null) => void;
  openReels: (start?: number, opener?: HTMLElement | null) => void;
  openMenu: (opener?: HTMLElement | null) => void;
  close: () => void;
  // The form calls pushStep when it moves forward a step, and popStep when its own Back button moves back one,
  // so the browser history always matches the step on screen
  pushStep: () => void;
  popStep: () => void;
  // The open layer's back handler; call the returned function to remove it
  onBack: (handler: BackHandler) => () => void;
  registerHost: (kind: OverlayKind) => () => void;
};

const OverlayContext = createContext<Ctx | null>(null);
const MARK = "agncOverlay";

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState>({ kind: "none" });
  const stateRef = useRef(state);
  stateRef.current = state;
  const pushed = useRef(0);
  const ignorePops = useRef(0);
  const opener = useRef<HTMLElement | null>(null);
  const back = useRef<BackHandler | null>(null);
  const hosts = useRef(new Map<OverlayKind, number>());

  const restoreFocus = useCallback(() => {
    const el = opener.current;
    opener.current = null;
    if (el && el.isConnected) requestAnimationFrame(() => el.focus({ preventScroll: true }));
  }, []);

  const push = useCallback(() => {
    try {
      history.pushState({ ...(history.state ?? {}), [MARK]: pushed.current + 1 }, "");
      pushed.current += 1;
    } catch {}
  }, []);

  const open = useCallback(
    (next: OverlayState, el?: HTMLElement | null) => {
      const wasOpen = stateRef.current.kind !== "none";
      if (!wasOpen) {
        opener.current = el ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
        push();
      }
      // Switching layer (menu to form, viewer to form) keeps the history entries and the first opener
      back.current = null;
      setState(next);
    },
    [push],
  );

  const close = useCallback(() => {
    if (stateRef.current.kind === "none") return;
    back.current = null;
    setState({ kind: "none" });
    if (pushed.current > 0) {
      ignorePops.current += 1;
      const n = pushed.current;
      pushed.current = 0;
      history.go(-n);
    }
    restoreFocus();
  }, [restoreFocus]);

  const openForm = useCallback(
    (el?: HTMLElement | null) => {
      if (!hosts.current.get("form")) {
        // No form on this page (e.g. /privacy): go to /plan, keeping ?ref and the like
        window.location.assign(`/plan${window.location.search}`);
        return;
      }
      const origin = el ? el.getBoundingClientRect() : null;
      open({ kind: "form", origin }, el);
    },
    [open],
  );
  const openReels = useCallback((start = 0, el?: HTMLElement | null) => open({ kind: "reels", start }, el), [open]);
  const openMenu = useCallback((el?: HTMLElement | null) => open({ kind: "menu" }, el), [open]);

  const pushStep = useCallback(() => {
    if (stateRef.current.kind !== "none") push();
  }, [push]);

  const popStep = useCallback(() => {
    if (stateRef.current.kind === "none" || pushed.current <= 1) return;
    ignorePops.current += 1;
    pushed.current -= 1;
    history.back();
  }, []);

  const onBack = useCallback((handler: BackHandler) => {
    back.current = handler;
    return () => {
      if (back.current === handler) back.current = null;
    };
  }, []);

  const registerHost = useCallback((kind: OverlayKind) => {
    hosts.current.set(kind, (hosts.current.get(kind) ?? 0) + 1);
    return () => {
      hosts.current.set(kind, Math.max(0, (hosts.current.get(kind) ?? 1) - 1));
    };
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (ignorePops.current > 0) {
        ignorePops.current -= 1;
        return;
      }
      if (stateRef.current.kind === "none") return;
      pushed.current = Math.max(0, pushed.current - 1);
      const used = back.current ? back.current() : false;
      if (used && pushed.current > 0) return;
      back.current = null;
      setState({ kind: "none" });
      if (pushed.current > 0) {
        ignorePops.current += 1;
        const n = pushed.current;
        pushed.current = 0;
        history.go(-n);
      }
      restoreFocus();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [restoreFocus]);

  // Lock the page behind an open layer
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("is-locked", state.kind !== "none");
    return () => root.classList.remove("is-locked");
  }, [state.kind]);

  const value = useMemo<Ctx>(
    () => ({ state, openForm, openReels, openMenu, close, pushStep, popStep, onBack, registerHost }),
    [state, openForm, openReels, openMenu, close, pushStep, popStep, onBack, registerHost],
  );
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useOverlay(): Omit<Ctx, "registerHost"> {
  const c = useContext(OverlayContext);
  if (!c) throw new Error("OverlayProvider is missing");
  return c;
}

// Each layer component calls this once, so openForm() knows whether this page has a form to open
export function useOverlayHost(kind: OverlayKind) {
  const c = useContext(OverlayContext);
  if (!c) throw new Error("OverlayProvider is missing");
  const { registerHost } = c;
  useEffect(() => registerHost(kind), [registerHost, kind]);
}
