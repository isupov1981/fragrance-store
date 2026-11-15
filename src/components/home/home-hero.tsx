"use client";

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { SITE_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_E164 } from "@/lib/seo/site";
import { usePrefersReducedMotion } from "./reveal";

const HERO_CLIPS = [
  {
    src: "/videos/hero/anfas-ishq.mp4",
    poster: "/videos/hero/anfas-ishq-poster.jpg",
  },
  {
    src: "/videos/hero/notre-dame.mp4",
    poster: "/videos/hero/notre-dame-poster.jpg",
  },
  {
    src: "/videos/hero/rabbit.mp4",
    poster: "/videos/hero/rabbit-poster.jpg",
  },
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
  const sectionRef = useRef<HTMLElement>(null);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const fadingRef = useRef(false);
  const showARef = useRef(true);
  const aIndexRef = useRef(0);
  const bIndexRef = useRef(1 % HERO_CLIPS.length);
  const [aIndex, setAIndex] = useState(0);
  const [bIndex, setBIndex] = useState(1 % HERO_CLIPS.length);
  const [showA, setShowA] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [bArmed, setBArmed] = useState(false);

  const beginCrossfade = useCallback(() => {
    if (reduced || HERO_CLIPS.length < 2 || fadingRef.current) return;
    fadingRef.current = true;
    setBArmed(true);

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
    if (reduced) return;
    const node = sectionRef.current;
    if (!node) return;

    let cancelled = false;
    const arm = () => {
      if (!cancelled) setVideoReady(true);
    };

    if (typeof IntersectionObserver === "undefined") {
      arm();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          arm();
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) {
      aRef.current?.pause();
      bRef.current?.pause();
      if (aRef.current) aRef.current.currentTime = 0;
      return;
    }
    if (!videoReady) return;
    playMuted(showA ? aRef.current : bRef.current);
  }, [reduced, showA, videoReady]);

  const onTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (!video.duration || !Number.isFinite(video.duration)) return;
    if (video.duration - video.currentTime <= CROSSFADE_MS / 1000) {
      beginCrossfade();
    }
  };

  const activePoster = HERO_CLIPS[showA ? aIndex : bIndex].poster;

  return (
    <section
      ref={sectionRef}
      className="home-hero relative isolate min-h-svh overflow-hidden bg-ink text-ivory"
      aria-label={dict.home.heroAlt}
    >
      <p className="sr-only">{dict.home.heroAlt}</p>
      <div className="home-hero-media absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- poster is the LCP paint; video loads after idle */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_CLIPS[0].poster}
          alt=""
          width={1280}
          height={720}
          fetchPriority="high"
          decoding="async"
          aria-hidden="true"
        />
        {!reduced && videoReady ? (
          <>
            <video
              ref={aRef}
              className={`home-hero-video absolute inset-0 h-full w-full object-cover ${showA ? "is-active" : ""}`}
              src={HERO_CLIPS[aIndex].src}
              poster={HERO_CLIPS[aIndex].poster}
              autoPlay={showA}
              muted
              loop={HERO_CLIPS.length < 2}
              playsInline
              preload="metadata"
              aria-hidden="true"
              onTimeUpdate={showA ? onTimeUpdate : undefined}
              onEnded={showA ? beginCrossfade : undefined}
            />
            {HERO_CLIPS.length > 1 && bArmed ? (
              <video
                ref={bRef}
                className={`home-hero-video absolute inset-0 h-full w-full object-cover ${showA ? "" : "is-active"}`}
                src={HERO_CLIPS[bIndex].src}
                poster={HERO_CLIPS[bIndex].poster || activePoster}
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
                onTimeUpdate={showA ? undefined : onTimeUpdate}
                onEnded={showA ? undefined : beginCrossfade}
              />
            ) : null}
          </>
        ) : null}
      </div>
      <div className="home-hero-veil home-hero-veil--video pointer-events-none absolute inset-0 z-[1]" />
      <div className="relative z-[2] flex min-h-svh items-end justify-center px-6 pb-16 text-center sm:pb-20 lg:pb-24">
        <div className="max-w-3xl">
          <p className="eyebrow mb-4 text-ivory/85">{dict.home.heroEyebrow}</p>
          <h1 className="font-display text-4xl leading-[1.05] text-ivory sm:text-5xl lg:text-6xl">
            The Perfume Room
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-ivory/90 sm:text-base">
            {dict.home.heroTitle} {dict.home.heroEm} {dict.home.heroRest} {dict.home.heroCopy}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LocaleLink
              className="inline-flex h-13 items-center bg-ivory px-7 text-[11px] font-semibold uppercase tracking-[0.17em] text-ink transition hover:bg-sand"
              href="/collections/all"
            >
              {dict.home.explore}
            </LocaleLink>
            <LocaleLink
              className="inline-flex h-13 items-center border border-ivory/60 px-7 text-[11px] font-semibold uppercase tracking-[0.17em] transition hover:bg-ivory hover:text-ink"
              href="/about"
            >
              {dict.home.findYours}
            </LocaleLink>
          </div>
          <p className="mt-6 text-xs tracking-[0.04em] text-ivory/85">
            <a className="underline-offset-2 hover:underline" href={`mailto:${SITE_EMAIL}`}>
              {SITE_EMAIL}
            </a>
            <span aria-hidden="true"> · </span>
            <a className="underline-offset-2 hover:underline" href={`tel:${SITE_PHONE_E164}`}>
              {SITE_PHONE_DISPLAY}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
