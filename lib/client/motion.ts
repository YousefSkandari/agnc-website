"use client";

import { useSyncExternalStore } from "react";
import { MOTION_KEY } from "@/lib/motion-script";

// Motion is on when <html data-motion="on">. The head script sets it before paint from the saved choice, or from the
// visitor's reduced-motion setting when they have not chosen. CSS animations are also gated on the media query itself,
// so with reduced motion set nothing animates even if the switch is turned on; only video playback follows the switch.
const listeners = new Set<() => void>();

function read(): boolean {
  return document.documentElement.dataset.motion === "on";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onChange = () => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(MOTION_KEY);
    } catch {}
    if (saved !== "on" && saved !== "off") {
      document.documentElement.dataset.motion = mq.matches ? "off" : "on";
      cb();
    }
  };
  mq.addEventListener("change", onChange);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", onChange);
  };
}

export function setMotion(on: boolean) {
  document.documentElement.dataset.motion = on ? "on" : "off";
  try {
    localStorage.setItem(MOTION_KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((l) => l());
}

// false on the server and during hydration, so nothing autoplays from server HTML
export function useMotion(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, read, () => false);
  return [on, setMotion];
}
