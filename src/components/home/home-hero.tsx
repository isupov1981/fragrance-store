"use client";

import { useEffect, useRef } from "react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { usePrefersReducedMotion } from "./reveal";

const HERO_VIDEO_SRC = "/videos/logo.mp4";

export function HomeHero() {
  const { dict } = useI18n();
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
      className="home-hero relative isolate min-h-svh overflow-hidden bg-ink text-ivory"
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
      <div className="relative flex min-h-svh items-end justify-center px-6 pb-16 text-center sm:pb-20 lg:pb-24">
        <div className="flex flex-wrap justify-center gap-3">
          <LocaleLink
            className="inline-flex h-13 items-center bg-ivory px-7 text-[11px] font-semibold uppercase tracking-[0.17em] text-ink transition hover:bg-sand"
            href="/collections/all"
          >
            {dict.home.explore}
          </LocaleLink>
          <LocaleLink
            className="inline-flex h-13 items-center border border-ivory/50 px-7 text-[11px] font-semibold uppercase tracking-[0.17em] transition hover:bg-ivory hover:text-ink"
            href="/about"
          >
            {dict.home.findYours}
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}
