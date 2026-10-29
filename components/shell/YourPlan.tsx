"use client";

// PACKAGE A. Stub from the scaffold: replace with d8 (PORT-PLAN.md, A8).
import PlanButton from "@/components/ui/PlanButton";
import { useSectionRef } from "@/lib/client/sections";

export default function YourPlan() {
  const ref = useSectionRef("d8");
  return (
    <section id="d8" ref={ref} aria-labelledby="d8-h">
      <div className="wrap">
        <h2 id="d8-h" className="h2">Your opening’s next.</h2>
        <PlanButton />
      </div>
    </section>
  );
}
