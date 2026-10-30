"use client";

// The plan form overlay (D 884–887, D 1874–1895).
// With motion on and a pill to grow from, the dialog grows out of the pill's rect (a clip-path, 280ms) and the form
// fades in after it (D .cin). Otherwise it simply appears: no animation at all with reduced motion.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useMediaQuery } from "@/lib/client/device";
import { useModalDialog } from "@/lib/client/dialog";
import { useMotion } from "@/lib/client/motion";
import { useOverlay, useOverlayHost } from "@/lib/client/overlay";
import { captureRef } from "./draft";
import PlanForm from "./PlanForm";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Entry = { phase: "none" | "start" | "run"; clip: string; fade: boolean };
const REST: Entry = { phase: "none", clip: "", fade: false };

export default function PlanOverlay() {
  useOverlayHost("form");
  const { state, close } = useOverlay();
  const open = state.kind === "form";
  const ref = useModalDialog(open, close);
  const motionOn = useMotion();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [entry, setEntry] = useState<Entry>(REST);

  // Read inside the open transition only, so a change mid-animation can't restart it
  const animate = useRef(false);
  animate.current = motionOn && !reduced;
  const origin = useRef<DOMRect | null>(null);
  origin.current = state.kind === "form" ? state.origin : null;
  const wasOpen = useRef(false);

  // A ?ref= in the address is kept from the moment the page loads, before the form is ever opened
  useEffect(() => {
    captureRef();
  }, []);

  // Before the first open frame paints: start clipped to the pill, then grow to the full screen (D 2075–2076)
  useIsoLayoutEffect(() => {
    if (open === wasOpen.current) return;
    wasOpen.current = open;
    if (!open) {
      setEntry(REST);
      return;
    }
    const r = origin.current;
    if (!animate.current || !r) return;
    const t = Math.max(0, r.top);
    const l = Math.max(0, r.left);
    const rt = Math.max(0, window.innerWidth - r.right);
    const b = Math.max(0, window.innerHeight - r.bottom);
    setEntry({ phase: "start", clip: `inset(${t}px ${rt}px ${b}px ${l}px round 999px)`, fade: true });
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setEntry((e) => ({ ...e, phase: "run", clip: "inset(0px 0px 0px 0px round 0px)" })));
    });
    // Once grown, the clip comes off altogether
    const end = window.setTimeout(() => setEntry((e) => ({ ...e, phase: "none", clip: "" })), 320);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      window.clearTimeout(end);
    };
  }, [open]);

  const cls = ["pf-dialog", entry.phase !== "none" ? "is-entering" : "", entry.phase === "run" ? "is-run" : ""]
    .filter(Boolean)
    .join(" ");
  const style: CSSProperties | undefined = entry.clip ? { clipPath: entry.clip } : undefined;

  return (
    <dialog ref={ref} aria-label="Your free launch plan" className={cls} style={style}>
      {open && <PlanForm mode="overlay" onClose={close} entering={entry.fade} />}
    </dialog>
  );
}
