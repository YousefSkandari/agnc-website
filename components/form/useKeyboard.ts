"use client";

import { useEffect, useState } from "react";

// How far the on-screen keyboard covers the bottom of the layout viewport, in px, or 0 when it is down (or under
// 120px, which is a toolbar, not a keyboard). The phone form lifts its Continue button above it (P4 componentDidMount).
// 0 on the server and until after mount.
export function useKeyboardInset(enabled: boolean): number {
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!enabled || !vv) {
      setKb(0);
      return;
    }
    const measure = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setKb(covered > 120 ? Math.round(covered) : 0);
    };
    measure();
    vv.addEventListener("resize", measure);
    vv.addEventListener("scroll", measure);
    return () => {
      vv.removeEventListener("resize", measure);
      vv.removeEventListener("scroll", measure);
    };
  }, [enabled]);
  return kb;
}
