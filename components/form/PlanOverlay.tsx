"use client";

// PACKAGE C. Stub from the scaffold: replace with the form overlay (PORT-PLAN.md, C2).
import { useModalDialog } from "@/lib/client/dialog";
import { useOverlay, useOverlayHost } from "@/lib/client/overlay";
import PlanForm from "./PlanForm";

export default function PlanOverlay() {
  useOverlayHost("form");
  const { state, close } = useOverlay();
  const open = state.kind === "form";
  const ref = useModalDialog(open, close);
  return (
    <dialog ref={ref} aria-label="Your free launch plan" className="pf-dialog">
      {open && <PlanForm mode="overlay" onClose={close} />}
    </dialog>
  );
}
