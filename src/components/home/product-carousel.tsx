"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import type { StoreProduct } from "@/lib/catalog";
import { usePrefersReducedMotion } from "./reveal";

type ProductCarouselProps = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  products: StoreProduct[];
};

export function ProductCarousel({ eyebrow, title, description, href, linkLabel, products }: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateButtons = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth - 8;
    setCanPrev(node.scrollLeft > 8);
    setCanNext(node.scrollLeft < max);
  }, []);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-carousel-item]");
    const width = card ? card.offsetWidth + 20 : node.clientWidth * 0.7;
    const max = node.scrollWidth - node.clientWidth;
    const next = node.scrollLeft + direction * width;
    if (direction > 0 && next >= max - 4) {
      node.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" });
      return;
    }
    if (direction < 0 && node.scrollLeft <= 4) {
      node.scrollTo({ left: max, behavior: reduced ? "auto" : "smooth" });
      return;
    }
    node.scrollBy({ left: direction * width, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    updateButtons();
    node.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    return () => {
      node.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [updateButtons, products.length]);

  useEffect(() => {
    if (reduced || paused || (!canNext && !canPrev)) return;
    const timer = window.setInterval(() => scrollByCard(1), 3500);
    return () => window.clearInterval(timer);
  }, [canNext, canPrev, paused, reduced, scrollByCard]);

  return (
    <section
      className="shell py-16 sm:py-24 lg:py-28"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="grid items-end gap-10 lg:grid-cols-[minmax(16rem,22rem)_1fr] lg:gap-14">
        <div>
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="font-display text-4xl leading-none sm:text-5xl">{title}</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink/65">{description}</p>
          <Link className="text-link mt-8" href={href}>
            {linkLabel} <span aria-hidden="true">↗</span>
          </Link>
          {(canPrev || canNext) && (
            <div className="mt-8 hidden gap-2 sm:flex">
              <button className="carousel-nav" type="button" onClick={() => scrollByCard(-1)} aria-label="Previous fragrances">
                <ChevronLeft size={18} />
              </button>
              <button className="carousel-nav" type="button" onClick={() => scrollByCard(1)} aria-label="Next fragrances">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
        <div className="relative min-w-0">
          <div
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            ref={scrollerRef}
          >
            {products.map((product, index) => (
              <div className="w-[78%] shrink-0 snap-start sm:w-[48%] lg:w-[calc((100%-2.5rem)/3)]" data-carousel-item key={product.id}>
                <ProductCard product={product} priority={index === 0} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
