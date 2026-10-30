"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { londonToday, type Ymd } from "@/lib/dates";

// Breakpoints, matching the CSS in app/globals.css and the component stylesheets
export const BP = {
  phone: 640, // at or below: phone layout (bottom bar, full-bleed hero, swipers)
  nav: 860, // at or below: header description hidden, d1 kicker shown
  short: 980, // at or below: short nav labels
  stack: 1100, // at or below: 40px gutters, single-column grids
  swiper: 1200, // at or below: viewer single column, calendar becomes the swiper
} as const;

export const MQ = {
  phone: `(max-width: ${BP.phone}px)`,
  swiper: `(max-width: ${BP.swiper}px)`,
  stack: `(max-width: ${BP.stack}px)`,
  coarse: "(pointer: coarse)",
  hover: "(hover: hover) and (pointer: fine)",
} as const;

// false on the server and during hydration; the real value straight after
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const usePhone = () => useMediaQuery(MQ.phone);
export const useCoarsePointer = () => useMediaQuery(MQ.coarse);
export const useCanHover = () => useMediaQuery(MQ.hover);

type NetworkInformation = { saveData?: boolean };

// The visitor asked their browser to save data: no video loads until they press play
const noSubscribe = () => () => {};

export function useSaveData(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => !!(navigator as Navigator & { connection?: NetworkInformation }).connection?.saveData,
    () => false,
  );
}

export function useMounted(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

// Today's date in London, or null until after hydration, so server and client HTML always match.
// Anything that shows it should reserve its height while it is null.
export function useLondonToday(): Ymd | null {
  const [today, setToday] = useState<Ymd | null>(null);
  useEffect(() => {
    setToday(londonToday());
    // Roll over at midnight if the page is left open
    const id = window.setInterval(() => setToday((t) => (t === londonToday() ? t : londonToday())), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return today;
}
