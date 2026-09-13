"use client";

import Image from "next/image";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";

export function CollectionPair() {
  const { dict } = useI18n();
  const collections = [
    {
      href: "/collections/all?edit=featured",
      kicker: dict.home.pairFeaturedKicker,
      title: dict.home.pairFeaturedTitle,
      copy: dict.home.pairFeaturedCopy,
      image: "https://images.unsplash.com/photo-1610461888750-10bfc601b874?auto=format&fit=crop&w=1400&q=85",
      alt: dict.home.pairFeaturedTitle,
    },
    {
      href: "/collections/all?edit=new",
      kicker: dict.home.pairNewKicker,
      title: dict.home.pairNewTitle,
      copy: dict.home.pairNewCopy,
      image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=1400&q=85",
      alt: dict.home.pairNewTitle,
    },
  ];

  return (
    <section className="shell grid gap-4 py-10 sm:grid-cols-2 sm:py-16">
      {collections.map((collection) => (
        <article key={collection.href}>
          <LocaleLink className="group block" href={collection.href} aria-label={collection.title}>
            <div className="relative aspect-square overflow-hidden bg-stone sm:aspect-[4/5]">
              <Image className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]" src={collection.image} alt={collection.alt} fill sizes="(max-width: 640px) 100vw, 50vw" />
            </div>
          </LocaleLink>
          <p className="eyebrow mt-6">{collection.kicker}</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">{collection.title}</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-ink/65">{collection.copy}</p>
          <LocaleLink className="text-link mt-6" href={collection.href}>
            {dict.home.viewCollection} <span aria-hidden="true">↗</span>
          </LocaleLink>
        </article>
      ))}
    </section>
  );
}
