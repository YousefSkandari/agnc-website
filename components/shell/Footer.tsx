// PACKAGE A. Stub from the scaffold: replace with the footer (PORT-PLAN.md, A9). Server component.
import { site } from "@/lib/config";
import { brand } from "@/lib/media";

export default function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <img src={brand.logo.src} alt={brand.logo.alt} width={96} height={23} />
        <p>Every photo and video on this page is our own work.</p>
        <p className="mono">
          {site.email} · {site.whatsapp} · {site.instagram} · {site.companyNumber}
        </p>
        <a href="/privacy">Privacy notice</a>
      </div>
    </footer>
  );
}
