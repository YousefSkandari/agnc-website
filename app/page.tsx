// The home page, top to bottom: d1 What we do, d2 The posts, d4 Thirty days, d5 How it works, d7 Nes & Gaby, d8 Your
// plan. The menu sheet, reel viewer and plan form are overlays (lib/client/overlay.tsx), one open at a time. The
// loading screen comes first on a first visit (components/shell/Loader.tsx).
//   components/shell: the header, d1, d2, d7, d8, footer, phone bottom bar, menu sheet and reel viewer
//   components/offer: d4 and d5
//   components/form: the plan form (also /plan)
import Footer from "@/components/shell/Footer";
import Loader from "@/components/shell/Loader";
import Header from "@/components/shell/Header";
import WhatWeDo from "@/components/shell/WhatWeDo";
import ThePosts from "@/components/shell/ThePosts";
import NesGaby from "@/components/shell/NesGaby";
import YourPlan from "@/components/shell/YourPlan";
import BottomBar from "@/components/shell/BottomBar";
import MenuSheet from "@/components/shell/MenuSheet";
import ReelViewer from "@/components/shell/ReelViewer";
import Calendar from "@/components/offer/Calendar";
import HowItWorks from "@/components/offer/HowItWorks";
import PlanOverlay from "@/components/form/PlanOverlay";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Loader />
      <a className="skip" href="#main">
        Skip to the page
      </a>
      <Header variant="home" />
      <main id="main" tabIndex={-1}>
        <WhatWeDo />
        <ThePosts />
        <Calendar />
        <HowItWorks />
        <NesGaby />
        <YourPlan />
      </main>
      <Footer />
      <BottomBar />
      <MenuSheet />
      <ReelViewer />
      <PlanOverlay />
    </>
  );
}
