"use client";

// PACKAGE C. Stub from the scaffold: replace with the eight-step plan form (PORT-PLAN.md, C1).
// mode "overlay": inside PlanOverlay's <dialog>, steps push history, close returns to the page.
// mode "page": /plan, no dialog, no step history, the close control links to "/".
import { IconClose } from "@/components/ui/icons";

export type PlanFormProps = {
  mode: "overlay" | "page";
  // Overlay mode only: close the overlay
  onClose?: () => void;
};

export default function PlanForm({ mode, onClose }: PlanFormProps) {
  return (
    <div className="pf">
      <div className="pf-top">
        <span className="kicker">Step 1 / 8</span>
        {mode === "overlay" ? (
          <button type="button" className="icob" aria-label="Close the plan form" onClick={onClose}>
            <IconClose />
          </button>
        ) : (
          <a className="icob" href="/" aria-label="Close the plan form">
            <IconClose />
          </a>
        )}
      </div>
      <h1 className="h2">What’s your restaurant called?</h1>
    </div>
  );
}
