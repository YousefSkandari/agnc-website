"use client";

import { useSyncExternalStore } from "react";

// Motion is on when <html data-motion="on">. The head script sets it before paint from the visitor's reduced-motion
// setting, and this keeps it in step if they change that setting while the page is open.
function read(): boolean {
  return document.documentElement.dataset.motion === "on";
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onChange = () => {
    document.documentElement.dataset.motion = mq.matches ? "off" : "on";
    cb();
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// false on the server and during hydration, so nothing autoplays from server HTML
export function useMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
