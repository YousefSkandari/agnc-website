"use client";

// PACKAGE A. Stub from the scaffold: replace with the full header (PORT-PLAN.md, A1).
// variant "home": the sticky two-row header on the home page, nav cells are #anchors with progress.
// variant "page": /privacy and /plan; nav cells link to /#dN, the CTA links to /plan, phone shows row A only.
import { SECTIONS } from "@/lib/sections";
import { brand } from "@/lib/media";
import PlanButton from "@/components/ui/PlanButton";
import { useActiveSection } from "@/lib/client/sections";

export type HeaderProps = { variant?: "home" | "page" };

export default function Header({ variant = "home" }: HeaderProps) {
  const { id: active } = useActiveSection();
  const base = variant === "home" ? "" : "/";
  return (
    <header className="hdr">
      <div className="wrap hdr-row">
        <a href={`${base}#d1`} className="hdr-logo">
          <img src={brand.logo.src} alt={brand.logo.alt} width={96} height={23} />
        </a>
        {variant === "home" ? <PlanButton size={44} /> : <a className="pill pill-44" href="/plan">Get your free launch plan</a>}
      </div>
      <nav aria-label="Sections" className="wrap hdr-nav">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`${base}#${s.id}`} aria-current={variant === "home" && active === s.id ? "true" : undefined}>
            {s.nav}
          </a>
        ))}
      </nav>
    </header>
  );
}
