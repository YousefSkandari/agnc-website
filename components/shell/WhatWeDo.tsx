/// <reference types="react-dom/canary" />
"use client";

// d1, What we do: the hero (D 223–276; phone P1).
import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import PlanButton from "@/components/ui/PlanButton";
import { IconOut, IconPause, IconPlay } from "@/components/ui/icons";
import { useSectionRef } from "@/lib/client/sections";
import { useOverlay } from "@/lib/client/overlay";
import { useManagedVideo } from "@/lib/client/playback";
import { useMounted, useSaveData } from "@/lib/client/device";
import { brand, heroReel } from "@/lib/media";
import { client } from "@/lib/config";
import { clientInstagramHref } from "@/lib/links";
import { usePillSignal } from "./barSignals";
import { setFill } from "./fill";

export default function WhatWeDo() {
  // The poster is the page's largest image: ask for it first
  preload(heroReel.poster, { as: "image", fetchPriority: "high" });

  const sectionRef = useSectionRef("d1");
  const pillRef = usePillSignal("d1");
  const { state, openReels } = useOverlay();
  const saveData = useSaveData();
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const postRef = useRef<HTMLDivElement | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  // Becomes true on the first `playing` and stays: the video then covers the poster (D heroLive)
  const [live, setLive] = useState(false);

  const onProgress = useCallback((p: number) => setFill(fillRef.current, p), []);
  const hero = useManagedVideo("hero", {
    active: state.kind === "none" && onScreen,
    postId: "opening",
    onProgress,
  });

  useEffect(() => {
    if (hero.playing) setLive(true);
  }, [hero.playing]);

  useEffect(() => {
    const el = postRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const io = new IntersectionObserver(([en]) => setOnScreen(en.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // D 2006–2009: the gold chip shows while the post is not playing and it will not start by itself. Until hydration
  // the motion setting is only known to CSS (html[data-motion]), so both controls are in the HTML and CSS shows one.
  const mounted = useMounted();
  const chip: boolean | null = mounted ? !hero.playing && (!hero.autoplay || hero.refused) : null;
  const chipTap = hero.refused || saveData;
  const igHref = clientInstagramHref();

  return (
    <section id="d1" ref={sectionRef} className="d1sec" aria-label="What we do">
      <img className="dt-only d1-outline" src={brand.outline.src} alt="" aria-hidden="true" width={1360} height={321} />
      <div className="wrap d1-wrap">
        <div className="d1">
          <div className="d1-left">
            <div className="d1-top">
              <div className="ph-only d1-phtop">
                <span className="d1-phlogo">
                  <img src={brand.logo.src} alt={brand.logo.alt} width={84} height={20} />
                </span>
                <span className="d1-phcap">OUR CLIENT · BEIRUT STATION, EGHAM · OPENING DAY</span>
              </div>
              <p className="d1-kick d1-plsm">SOCIAL MEDIA MARKETING FOR RESTAURANTS</p>
              <h1 className="d1-h1">
                <span className="d1-pl d1-pl1">Full tables,</span>
                <br />
                <span className="d1-pl d1-pl2">from day one.</span>
              </h1>
              <p className="d1-line">
                <span className="d1-pl">
                  We’re a social media marketing agency for restaurants. We plan, film and post, so people find you and come
                  in.
                </span>
              </p>
              <div className="d1-pillwrap">
                <PlanButton ref={pillRef} className="d1-pill" />
              </div>
              <p className="d1-free d1-plsm">FREE · YOURS TO KEEP · ABOUT 5 MINUTES</p>
            </div>
            <div className="d1-proof">
              <p className="d1-proof-q">Opening day, queue round the block.</p>
              <p className="d1-proof-l">
                {igHref ? (
                  <a href={igHref} target="_blank" rel="noopener" className="ulink d1-ig">
                    {client.name} on Instagram
                    <IconOut size={16} />
                  </a>
                ) : (
                  <span className="d1-ig d1-ig-text">{client.name} on Instagram</span>
                )}
              </p>
            </div>
          </div>

          <div className="d1-post" ref={postRef}>
            <img
              className="d1-poster"
              src={heroReel.poster}
              alt={live ? "" : heroReel.label}
              width={heroReel.width}
              height={heroReel.height}
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
            <div className={`d1-vwrap${live ? " is-live" : ""}`}>
              <video
                ref={hero.ref}
                className="d1-video"
                src={heroReel.video}
                poster={heroReel.poster}
                muted
                loop
                playsInline
                preload={hero.autoplay ? "metadata" : "none"}
                aria-label={heroReel.label}
              />
            </div>
            <button
              type="button"
              className="d1-open"
              aria-label="Watch our restaurant posts full screen"
              onClick={(e) => openReels(0, e.currentTarget)}
            />
            <div className="d1-topzone" aria-hidden="true">
              <div className="d1-bar">
                <div className="d1-track">
                  <span className="d1-fill" ref={fillRef} />
                </div>
              </div>
              <p className="d1-cap">
                <span>OUR CLIENT · BEIRUT STATION, EGHAM</span>
              </p>
            </div>
            {chip !== true && (
              <button
                type="button"
                className={`d1-pause${chip === null ? " mo-only-on" : ""}`}
                aria-label={hero.playing ? "Pause the post" : "Play the post"}
                onClick={hero.toggle}
              >
                {hero.playing ? <IconPause size={20} /> : <IconPlay size={20} />}
              </button>
            )}
            {chip !== false && (
              <button type="button" className={`d1-chip${chip === null ? " mo-only-off" : ""}`} onClick={hero.play}>
                <IconPlay size={18} />
                {chipTap ? "Tap to play" : "Play the post"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
