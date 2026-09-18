"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./reveal";

const HERO_VIDEO_SRC = "/videos/logo.mp4";

export function HomeHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reduced) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    video.muted = true;
    const play = video.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {
        /* Autoplay can be blocked; muted + playsInline usually succeeds. */
      });
    }
  }, [reduced]);

  return (
    <section
      className="home-hero relative isolate min-h-svh overflow-hidden bg-ink"
      aria-label="The Perfume Room"
    >
      <div className="home-hero-media absolute inset-0">
        <video
          ref={videoRef}
          className="home-hero-video absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO_SRC}
          autoPlay={!reduced}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      </div>
      <div className="home-hero-veil home-hero-veil--video pointer-events-none absolute inset-0" />
    </section>
  );
}
