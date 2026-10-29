// The home page. Each part belongs to one build package (see PORT-PLAN.md):
//   A (components/shell): Header, WhatWeDo d1, ThePosts d2, NesGaby d7, YourPlan d8, Footer, BottomBar, MenuSheet,
//     ReelViewer
//   B (components/offer): Calendar d4, HowItWorks d5
//   C (components/form): PlanOverlay
import Footer from "@/components/shell/Footer";
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

export default function Home() {
  return (
    <>
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
