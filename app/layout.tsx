import "./globals.css";
import "@/components/shell/shell.css";
import "@/components/offer/offer.css";
import "@/components/form/form.css";
import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import { site } from "@/lib/config";
import { heroReel } from "@/lib/media";
import { MOTION_SCRIPT, SWITCH_SCRIPT } from "@/lib/motion-script";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
// Inter is a variable font: one file covers the 400, 500 and 600 weights the design uses. (Listing the weights makes
// Google serve static instances that next/font cannot download.)
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

// The Agency Test: the title and description say what we are (a social media marketing agency), who for
// (restaurants) and what to do next (the free launch plan), in the page's own words.
const description =
  "We’re a social media marketing agency for restaurants. We plan, film and post, so people find you and come in. Start with a free 30-day launch plan.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "agnc. media · Social media marketing for restaurants",
  description,
  openGraph: {
    title: "agnc. media · Full tables, from day one.",
    description,
    siteName: site.name,
    locale: "en_GB",
    type: "website",
    // Our own work: the hero post's poster (opening day at Beirut Station), for links shared by WhatsApp and the like
    images: [{ url: heroReel.poster, width: 576, height: 1024, alt: heroReel.label }],
  },
  twitter: { card: "summary_large_image" },
};

// viewport-fit=cover (D 5), so env(safe-area-inset-bottom) reaches the phone bar and the room left under the footer
export const viewport: Viewport = {
  themeColor: "#111110",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-motion is set by the head script before hydration, hence suppressHydrationWarning on <html> only
    <html lang="en-GB" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <script dangerouslySetInnerHTML={{ __html: SWITCH_SCRIPT }} />
      </body>
    </html>
  );
}
