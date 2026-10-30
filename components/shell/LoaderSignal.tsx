"use client";

import { useEffect } from "react";

type LoaderWindow = Window & { agncLoaderHydrated?: () => void };

// Tells the loader's inline script (lib/loader.ts) that the page has hydrated, so the buttons work once it lifts.
// The whole page hydrates in one pass, so this effect runs once every component on it has.
export default function LoaderSignal() {
  useEffect(() => {
    (window as LoaderWindow).agncLoaderHydrated?.();
  }, []);
  return null;
}
