import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/config";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "agnc. media · Full tables, from day one",
  description:
    "Social media for restaurants opening soon, by Nes & Gaby. Tell us about your place and we'll write your 30-day launch plan, free.",
  openGraph: {
    title: "Full tables, from day one",
    description: "Your free 30-day social media launch plan, from Nes & Gaby at agnc. media.",
    siteName: "agnc. media",
    locale: "en_GB",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#111110", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
