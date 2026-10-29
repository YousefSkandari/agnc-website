import "./globals.css";
import "@/components/shell/shell.css";
import "@/components/offer/offer.css";
import "@/components/form/form.css";
import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import { site } from "@/lib/config";
import { MOTION_SCRIPT } from "@/lib/motion-script";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
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
  },
};

export const viewport: Viewport = { themeColor: "#111110", width: "device-width", initialScale: 1, colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-motion is set by the head script before hydration, hence suppressHydrationWarning on <html> only
    <html lang="en-GB" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
