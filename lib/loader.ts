// "Lights on", the loading screen (components/shell/Loader.tsx and loader.css). It shows on the first visit to the
// home page in a tab, with motion on: the wordmark lights up like a shop sign while the fonts, the hero poster and the
// page's code load, then lifts like a shutter and the hero rises in. Kept out of any "use client" module: the server
// reads these strings.
//
// <html data-loader> runs it:
//   "on"    the loader covers the page. CSS alone lifts it at 4.02s if nothing else does (the failsafe).
//   "go"    everything is ready: the shutter lifts 140ms later and the hero rises from 390ms.
//   "done"  1.5s after "go": the loader is gone and nothing replays, not even when the back button restores the page.
// No attribute at all: no loader (a later page of the visit, another page first, reduced motion, no JS).
export const LOADER_KEY = "agnc-loader";

// <head>, straight after MOTION_SCRIPT, so the first paint is already the loader. Only the first page of a visit can
// show it: the tab notes the visit on whatever page it starts (sessionStorage, gone when the tab closes, listed on
// /privacy), and only the home page shows it. A tab opened in the background skips it.
export const LOADER_HEAD = `(function(){try{var d=document.documentElement;if(d.dataset.motion!=="on")return;try{if(sessionStorage.getItem("${LOADER_KEY}"))return;sessionStorage.setItem("${LOADER_KEY}","1")}catch(e){return}if(location.pathname!=="/"||document.visibilityState==="hidden")return;d.dataset.loader="on"}catch(e){}})();`;

// Inside the loader, so it runs as soon as the loader is parsed. Waits for the four faces the first screen uses, the
// hero poster (decoded) and hydration (LoaderSignal calls agncLoaderHydrated), with a 1.31s minimum so the sign
// finishes lighting (the shutter then lifts at 1.45s, as on the design) and a 3.2s cap. The caption waits for its
// own font so it never swaps typeface on screen. If "go" would land after 3.7s the CSS failsafe is already under
// way, so it is left to finish and "done" follows at 5.4s. Tab lifts it at once, so keyboard focus is never hidden
// under it. Each step only moves forward from the state it expects: if React ever re-creates <html> (a hydration
// error), the attribute is gone and nothing brings the loader back.
export function loaderRun(poster: string): string {
  return `(function(){var d=document.documentElement;if(d.dataset.loader!=="on")return;try{
var t0=performance.now(),went=0,MIN=1310,CAP=3200,LATE=3700,END=5400,P=${JSON.stringify(poster)};
var el=function(){return performance.now()-t0},noop=function(){};
var fin=function(){var s=d.dataset.loader;if(s==="on"||s==="go")d.dataset.loader="done"};
var fire=function(){if(d.dataset.loader!=="on")return;var e=el();if(e>=LATE){setTimeout(fin,Math.max(0,END-e));return}d.dataset.loader="go";setTimeout(fin,1500)};
var ready=function(){if(went)return;went=1;setTimeout(fire,Math.max(0,MIN-el()))};
setTimeout(ready,CAP);
document.addEventListener("keydown",function(e){if(e.key==="Tab"&&d.dataset.loader==="on"){went=1;fire()}});
var l=document.currentScript&&document.currentScript.parentNode,stop=function(e){e.preventDefault()};
if(l){l.addEventListener("wheel",stop,{passive:false});l.addEventListener("touchmove",stop,{passive:false})}
var cs=getComputedStyle(d),fam=function(v){return cs.getPropertyValue(v).split(",")[0].trim()},F=document.fonts;
var load=function(f){try{return F.load(f).then(noop,noop)}catch(e){return Promise.resolve()}};
var mono=load("400 12px "+fam("--font-mono"));
mono.then(function(){d.style.setProperty("--ldr-cap",Math.max(0,940-el())+"ms");d.dataset.loaderCap=""});
var hyd=new Promise(function(r){window.agncLoaderHydrated=r});
var dom=new Promise(function(r){if(document.readyState!=="loading")r();else document.addEventListener("DOMContentLoaded",function(){r()})});
var pic=dom.then(function(){var i=document.querySelector(".d1-poster");if(!i){i=new Image();i.src=P}return i.decode?i.decode().then(noop,noop):null});
Promise.all([mono,load("italic 400 48px "+fam("--font-serif")),load("400 16px "+fam("--font-sans")),load("600 16px "+fam("--font-sans")),pic,hyd]).then(function(){return F&&F.ready}).then(ready,ready);
}catch(e){setTimeout(function(){var s=d.dataset.loader;if(s==="on"||s==="go")d.dataset.loader="done"},5400)}})();`;
}
