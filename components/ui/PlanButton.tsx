"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useOverlay } from "@/lib/client/overlay";

export const PLAN_LABEL = "Get your free launch plan";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> & {
  size?: 56 | 48 | 44;
  label?: string;
};

// The gold pill. Every one on the site says the same thing and opens the plan form (on pages without the form, it
// goes to /plan). The ref is forwarded so the shell can watch the d1 and d8 pills for the bottom bar.
const PlanButton = forwardRef<HTMLButtonElement, Props>(function PlanButton(
  { size = 56, label = PLAN_LABEL, className, onClick, ...rest },
  ref,
) {
  const { openForm } = useOverlay();
  const cls = ["pill", size === 48 ? "pill-48" : size === 44 ? "pill-44" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      className={cls}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) openForm(e.currentTarget);
      }}
    >
      {label}
    </button>
  );
});

export default PlanButton;
