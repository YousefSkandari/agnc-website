import Link from "next/link";
import { site } from "@/lib/config";

export function SiteHeader({ home = false }: { home?: boolean }) {
  const at = (hash: string) => (home ? hash : `/${hash}`);
  return (
    <header className="wrap site-header">
      <Link href="/" aria-label="agnc. media home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/agnc-logo.svg" alt="agnc. media" width={161} height={38} />
      </Link>
      <nav aria-label="Main">
        <a href={at("#work")}>Work</a>
        <a href={at("#plan")}>The plan</a>
        <a href={at("#how")}>How it works</a>
        <a href={at("#us")}>Nes &amp; Gaby</a>
        <Link className="pill" href="/plan">Get your free plan</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/agnc-logo.svg" alt="agnc. media" width={127} height={30} style={{ height: 30, width: "auto" }} />
        <div className="links">
          <a href={site.whatsappLink}>WhatsApp {site.whatsapp}</a>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={site.instagramLink}>{site.instagram}</a>
          <Link href="/privacy">Privacy notice</Link>
          <span className="muted">© {new Date().getFullYear()} agnc. media</span>
        </div>
      </div>
    </footer>
  );
}
