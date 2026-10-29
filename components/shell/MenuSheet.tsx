"use client";

// PACKAGE A. Stub from the scaffold: replace with the sections menu sheet (PORT-PLAN.md, A2).
import { useModalDialog } from "@/lib/client/dialog";
import { useOverlay, useOverlayHost } from "@/lib/client/overlay";
import { scrollToSection } from "@/lib/client/sections";
import { SECTIONS } from "@/lib/sections";
import { IconClose } from "@/components/ui/icons";

export default function MenuSheet() {
  useOverlayHost("menu");
  const { state, close, openForm } = useOverlay();
  const open = state.kind === "menu";
  const ref = useModalDialog(open, close);
  return (
    <dialog ref={ref} aria-label="Sections" className="menu-sheet">
      {open && (
        <div>
          <button type="button" className="icob" aria-label="Close the sections" onClick={close}>
            <IconClose />
          </button>
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="rowb"
                  onClick={() => {
                    if (s.id === "d8") {
                      openForm();
                      return;
                    }
                    close();
                    requestAnimationFrame(() => scrollToSection(s.id));
                  }}
                >
                  {s.menu}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </dialog>
  );
}
