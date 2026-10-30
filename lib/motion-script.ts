// Runs in <head> before the page paints, so the first frame already knows whether motion is on.
// Kept out of any "use client" module: the server layout reads this string directly.
export const MOTION_KEY = "agnc-motion";

export const MOTION_SCRIPT = `(function(){try{var d=document.documentElement,s=null;try{s=localStorage.getItem(${JSON.stringify(
  MOTION_KEY,
)})}catch(e){}var r=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;d.dataset.motion=s==="on"?"on":s==="off"?"off":r?"off":"on"}catch(e){}})();`;

// Runs at the end of <body>, before hydration: the MOTION switch's box follows <html data-motion> from the first paint,
// as its ON/OFF word already does. (The server renders it unchecked: it cannot know the visitor's setting.) React
// sets the same value once it hydrates.
export const SWITCH_SCRIPT = `(function(){try{var on=document.documentElement.dataset.motion==="on";var l=document.querySelectorAll(".mo-switch input");for(var i=0;i<l.length;i++)l[i].checked=on}catch(e){}})();`;
