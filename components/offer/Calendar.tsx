"use client";

// PACKAGE B. Stub from the scaffold: replace with d4, the 30-day example plan (PORT-PLAN.md, B1).
import PlanButton from "@/components/ui/PlanButton";
import { useSectionRef } from "@/lib/client/sections";

export default function Calendar() {
  const ref = useSectionRef("d4");
  return (
    <section id="d4" ref={ref} aria-labelledby="d4-h" className="cal">
      <div className="wrap">
        <p className="kicker">YOUR FREE LAUNCH PLAN · AN EXAMPLE</p>
        <h2 id="d4-h" className="h2">Thirty days. Every post planned.</h2>
        <div className="cal-close">
          <p>Want this for your opening?</p>
          <PlanButton />
        </div>
      </div>
    </section>
  );
}
