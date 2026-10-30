// Small pieces shared by d4's grid, brief and swiper. Decorative marks are aria-hidden; the button around them
// carries the name.
import type { CalDay } from "@/content/calendar";
import { brand } from "@/lib/media";
import { IconPause, IconPlay } from "@/components/ui/icons";
import type { ManagedVideo } from "@/lib/client/playback";
import { glyphOf } from "./calView";

// The format glyph: one stroke path on a 24 grid, Stories drawn as a dashed ring (D 420, 435, 475)
export function Glyph({ day, size }: { day: CalDay; size: number }) {
  const g = glyphOf(day);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={g.d} strokeDasharray={g.dash} />
    </svg>
  );
}

// The agnc. logo on its 52x22 plate, marking our own work (D 418)
export function LogoPlate({ className }: { className?: string }) {
  return (
    <span className={`cal-logo${className ? ` ${className}` : ""}`}>
      <img src={brand.logo.src} alt="" width={40} height={9} />
    </span>
  );
}

export function LogoMark() {
  return <img className="cal-logomark" src={brand.logo.src} alt="" width={40} height={9} />;
}

// What the video controls show (D 1839-1843): the centred chip when the reel is not playing and either motion is
// off, Save-Data is on, or the browser refused to start it; otherwise the round pause button.
export function videoUi(v: ManagedVideo, saveData: boolean) {
  const chip = !v.playing && (!v.autoplay || v.refused);
  // "Tap to play" after a refusal or under Save-Data (motion off alone keeps "Play the post")
  const tap = v.refused || saveData;
  return { chip, tap };
}

export function PauseButton({ v, className }: { v: ManagedVideo; className: string }) {
  return (
    <button type="button" className={className} aria-label={v.playing ? "Pause the post" : "Play the post"} onClick={v.toggle}>
      {v.playing ? <IconPause size={20} /> : <IconPlay size={20} />}
    </button>
  );
}

export function PlayChip({ v, tap, className, iconSize }: { v: ManagedVideo; tap: boolean; className: string; iconSize: number }) {
  return (
    <button type="button" className={className} onClick={v.play}>
      <IconPlay size={iconSize} />
      {tap ? "Tap to play" : "Play the post"}
    </button>
  );
}
