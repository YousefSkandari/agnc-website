"use client";

// PACKAGE B. Stub from the scaffold: replace with d5, how it works and the price (PORT-PLAN.md, B2).
import { useSectionRef } from "@/lib/client/sections";

export default function HowItWorks() {
  const ref = useSectionRef("d5");
  return (
    <section id="d5" ref={ref} aria-labelledby="d5-h" className="hiw">
      <div className="wrap">
        <p className="kicker">HOW IT WORKS · PRICE</p>
        <h2 id="d5-h" className="h2">Start with a free plan. Decide after.</h2>
      </div>
    </section>
  );
}
