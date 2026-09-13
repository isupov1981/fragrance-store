"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./reveal";

const perfumers = [
  {
    id: "voss",
    name: "Clara Voss",
    role: "Maison Sol",
    copy: "She writes in amber, vanilla absolute and dry cedar — compositions meant to be worn close, never announced.",
    stats: ["Amber Veil", "Cedar After Rain", "Warm resins"],
    href: "/products/amber-veil",
    cta: "Wear Amber Veil",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1400&q=88",
    alt: "Amber Veil bottle in warm light",
  },
  {
    id: "ellery",
    name: "Jonah Ellery",
    role: "Atelier Nox",
    copy: "Green fig, mineral musk and night air. A modern line with the courage to stay quiet until the dry-down.",
    stats: ["Fig Nocturne", "Iris Paper", "Skin musks"],
    href: "/products/fig-nocturne",
    cta: "Wear Fig Nocturne",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1400&q=88",
    alt: "Fig Nocturne bottle against dark botanicals",
  },
];

export function PerfumerSpotlight() {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = perfumers[index];

  useEffect(() => {
    if (reduced || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % perfumers.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, reduced]);

  return (
    <section className="shell py-16 sm:py-24" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
        <p className="eyebrow">The hands behind the work</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl">Perfumer spotlight</h2>
        <p className="mt-4 text-sm leading-6 text-ink/65">Meet the independent noses whose signatures shape the atelier.</p>
      </header>
      <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Choose a perfumer">
        {perfumers.map((person, personIndex) => (
          <button
            className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
              personIndex === index ? "bg-ink text-ivory" : "bg-stone text-ink hover:bg-sand"
            }`}
            type="button"
            key={person.id}
            role="tab"
            aria-selected={personIndex === index}
            onClick={() => setIndex(personIndex)}
          >
            {person.name}
          </button>
        ))}
      </div>
      <article className="grid overflow-hidden bg-stone/70 lg:grid-cols-2">
        <div className="relative min-h-[320px] lg:min-h-[520px]">
          {perfumers.map((person, personIndex) => (
            <Image
              key={person.id}
              className={`story-frame object-cover ${personIndex === index ? "is-active" : ""}`}
              src={person.image}
              alt={person.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ))}
        </div>
        <div className="flex items-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="max-w-md">
            <p className="eyebrow text-bronze">{active.role}</p>
            <h3 className="mt-4 font-display text-4xl sm:text-5xl">{active.name}</h3>
            <p className="mt-5 text-sm leading-7 text-ink/70">{active.copy}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {active.stats.map((stat) => (
                <li className="bg-ivory px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-ink/70" key={stat}>
                  {stat}
                </li>
              ))}
            </ul>
            <Link className="text-link mt-9" href={active.href}>
              {active.cta} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}
