"use client";

// d2, The posts (D 278–364): the seven posts in launch order, then the photo row.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSectionRef } from "@/lib/client/sections";
import { useOverlay } from "@/lib/client/overlay";
import { useManagedVideo } from "@/lib/client/playback";
import { useCanHover, usePhone, useSaveData } from "@/lib/client/device";
import { useMotion } from "@/lib/client/motion";
import { DOORS_BEFORE, POSTS, type Post } from "@/content/posts";
import { photos, type Photo } from "@/lib/media";
import type { ReelId } from "@/lib/media";

function StripCard({
  post,
  index,
  live,
  onOpen,
  onHover,
}: {
  post: Post;
  index: number;
  live: boolean;
  onOpen: (i: number, el: HTMLElement) => void;
  onHover: (id: ReelId, on: boolean) => void;
}) {
  const v = useManagedVideo(`strip-${post.id}`, { active: live, postId: post.id });
  const doors = post.id === DOORS_BEFORE;
  return (
    <button
      type="button"
      className={`strip-card strip-rv${index > 0 ? ` strip-rv${index + 1}` : ""}`}
      data-post={post.id}
      aria-label={post.stripLabel}
      onClick={(e) => onOpen(index, e.currentTarget)}
      onMouseEnter={() => onHover(post.id, true)}
      onMouseLeave={() => onHover(post.id, false)}
    >
      {post.stripWhen && <span className={`strip-when${doors ? " is-doors" : ""}`}>{post.stripWhen}</span>}
      <span className="strip-job">{post.stripJob}</span>
      <span className="strip-poster">
        <img src={post.reel.poster} alt="" loading="lazy" width={160} height={284} />
        {live && (
          <span className="strip-live">
            <video
              ref={v.ref}
              src={post.reel.video}
              poster={post.reel.poster}
              muted
              loop
              playsInline
              preload="auto"
              aria-label={post.reel.label}
            />
          </span>
        )}
      </span>
    </button>
  );
}

function PhotoFig({ photo, caption, cls }: { photo: Photo; caption: string; cls: string }) {
  return (
    <figure className={`photos-fig ${cls}`}>
      <img src={photo.src} alt={photo.alt} loading="lazy" width={photo.width} height={photo.height} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function ThePosts() {
  const ref = useSectionRef("d2");
  const { state, openReels } = useOverlay();
  const [motion] = useMotion();
  const saveData = useSaveData();
  const canHover = useCanHover();
  const phone = usePhone();
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [hoverId, setHoverId] = useState<ReelId | null>(null);
  const [centreId, setCentreId] = useState<ReelId | null>(null);
  const allowed = motion && !saveData && state.kind === "none";

  // Phone: the card in the middle of the strip is live (D 1416–1429). That observer's root is the strip, so it would
  // report a centred card even with the strip off screen; a second observer keeps it to while the strip is on screen
  // (otherwise the strip's video would start out of sight and stop the hero).
  const [stripOnScreen, setStripOnScreen] = useState(false);
  useEffect(() => {
    const strip = stripRef.current;
    if (!phone || !strip || typeof IntersectionObserver === "undefined") {
      setCentreId(null);
      setStripOnScreen(false);
      return;
    }
    const seen = new IntersectionObserver(([en]) => setStripOnScreen(en.isIntersecting), { threshold: 0.25 });
    seen.observe(strip);
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const id = en.target.getAttribute("data-post") as ReelId | null;
          if (!id) continue;
          if (en.isIntersecting) setCentreId(id);
          else setCentreId((c) => (c === id ? null : c));
        }
      },
      { root: strip, rootMargin: "0px -45% 0px -45%", threshold: 0 },
    );
    strip.querySelectorAll("[data-post]").forEach((c) => io.observe(c));
    return () => {
      io.disconnect();
      seen.disconnect();
    };
  }, [phone]);

  const onHover = (id: ReelId, on: boolean) => {
    if (on) {
      if (canHover && motion && !saveData) setHoverId(id);
    } else setHoverId((h) => (h === id ? null : h));
  };

  const open = (i: number, el: HTMLElement) => {
    setHoverId(null);
    openReels(i, el);
  };

  return (
    <section id="d2" ref={ref} className="d2sec" aria-labelledby="d2-h">
      <div className="wrap">
        <p className="kicker">THE POSTS</p>
        <h2 id="d2-h" className="h2">
          Seven posts. Each one has a job.
        </h2>
        <p className="lead">In the order we’d post them around your opening.</p>

        <div className="strip" ref={stripRef}>
          {POSTS.map((p, i) => (
            <StripCardSlot key={p.id} doors={p.id === DOORS_BEFORE}>
              <StripCard
                post={p}
                index={i}
                live={allowed && (hoverId === p.id || (phone && stripOnScreen && centreId === p.id))}
                onOpen={open}
                onHover={onHover}
              />
            </StripCardSlot>
          ))}
        </div>

        <div className="strip-all">
          <button type="button" className="sec" onClick={(e) => openReels(0, e.currentTarget)}>
            Watch all seven like a customer would
          </button>
        </div>

        <div className="photos">
          <PhotoFig photo={photos.spread} caption="FEED" cls="photos-spread" />
          <PhotoFig photo={photos.mezze} caption="STORY" cls="photos-mezze" />
          <PhotoFig photo={photos.wraps} caption="STORY" cls="photos-wraps" />
          <PhotoFig photo={photos.labneh} caption="CAROUSEL" cls="photos-labneh" />
        </div>
      </div>
    </section>
  );
}

// The gold doors divider sits straight before the opening-day card (D 322)
function StripCardSlot({ doors, children }: { doors: boolean; children: ReactNode }) {
  return (
    <>
      {doors && <span className="strip-doors" aria-hidden="true" />}
      {children}
    </>
  );
}
