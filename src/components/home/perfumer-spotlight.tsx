"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { interpolate } from "@/lib/i18n/interpolate";
import { usePrefersReducedMotion } from "./reveal";

type SpotlightProduct = {
  slug: string;
  name: string;
  brand: string;
  description: string;
  images: string[];
  notes?: string[];
  category: string;
};

export function PerfumerSpotlight({ products }: { products: SpotlightProduct[] }) {
  const { dict } = useI18n();
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const houses = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((product) => {
      const key = product.brand.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return Boolean(product.images[0]);
    });
  }, [products]);
  const active = houses[index];

  useEffect(() => {
    if (reduced || paused || houses.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % houses.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, reduced, houses.length]);

  if (!active) return null;

  return (
    <section className="shell py-16 sm:py-24" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
        <p className="eyebrow">{dict.home.spotlightEyebrow}</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl">{dict.home.spotlightTitle}</h2>
        <p className="mt-4 text-sm leading-6 text-ink/65">{dict.home.spotlightCopy}</p>
      </header>
      {houses.length > 1 ? (
        <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label={dict.home.choosePerfumer}>
          {houses.map((house, houseIndex) => (
            <button
              className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                houseIndex === index ? "bg-ink text-ivory" : "bg-stone text-ink hover:bg-sand"
              }`}
              type="button"
              key={house.brand}
              role="tab"
              aria-selected={houseIndex === index}
              onClick={() => setIndex(houseIndex)}
            >
              {house.brand}
            </button>
          ))}
        </div>
      ) : null}
      <article className="grid overflow-hidden bg-stone/70 lg:grid-cols-2">
        <div className="relative min-h-[320px] lg:min-h-[520px]">
          {houses.map((house, houseIndex) => (
            <Image
              key={house.slug}
              className={`story-frame object-cover ${houseIndex === index ? "is-active" : ""}`}
              src={house.images[0]}
              alt={house.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ))}
        </div>
        <div className="flex items-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="max-w-md">
            <p className="eyebrow text-bronze">{active.brand}</p>
            <h3 className="mt-4 font-display text-4xl sm:text-5xl">{active.name}</h3>
            <p className="mt-5 text-sm leading-7 text-ink/70">{active.description}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {[active.name, ...(active.notes ?? []).slice(0, 2)].map((stat) => (
                <li className="bg-ivory px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-ink/70" key={stat}>
                  {stat}
                </li>
              ))}
            </ul>
            <LocaleLink className="text-link mt-9" href={`/products/${active.slug}`}>
              {interpolate(dict.home.wearProduct, { name: active.name })} <span aria-hidden="true">↗</span>
            </LocaleLink>
          </div>
        </div>
      </article>
    </section>
  );
}
