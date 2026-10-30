"use client";

// The sticky two-row header (D 177–219).
// variant "home": nav cells are #anchors with section progress and aria-current; JS scrolls smoothly when motion is on.
// variant "page": /privacy and the like; cells link to /#dN, the CTA links to /plan, phone shows row A only.
import type { MouseEvent } from "react";
import { SECTIONS, type SectionId } from "@/lib/sections";
import { brand } from "@/lib/media";
import PlanButton, { PLAN_LABEL } from "@/components/ui/PlanButton";
import { scrollToSection, useActiveSection } from "@/lib/client/sections";

export type HeaderProps = { variant?: "home" | "page" };

export default function Header({ variant = "home" }: HeaderProps) {
  const { index } = useActiveSection();
  const home = variant === "home";
  const base = home ? "" : "/";

  const go = (id: SectionId) => (e: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle new-tab and new-window clicks
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <header className={`hdr ${home ? "hdr-home" : "hdr-page"}`}>
      <div className="wrap">
        <div className="hdr-row">
          <div className="hdr-left">
            <a href={home ? "#d1" : "/"} className="hdr-logo" onClick={home ? go("d1") : undefined}>
              <img src={brand.logo.src} alt={brand.logo.alt} width={96} height={23} />
            </a>
            <span className="hdr-desc">SOCIAL MEDIA MARKETING FOR RESTAURANTS</span>
          </div>
          <div className="hdr-right">
            {home ? (
              <PlanButton size={44} />
            ) : (
              <a className="pill pill-44" href="/plan">
                {PLAN_LABEL}
              </a>
            )}
          </div>
        </div>
        <nav aria-label="Sections" className="hdr-nav">
          {SECTIONS.map((s, i) => {
            const current = home && i === index;
            // Without scroll timelines: the current cell and every one before it are full (D 2002). The page
            // variant has no sections, so its cells stay empty.
            const fill = home && i <= index ? 1 : 0;
            return (
              <a
                key={s.id}
                href={`${base}#${s.id}`}
                className="hdr-cell"
                aria-current={current ? "true" : undefined}
                onClick={home ? go(s.id) : undefined}
              >
                <span className="hdr-lab">
                  {s.nav === s.navShort ? (
                    s.nav
                  ) : (
                    <>
                      <span className="hdr-long">{s.nav}</span>
                      <span className="hdr-short">{s.navShort}</span>
                    </>
                  )}
                </span>
                <span className="hdr-track">
                  <span className={home ? `hdr-fill hdr-fill-${s.id}` : "hdr-fill"} style={{ transform: `scaleX(${fill})` }} />
                </span>
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
