// Runs in <head> before the page paints, so the first frame already knows whether motion is on.
// Kept out of any "use client" module: the server layout reads this string directly.
export const MOTION_KEY = "agnc-motion";

export const MOTION_SCRIPT = `(function(){try{var d=document.documentElement,s=null;try{s=localStorage.getItem(${JSON.stringify(
  MOTION_KEY,
)})}catch(e){}var r=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;d.dataset.motion=s==="on"?"on":s==="off"?"off":r?"off":"on"}catch(e){}})();`;
