// PACKAGE A. The footer (D 705–712, PORT-PLAN 1.11). Server component.
// Each contact becomes a link only once it has a real address; until then the placeholder shows as plain text.
import { Fragment } from "react";
import { site } from "@/lib/config";
import { brand } from "@/lib/media";
import { emailHref, instagramHref, whatsappHref } from "@/lib/links";

export default function Footer() {
  const contacts: { text: string; href: string | null; external?: boolean }[] = [
    { text: site.email, href: emailHref() },
    { text: site.whatsapp, href: whatsappHref(), external: true },
    { text: site.instagram, href: instagramHref(), external: true },
    { text: site.companyNumber, href: null },
  ];
  return (
    <footer className="ftr">
      <img className="ftr-outline" src={brand.outline.src} alt="" aria-hidden="true" width={1360} height={321} />
      <div className="wrap ftr-wrap">
        <img className="ftr-logo" src={brand.logo.src} alt={brand.logo.alt} width={96} height={23} />
        <p className="ftr-line">Every photo and video on this page is our own work.</p>
        <p className="ftr-contacts">
          {contacts.map((c, i) => (
            <Fragment key={i}>
              {i > 0 && " · "}
              {c.href ? (
                <a href={c.href} {...(c.external ? { target: "_blank", rel: "noopener" } : {})}>
                  {c.text}
                </a>
              ) : (
                c.text
              )}
            </Fragment>
          ))}
        </p>
        <p className="ftr-privacy">
          <a href="/privacy">Privacy notice</a>
        </p>
      </div>
    </footer>
  );
}
