"use client";

// PACKAGE A. d7, Nes & Gaby (D 666–692, PORT-PLAN 1.9). A client component only for the section ref; the clip
// reveal on the photos is CSS (scroll-driven, motion only).
import { useSectionRef } from "@/lib/client/sections";
import { photos } from "@/lib/media";
import { team } from "@/lib/config";

export default function NesGaby() {
  const ref = useSectionRef("d7");
  const people = [
    { p: photos.nes, name: team.nes.name, role: team.nes.role, cls: "founder-clip" },
    { p: photos.gaby, name: team.gaby.name, role: team.gaby.role, cls: "founder-clip founder-clip2" },
  ];
  return (
    <section id="d7" ref={ref} className="d7sec" aria-labelledby="d7-h">
      <div className="wrap">
        <div className="d7-grid">
          <div className="founders">
            {people.map(({ p, name, role, cls }) => (
              <figure key={p.id} className="founder">
                <img className={cls} src={p.src} alt={p.alt} loading="lazy" width={p.width} height={p.height} />
                <figcaption>
                  <span className="founder-name">{name}</span>
                  <span className="founder-role">{role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="d7-copy">
            <p className="kicker">NES &amp; GABY</p>
            <h2 id="d7-h" className="h2">
              You’ll work with us.
            </h2>
            <p className="d7-lead">Two people, for every kind of restaurant. We come to you, anywhere in the UK.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
