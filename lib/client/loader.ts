"use client";

import { useSyncExternalStore } from "react";

// True while the "Lights on" loader covers the page (<html data-loader="on">, see lib/loader.ts), so the hero post
// waits to start until the shutter lifts and plays from its first frame.
function read(): boolean {
  return document.documentElement.dataset.loader === "on";
}

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-loader"] });
  return () => mo.disconnect();
}

// false on the server and during hydration, like useMotion; nothing autoplays before then anyway
export function useLoaderCovering(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
