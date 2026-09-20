"use client";

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { usePrefersReducedMotion } from "./reveal";

const HERO_CLIPS = [
  "/videos/hero/anfas-ishq.mp4",
  "/videos/hero/notre-dame.mp4",
  "/videos/hero/rabbit.mp4",
] as const;

const CROSSFADE_MS = 1800;

function playMuted(video: HTMLVideoElement | null) {
  if (!video) return;
  video.muted = true;
  const play = video.play();
  if (play && typeof play.catch === "function") {
    play.catch(() => {
      /* Autoplay can be blocked; muted + playsInline usually succeeds. */
    });
  }
}

export function HomeHero() {
  const { dict } = useI18n();
  const reduced = usePrefersReducedMotion();
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const fadingRef = useRef(false);
  const showARef = useRef(true);
  const aIndexRef = useRef(0);
  const bIndexRef = useRef(1 % HERO_CLIPS.length);
  const [aIndex, setAIndex] = useState(0);
  const [bIndex, setBIndex] = useState(1 % HERO_CLIPS.length);
  const [showA, setShowA] = useState(true);

  const beginCrossfade = useCallback(() => {
    if (reduced || HERO_CLIPS.length < 2 || fadingRef.current) return;
    fadingRef.current = true;

    if (showARef.current) {
      const incoming = bRef.current;
      if (incoming) {
        try {
          incoming.currentTime = 0;
        } catch {
          /* Seeking can fail before metadata is ready. */
        }
        playMuted(incoming);
      }
      showARef.current = false;
      setShowA(false);
      window.setTimeout(() => {
        aRef.current?.pause();
        const next = (bIndexRef.current + 1) % HERO_CLIPS.length;
        aIndexRef.current = next;
        setAIndex(next);
        fadingRef.current = false;
      }, CROSSFADE_MS);
      return;
    }

    const incoming = aRef.current;
    if (incoming) {
      try {
        incoming.currentTime = 0;
      } catch {
        /* Seeking can fail before metadata is ready. */
      }
      playMuted(incoming);
    }
    showARef.current = true;
    setShowA(true);
    window.setTimeout(() => {
      bRef.current?.pause();
      const next = (aIndexRef.current + 1) % HERO_CLIPS.length;
      bIndexRef.current = next;
      setBIndex(next);
      fadingRef.current = false;
    }, CROSSFADE_MS);
  }, [reduced]);

  useEffect(() => {
    if (reduced) {
      aRef.current?.pause();
      bRef.current?.pause();
      if (aRef.current) aRef.current.currentTime = 0;
      return;
    }
    playMuted(showA ? aRef.current : bRef.current);
  }, [reduced, showA]);

  const onTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (!video.duration || !Number.isFinite(video.duration)) return;
    if (video.duration - video.currentTime <= CROSSFADE_MS / 1000) {
      beginCrossfade();
    }
  };

  return (
    <section
      className="home-hero relative isolate min-h-svh overflow-hidden bg-ink text-ivory"
      aria-label="The Perfume Room"
    >
      <div className="home-hero-media absolute inset-0 z-0">
        <video
          ref={aRef}
          className={`home-hero-video absolute inset-0 h-full w-full object-cover ${showA ? "is-active" : ""}`}
          src={HERO_CLIPS[aIndex]}
          autoPlay={!reduced && showA}
          muted
          loop={HERO_CLIPS.length < 2}
          playsInline
          preload="auto"
          aria-hidden="true"
          onTimeUpdate={showA ? onTimeUpdate : undefined}
          onEnded={showA ? beginCrossfade : undefined}
        />
        {HERO_CLIPS.length > 1 ? (
          <video
            ref={bRef}
            className={`home-hero-video absolute inset-0 h-full w-full object-cover ${showA ? "" : "is-active"}`}
            src={HERO_CLIPS[bIndex]}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            onTimeUpdate={showA ? undefined : onTimeUpdate}
            onEnded={showA ? undefined : beginCrossfade}
          />
        ) : null}
      </div>
      <div className="home-hero-veil home-hero-veil--video pointer-events-none absolute inset-0 z-[1]" />
      <div className="relative z-[2] flex min-h-svh items-end justify-center px-6 pb-16 text-center sm:pb-20 lg:pb-24">
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
