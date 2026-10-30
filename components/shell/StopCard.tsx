"use client";

// "Your longest stop" (D 828–833, 870–875; P2 57–70), timed by lib/client/playback.tsx.
// Held in memory only: nothing is sent or stored.
import { useLongestStop } from "@/lib/client/playback";
import { useCoarsePointer } from "@/lib/client/device";
import { POSTS } from "@/content/posts";

export type StopView = {
  has: boolean;
  label: string;
  figure: string;
  body: "none" | "short" | "timed";
};

export function useStopView(): StopView {
  const stop = useLongestStop();
  if (!stop) return { has: false, label: "YOUR LONGEST STOP", figure: "—", body: "none" };
  const post = POSTS.find((p) => p.id === stop.postId);
  const t = post ? post.title.toUpperCase() : "";
  return {
    has: true,
    label: `YOUR LONGEST STOP${t ? ` · ${t}` : ""}`,
    figure: `${stop.seconds.toFixed(1)} s`,
    body: stop.seconds < 2 ? "short" : "timed",
  };
}

const BODY = {
  none: "Watch any post and we’ll time your stop.",
  short: "You flew past. That’s why every post we make opens on its strongest second.",
  timed: "That stop is what gets a restaurant found.",
} as const;

// variant: "rail" (desktop right side), "end" (desktop end card), "phone" (phone end card)
export default function StopCard({ variant }: { variant: "rail" | "end" | "phone" }) {
  const v = useStopView();
  const coarse = useCoarsePointer();
  return (
    <div className={`paper stop stop-${variant}`} aria-live="polite">
      <p className="stop-label">{v.label}</p>
      <p className="stop-fig">{v.figure}</p>
      <p className="stop-body">{BODY[v.body]}</p>
      <p className="stop-foot">
        {coarse ? "TIMED ON YOUR PHONE. NOTHING IS SENT OR STORED." : "TIMED ON THIS COMPUTER. NOTHING IS SENT OR STORED."}
      </p>
    </div>
  );
}
