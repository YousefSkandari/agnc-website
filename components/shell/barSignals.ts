"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// The phone bottom bar shows once the d1 pill has scrolled off the top, and hides again while the
// d8 pill is on screen (artboard D 1407–1414, 2108). The two pills live in WhatWeDo and YourPlan, which are siblings of
// the bar under a server page, so the signals go through this tiny store instead of a context.
type Signals = { d1Off: boolean; d8On: boolean };

const SERVER: Signals = { d1Off: false, d8On: false };
let state: Signals = SERVER;
const listeners = new Set<() => void>();

function set(patch: Partial<Signals>) {
  const next = { ...state, ...patch };
  if (next.d1Off === state.d1Off && next.d8On === state.d8On) return;
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useBarSignals(): Signals {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER,
  );
}

// Returns a ref for the pill. d1: "off" means it has left the screen upwards. d8: "on" means any of it is on screen.
export function usePillSignal(which: "d1" | "d8") {
  const [el, setEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (which === "d1") set({ d1Off: !en.isIntersecting && en.boundingClientRect.top < 0 });
        else set({ d8On: en.isIntersecting });
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      set(which === "d1" ? { d1Off: false } : { d8On: false });
    };
  }, [el, which]);

  return setEl;
}
