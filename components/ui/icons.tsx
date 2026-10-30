// Stroke icons on a 24px grid, drawn from the design's paths. Decorative: the button around each one carries the
// accessible name, so every icon is aria-hidden.
import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

// Every icon in the design is stroked (fill none, stroke 1.75). `extra` adds the circle or rect some of them carry.
function make(d: string, extra?: ReactNode) {
  function Icon({ size = 24, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {extra}
        <path d={d} />
      </svg>
    );
  }
  return Icon;
}

export const IconPlay = make("M8 5.5v13l10.5-6.5z");
export const IconPause = make("M9 5.5v13M15 5.5v13");
export const IconClose = make("M6 6l12 12M18 6L6 18");
export const IconPrev = make("M14.5 5.5L8 12l6.5 6.5");
export const IconNext = make("M9.5 5.5L16 12l-6.5 6.5");
export const IconCheck = make("M5 12.5l4.5 4.5L19 7.5");
export const IconAlert = make("M12 7.5v5.5M12 16.5v0.01", <circle cx="12" cy="12" r="9" />);
export const IconShare = make("M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v6.5h14V13");
export const IconOut = make("M7 17L17 7M9 7h8v8");
export const IconMenu = make("M4 7h16M4 12h16M4 17h16");
export const IconCalendar = make("M4 10h16M8.5 3.5v4M15.5 3.5v4", <rect x="4" y="5.5" width="16" height="14.5" rx="2" />);
export const IconPlus = make("M12 5v14M5 12h14");
