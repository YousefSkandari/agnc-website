"use client";

import type { ReactNode } from "react";
import { OpeningProvider } from "@/lib/client/opening";
import { OverlayProvider } from "@/lib/client/overlay";
import { PlaybackProvider } from "@/lib/client/playback";
import { SectionsProvider } from "@/lib/client/sections";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <OverlayProvider>
      <PlaybackProvider>
        <OpeningProvider>
          <SectionsProvider>{children}</SectionsProvider>
        </OpeningProvider>
      </PlaybackProvider>
    </OverlayProvider>
  );
}
