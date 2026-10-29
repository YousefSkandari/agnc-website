"use client";

// PACKAGE A. The phone bottom bar (D 714–722, PORT-PLAN 1.3). Shown at 640px and below once the d1 pill has scrolled
// off the top, while the d8 pill is not on screen and no layer is open (D 2108). Hidden with the hidden attribute so
// it is out of the tab order.
import { useOverlay } from "@/lib/client/overlay";
import { useActiveSection } from "@/lib/client/sections";
import { usePhone } from "@/lib/client/device";
import { IconMenu } from "@/components/ui/icons";
import PlanButton from "@/components/ui/PlanButton";
import { useBarSignals } from "./barSignals";

const pad = (n: number) => String(n).padStart(2, "0");

export default function BottomBar() {
  const phone = usePhone();
  const { d1Off, d8On } = useBarSignals();
  const { state, openMenu } = useOverlay();
  const { index, count } = useActiveSection();
  const on = phone && d1Off && !d8On && state.kind === "none";

  return (
    <div className="bbar" hidden={!on}>
      <button
        type="button"
        className="bbar-menu"
        aria-label={`Sections, ${index + 1} of ${count}`}
        onClick={(e) => openMenu(e.currentTarget)}
      >
        <IconMenu size={20} />
        <span className="bbar-count">
          {pad(index + 1)}/{pad(count)}
        </span>
      </button>
      <PlanButton size={48} className="bbar-pill" />
    </div>
  );
}
