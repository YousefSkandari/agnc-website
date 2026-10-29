"use client";

import { useMotion } from "@/lib/client/motion";

// PACKAGE A, private. The MOTION switch (D 185–187 in the header, D 741–743 in the menu sheet). Both words are in the
// HTML and CSS on <html data-motion> shows the right one, so the first paint never shows the wrong word (H3).
export default function MotionSwitch({ where }: { where: "header" | "menu" }) {
  const [motion, setMotion] = useMotion();
  return (
    <label className={`mo-switch mo-switch-${where}`}>
      <input type="checkbox" role="switch" checked={motion} onChange={() => setMotion(!motion)} />
      <span className="mo-text">
        MOTION · <span className="mo-word"><span className="mo-on">ON</span><span className="mo-off">OFF</span></span>
      </span>
    </label>
  );
}
