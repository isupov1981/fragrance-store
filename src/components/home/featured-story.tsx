"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./reveal";

const slides = [
  {
    id: "sol",
    kicker: "Meet the house",
    title: "Maison Sol",
    copy: "Warm resins and golden woods, composed to sit close to the skin. A quieter kind of presence that unfolds for hours.",
    href: "/collections/all?edit=featured",
    image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=2200&q=88",
    alt: "Amber perfume bottle in low atelier light",
  },
  {
    id: "nox",
    kicker: "Meet the house",
    title: "Atelier Nox",
    copy: "Mineral musks, fig leaf and night air. Modern compositions with a clean line and a memory that lingers after the room is empty.",
    href: "/about",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=2200&q=88",
    alt: "A contemporary fragrance bottle against dark botanicals",
  },
];

export function FeaturedStory() {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[index];

  useEffect(() => {
    if (reduced || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [paused, reduced]);

  return (
    <section className="shell pb-16 sm:pb-24" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <article className="relative overflow-hidden bg-ink text-ivory">
        <div className="relative aspect-[4/5] sm:aspect-[16/7]">
          {slides.map((item, slideIndex) => (
            <Image
              key={item.id}
              className={`story-frame object-cover ${slideIndex === index ? "is-active" : ""}`}
              src={item.image}
              alt={item.alt}
              fill
              sizes="100vw"
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,21,17,.08)_0%,rgba(25,21,17,.55)_100%)]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 px-6 py-10 text-center sm:px-12 sm:py-14">
          <p className="eyebrow text-ivory/70">{slide.kicker}</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl">{slide.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ivory/80">{slide.copy}</p>
          <Link className="mt-7 inline-flex h-12 items-center border border-ivory/50 px-7 text-[11px] font-semibold uppercase tracking-[0.17em] transition hover:bg-ivory hover:text-ink" href={slide.href}>
            The full story
          </Link>
        </div>
      </article>
      <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="House stories">
        {slides.map((item, slideIndex) => (
          <button
            className={`h-1.5 w-8 transition ${slideIndex === index ? "bg-ink" : "bg-ink/20"}`}
            type="button"
            key={item.id}
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={item.title}
            onClick={() => setIndex(slideIndex)}
          />
        ))}
      </div>
    </section>
  );
}
