// "Lights on", the first-visit loading screen (lib/loader.ts has the timing, loader.css the look). Server HTML, so it
// is the first thing painted; hidden unless the head script set <html data-loader>. Decorative to screen readers:
// the page underneath is already there for them.
//   ldr-u  the sign unlit: a faint outline of the letters
//   ldr-o  the gold outline that draws on, flickers and fades as the letters light
//   ldr-f  the lit wordmark, which flickers on (it also holds the path the outlines use)
import { heroReel } from "@/lib/media";
import { LOGO_AGNC, LOGO_MEDIA } from "@/lib/loader-paths";
import { loaderRun } from "@/lib/loader";
import LoaderSignal from "./LoaderSignal";

export default function Loader() {
  return (
    <div className="ldr" aria-hidden="true">
      <div className="ldr-ribs" />
      <div className="ldr-sign">
        <svg className="ldr-u" viewBox="0 0 1591 288" width="1591" height="288" focusable="false">
          <use href="#ldr-a" />
        </svg>
        <svg className="ldr-o" viewBox="0 0 1591 288" width="1591" height="288" focusable="false">
          <use href="#ldr-a" />
        </svg>
        <svg className="ldr-f" viewBox="0 0 1591 375" width="1591" height="375" focusable="false">
          <defs>
            <path id="ldr-a" d={LOGO_AGNC} vectorEffect="non-scaling-stroke" />
          </defs>
          <use href="#ldr-a" />
          <path d={LOGO_MEDIA} />
        </svg>
      </div>
      <p className="ldr-cap">Social media marketing for restaurants</p>
      <div className="ldr-hair">
        <i />
      </div>
      <div className="ldr-rail" />
      <script dangerouslySetInnerHTML={{ __html: loaderRun(heroReel.poster) }} />
      <LoaderSignal />
    </div>
  );
}
