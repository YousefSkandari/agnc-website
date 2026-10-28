"use client";

import { useEffect, useRef } from "react";
import type { WorkItem } from "@/content/work";

const isVideo = (src?: string) => !!src && /\.(mp4|webm|mov)$/i.test(src);

// One piece of work: a looping silent video, a photo, or a placeholder until the real file is in. Videos only play
// while on screen, and not at all for people who ask their device for less motion.
export default function Media({ item, className = "", style, showCaption = true, play = false }: {
  item: WorkItem;
  className?: string;
  style?: React.CSSProperties;
  showCaption?: boolean;
  play?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <figure className={`media ${className}`} style={{ aspectRatio: item.aspect, ...style }}>
      {isVideo(item.src) ? (
        <video ref={ref} src={item.src} poster={item.poster} muted loop playsInline preload="metadata" aria-label={`${item.caption}, ${item.client}`} />
      ) : item.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.src} alt={`${item.caption}, ${item.client}`} loading="lazy" />
      ) : null}
      <span className="tag">{item.label}</span>
      {play && !item.src && (
        <span className="play" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F3EEE4" strokeWidth="1.5" strokeLinejoin="round"><path d="M8 5v14l11-7z" /></svg>
        </span>
      )}
      {showCaption && (
        <figcaption className="cap">
          <span className="serif">{item.client}</span>
          <small>{item.caption}</small>
        </figcaption>
      )}
    </figure>
  );
}
