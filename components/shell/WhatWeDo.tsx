"use client";

// PACKAGE A. Stub from the scaffold: replace with d1 (PORT-PLAN.md, A4).
import PlanButton from "@/components/ui/PlanButton";
import { useSectionRef } from "@/lib/client/sections";

export default function WhatWeDo() {
  const ref = useSectionRef("d1");
  return (
    <section id="d1" ref={ref} aria-labelledby="d1-h">
      <div className="wrap">
        <p className="kicker">SOCIAL MEDIA MARKETING FOR RESTAURANTS</p>
        <h1 id="d1-h" className="h2">Full tables, from day one.</h1>
        <p className="lead">We’re a social media marketing agency for restaurants. We plan, film and post, so people find you and come in.</p>
        <PlanButton />
      </div>
    </section>
  );
}
