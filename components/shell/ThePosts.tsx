"use client";

// PACKAGE A. Stub from the scaffold: replace with d2 (PORT-PLAN.md, A5).
import { useSectionRef } from "@/lib/client/sections";

export default function ThePosts() {
  const ref = useSectionRef("d2");
  return (
    <section id="d2" ref={ref} aria-labelledby="d2-h">
      <div className="wrap">
        <p className="kicker">THE POSTS</p>
        <h2 id="d2-h" className="h2">Seven posts. Each one has a job.</h2>
        <p className="lead">In the order we’d post them around your opening.</p>
      </div>
    </section>
  );
}
