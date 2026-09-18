"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./reveal";

const HERO_VIDEO_SRC = "/videos/logo.mp4";

export function HomeHero() {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const videos = videoRefs.current.filter(Boolean) as HTMLVideoElement[];

    for (const video of videos) {
      if (reduced) {
        video.pause();
        video.currentTime = 0;
        continue;
      }

      video.muted = true;
      const play = video.play();
      if (play && typeof play.catch === "function") {
        play.catch(() => {
          /* Autoplay can be blocked; muted + playsInline usually succeeds. */
        });
      }
    }
  }, [reduced]);

  function setVideoRef(index: number) {
    return (node: HTMLVideoElement | null) => {
      videoRefs.current[index] = node;
    };
  }

  return (
    <section
      className="home-hero relative isolate min-h-svh overflow-hidden bg-ink"
      aria-label="The Perfume Room"
    >
      <div className="home-hero-media absolute inset-0">
        <video
          ref={setVideoRef(0)}
          className="home-hero-video home-hero-video--backdrop absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO_SRC}
          autoPlay={!reduced}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <video
          ref={setVideoRef(1)}
          className="home-hero-video home-hero-video--focus absolute inset-0 h-full w-full object-contain"
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
