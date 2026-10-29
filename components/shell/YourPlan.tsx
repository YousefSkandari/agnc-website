"use client";

// PACKAGE A. d8, Your plan (D 694–701, PORT-PLAN 1.10). The pill is watched for the phone bottom bar.
import PlanButton from "@/components/ui/PlanButton";
import { useSectionRef } from "@/lib/client/sections";
import { usePillSignal } from "./barSignals";

export default function YourPlan() {
  const ref = useSectionRef("d8");
  const pillRef = usePillSignal("d8");
  return (
    <section id="d8" ref={ref} className="d8sec" aria-labelledby="d8-h">
      <div className="wrap">
        <div className="d8">
          <h2 id="d8-h" className="d8-h">
            Your opening’s next.
          </h2>
          <PlanButton ref={pillRef} className="d8-pill" />
        </div>
      </div>
    </section>
  );
}
