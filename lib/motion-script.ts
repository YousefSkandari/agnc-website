// Runs in <head> before the page paints, so the first frame already knows whether motion is on: it is, unless the
// visitor's device asks for reduced motion. Kept out of any "use client" module: the server layout reads this string.
// It also removes the choice the old MOTION switch saved, so nobody stays stuck with motion off.
export const MOTION_SCRIPT = `(function(){try{var d=document.documentElement;try{localStorage.removeItem("agnc-motion")}catch(e){}d.dataset.motion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches?"off":"on"}catch(e){}})();`;
