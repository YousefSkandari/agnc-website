"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest("[inert]") && !el.closest("[hidden]") && el.getClientRects().length > 0,
  );
}

type Options = {
  // Focus the dialog itself on open (the reel viewer, so Space and the arrows work straight away)
  // instead of its first control
  focusSelf?: boolean;
};

// A native <dialog> opened with showModal while `open` is true. Esc calls onCancel (the caller decides what closing
// means, usually overlay.close()). Tab and Shift+Tab wrap inside the dialog. Focus return is the overlay provider's job.
export function useModalDialog(open: boolean, onCancel: () => void, { focusSelf = false }: Options = {}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancel = useRef(onCancel);
  cancel.current = onCancel;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal();
      if (focusSelf) {
        if (!d.hasAttribute("tabindex")) d.setAttribute("tabindex", "-1");
        d.focus({ preventScroll: true });
      } else {
        const first = focusables(d)[0];
        (first ?? d).focus({ preventScroll: true });
      }
    } else if (d.open) {
      d.close();
    }
  }, [open, focusSelf]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancelEvent = (e: Event) => {
      e.preventDefault();
      cancel.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables(d);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || at === d)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && at === last) {
        e.preventDefault();
        first.focus();
      }
    };
    d.addEventListener("cancel", onCancelEvent);
    d.addEventListener("keydown", onKey);
    return () => {
      d.removeEventListener("cancel", onCancelEvent);
      d.removeEventListener("keydown", onKey);
    };
  }, []);

  return ref;
}
