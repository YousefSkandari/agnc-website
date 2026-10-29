"use client";

// PACKAGE A. The sections menu sheet on the phone (D 724–747, PORT-PLAN 1.2). Opened from the bottom bar.
import type { MouseEvent } from "react";
import { useModalDialog } from "@/lib/client/dialog";
import { useOverlay, useOverlayHost } from "@/lib/client/overlay";
import { scrollToSection, useActiveSection } from "@/lib/client/sections";
import { SECTIONS, type SectionId } from "@/lib/sections";
import { brand } from "@/lib/media";
import { IconClose } from "@/components/ui/icons";
import PlanButton from "@/components/ui/PlanButton";
import MotionSwitch from "./MotionSwitch";

// Closing the sheet unwinds its history entry. Some browsers restore the old scroll position when that traversal
// lands, so the section scroll waits for it (or a short timeout if there was no entry to unwind).
function scrollAfterClose(id: SectionId) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    window.removeEventListener("popstate", run);
    requestAnimationFrame(() => scrollToSection(id));
  };
  window.addEventListener("popstate", run);
  window.setTimeout(run, 250);
}

export default function MenuSheet() {
  useOverlayHost("menu");
  const { state, close, openForm } = useOverlay();
  const { id: active } = useActiveSection();
  const open = state.kind === "menu";
  const ref = useModalDialog(open, close);

  const go = (id: SectionId) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (id === "d8") {
      // "Get my free plan" swaps the sheet for the form, keeping the history entry and the opener (D 1992)
      openForm();
      return;
    }
    close();
    scrollAfterClose(id);
  };

  return (
    <dialog ref={ref} aria-label="Sections" className="menu-sheet">
      {open && (
        <>
          <div className="menu-head">
            <div className="menu-brand">
              <img src={brand.logo.src} alt={brand.logo.alt} width={84} height={20} />
              <span className="menu-desc">SOCIAL MEDIA MARKETING FOR RESTAURANTS</span>
            </div>
            <button type="button" className="icob menu-close" aria-label="Close the sections" onClick={close}>
              <IconClose size={20} />
            </button>
          </div>
          <nav aria-label="Sections" className="menu-nav">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="menu-row"
                aria-current={active === s.id ? "true" : undefined}
                onClick={go(s.id)}
              >
                {s.menu}
              </a>
            ))}
          </nav>
          <MotionSwitch where="menu" />
          <PlanButton className="menu-pill" />
        </>
      )}
    </dialog>
  );
}
