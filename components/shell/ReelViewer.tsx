"use client";

// PACKAGE A. Stub from the scaffold: replace with the reel viewer (PORT-PLAN.md, A6).
import { useModalDialog } from "@/lib/client/dialog";
import { useOverlay, useOverlayHost } from "@/lib/client/overlay";
import { IconClose } from "@/components/ui/icons";

export default function ReelViewer() {
  useOverlayHost("reels");
  const { state, close } = useOverlay();
  const open = state.kind === "reels";
  const ref = useModalDialog(open, close, { focusSelf: true });
  return (
    <dialog ref={ref} aria-label="Our posts" className="viewer">
      {open && (
        <button type="button" className="icob" aria-label="Close the posts" onClick={close}>
          <IconClose />
        </button>
      )}
    </dialog>
  );
}
