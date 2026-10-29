"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SECTION_IDS, sectionIndex, type SectionId } from "@/lib/sections";

// Which of the six sections the reader is in, for the header progress, aria-current and the bottom bar counter.
// A section is current once its top passes 40% of the way down the screen.
type Ctx = {
  active: SectionId;
  register: (id: SectionId, el: HTMLElement | null) => void;
};

const SectionsContext = createContext<Ctx | null>(null);

export function SectionsProvider({ children }: { children: ReactNode }) {
  const els = useRef(new Map<SectionId, HTMLElement>());
  const [active, setActive] = useState<SectionId>("d1");
  const frame = useRef(0);

  const measure = useCallback(() => {
    frame.current = 0;
    const line = window.innerHeight * 0.4;
    let current: SectionId = "d1";
    for (const id of SECTION_IDS) {
      const el = els.current.get(id);
      if (el && el.getBoundingClientRect().top <= line) current = id;
    }
    // At the very bottom the last section is current even if it is short
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2 && els.current.has("d8")) current = "d8";
    setActive((a) => (a === current ? a : current));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [measure]);

  const register = useCallback(
    (id: SectionId, el: HTMLElement | null) => {
      if (el) els.current.set(id, el);
      else els.current.delete(id);
      if (!frame.current && typeof window !== "undefined") frame.current = requestAnimationFrame(measure);
    },
    [measure],
  );

  const value = useMemo(() => ({ active, register }), [active, register]);
  return <SectionsContext.Provider value={value}>{children}</SectionsContext.Provider>;
}

function useSections(): Ctx {
  const c = useContext(SectionsContext);
  if (!c) throw new Error("SectionsProvider is missing");
  return c;
}

// Put on the <section> element: <section id="d2" ref={useSectionRef("d2")}>
export function useSectionRef(id: SectionId) {
  const { register } = useSections();
  return useCallback((el: HTMLElement | null) => register(id, el), [register, id]);
}

export function useActiveSection(): { id: SectionId; index: number; count: number } {
  const { active } = useSections();
  return { id: active, index: sectionIndex(active), count: SECTION_IDS.length };
}

// For buttons that are not plain #anchors (the sections menu closes first, then scrolls).
// Moves focus to the section so keyboard and screen reader users land there too.
export function scrollToSection(id: SectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  const smooth = document.documentElement.dataset.motion === "on" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}
