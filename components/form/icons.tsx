// The form's own icons, drawn from the phone artboard (P4) on its 20px grid. Decorative, like the shared set.
import type { ReactNode, SVGProps } from "react";

type Props = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function svg(size: number, rest: Omit<Props, "size">, children: ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

// P4 188: the chosen menu, as a page
export function IconFile({ size = 20, ...rest }: Props) {
  return svg(
    size,
    rest,
    <>
      <path d="M5 2.5h6.5L15 6v11.5H5z" />
      <path d="M11.5 2.5V6H15" />
    </>,
  );
}

// P4 179: "Add your menu" on the phone
export function IconUpload({ size = 20, ...rest }: Props) {
  return svg(size, rest, <path d="M10 13V3.5M6 7.5l4-4 4 4M3.5 12.5v3a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3" />);
}

// P4 348: "Share" on the phone
export function IconSharePhone({ size = 20, ...rest }: Props) {
  return svg(size, rest, <path d="M10 12.5V3M6.5 6.5 10 3l3.5 3.5M5 9.5H4v8h12v-8h-1" />);
}

// P4 344: "Add to calendar" on the phone
export function IconCalendarPhone({ size = 20, ...rest }: Props) {
  return svg(
    size,
    rest,
    <>
      <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" />
      <path d="M3 8.5h14M7 2.75v3.5M13 2.75v3.5" />
    </>,
  );
}
