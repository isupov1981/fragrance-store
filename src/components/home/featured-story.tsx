"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { isUnoptimizedCatalogImage } from "@/lib/catalog/image";
import { usePrefersReducedMotion } from "./reveal";

type FeaturedProduct = {
  slug: string;
  name: string;
  brand: string;
  description: string;
  images: string[];
};

export function FeaturedStory({ product }: { product?: FeaturedProduct }) {
  const { dict } = useI18n();
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slides = [
    product?.images[0]
      ? {
          id: product.slug,
          kicker: product.brand,
          title: product.name,
          copy: product.description,
          href: `/products/${product.slug}`,
          image: product.images[0],
          alt: product.name,
        }
      : {
          id: "sol",
          kicker: dict.home.storyKicker,
          title: dict.home.storySolTitle,
          copy: dict.home.storySolCopy,
          href: "/collections/all?edit=featured",
          image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=2200&q=88",
          alt: dict.home.storySolTitle,
        },
    {
      id: "atelier",
      kicker: dict.home.storyKicker,
      title: dict.home.storyAtelierTitle,
      copy: dict.home.storyAtelierCopy,
      href: "/about",
      image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=2200&q=88",
      alt: dict.home.storyAtelierTitle,
    },
  ];
  const slide = slides[index];

  useEffect(() => {
    if (reduced || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [paused, reduced, slides.length]);

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
              unoptimized={isUnoptimizedCatalogImage(item.image)}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,21,17,.08)_0%,rgba(25,21,17,.55)_100%)]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 px-6 py-10 text-center sm:px-12 sm:py-14">
          <p className="eyebrow text-ivory/70">{slide.kicker}</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl">{slide.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ivory/80">{slide.copy}</p>
          <LocaleLink className="mt-7 inline-flex h-12 items-center border border-ivory/50 px-7 text-[11px] font-semibold uppercase tracking-[0.17em] transition hover:bg-ivory hover:text-ink" href={slide.href}>
            {dict.home.fullStory}
          </LocaleLink>
        </div>
      </article>
      <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label={dict.home.houseStories}>
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
