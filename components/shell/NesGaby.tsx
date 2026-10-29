"use client";

// PACKAGE A. Stub from the scaffold: replace with d7 (PORT-PLAN.md, A7).
import { useSectionRef } from "@/lib/client/sections";

export default function NesGaby() {
  const ref = useSectionRef("d7");
  return (
    <section id="d7" ref={ref} aria-labelledby="d7-h">
      <div className="wrap">
        <p className="kicker">NES &amp; GABY</p>
        <h2 id="d7-h" className="h2">You’ll work with us.</h2>
      </div>
    </section>
  );
}
