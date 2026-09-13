"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { usePrefersReducedMotion } from "./reveal";

const frames = [
  {
    src: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=2400&q=90",
    position: "object-[58%_center]",
  },
  {
    src: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=2400&q=90",
    position: "object-[center_40%]",
  },
  {
    src: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=2400&q=90",
    position: "object-center",
  },
];

export function HomeHero() {
  const { dict } = useI18n();
  const mediaRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % frames.length);
    }, 11000);
    return () => window.clearInterval(timer);
  }, [reduced]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || reduced) return;

    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 18;
      const y = (event.clientY / window.innerHeight - 0.5) * 12;
      media.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.08)`;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <section className="home-hero relative isolate min-h-svh overflow-hidden bg-ink text-ivory" aria-labelledby="home-hero-heading">
      <div className="home-hero-media absolute -inset-8" ref={mediaRef}>
        {frames.map((item, index) => (
          <Image
            key={item.src}
            className={`home-hero-frame object-cover brightness-[1.08] contrast-[1.04] ${item.position} ${index === frame ? "is-active" : ""}`}
            src={item.src}
            alt=""
            fill
            sizes="100vw"
            priority={index === 0}
          />
        ))}
      </div>
      <div className="home-hero-veil pointer-events-none absolute inset-0" />
      <div className="home-hero-grain pointer-events-none absolute inset-0" />
      <div className="relative flex min-h-svh items-end justify-center px-6 pb-16 text-center sm:pb-20 lg:pb-24">
        <div className="home-hero-copy max-w-3xl">
          <p className="eyebrow mb-5 text-ivory/70">{dict.home.heroEyebrow}</p>
          <div className="hero-crop">
            <h1 className="hero-copy-line font-display text-[3.35rem] leading-[.88] tracking-[-0.035em] sm:text-7xl lg:text-[6.35rem]" id="home-hero-heading">
              {dict.home.heroTitle} <em className="font-normal">{dict.home.heroEm}</em> {dict.home.heroRest}
            </h1>
          </div>
          <div className="hero-crop">
            <p className="hero-copy-line hero-copy-line-delay mx-auto mt-6 max-w-md text-sm leading-7 text-ivory/78 sm:text-base">
              {dict.home.heroCopy}
            </p>
          </div>
          <div className="hero-crop">
            <div className="hero-copy-line hero-copy-line-delay-2 mt-9 flex flex-wrap justify-center gap-3">
              <LocaleLink className="inline-flex h-13 items-center bg-ivory px-7 text-[11px] font-semibold uppercase tracking-[0.17em] text-ink transition hover:bg-sand" href="/collections/all">
                {dict.home.explore}
              </LocaleLink>
              <LocaleLink className="inline-flex h-13 items-center border border-ivory/50 px-7 text-[11px] font-semibold uppercase tracking-[0.17em] transition hover:bg-ivory hover:text-ink" href="/about">
                {dict.home.findYours}
              </LocaleLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
