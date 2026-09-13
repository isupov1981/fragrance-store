"use client";

import Image from "next/image";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";

export function EditorialTrio() {
  const { dict } = useI18n();
  const studies = [
    {
      href: "/products/citrus-archive",
      title: "Citrus Archive",
      note: dict.studies.citrusNote,
      image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=85",
    },
    {
      href: "/products/iris-paper",
      title: "Iris Paper",
      note: dict.studies.irisNote,
      image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=85",
    },
    {
      href: "/products/cedar-after-rain",
      title: "Cedar After Rain",
      note: dict.studies.cedarNote,
      image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=85",
    },
  ];

  return (
    <section className="shell py-6 sm:py-10">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow">{dict.home.trioEyebrow}</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl">{dict.home.trioTitle}</h2>
        <p className="mt-4 text-sm leading-6 text-ink/65">{dict.home.trioCopy}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-3">
        {studies.map((study) => (
          <li key={study.href}>
            <LocaleLink className="group block" href={study.href}>
              <div className="relative aspect-square overflow-hidden bg-stone">
                <Image className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]" src={study.image} alt={study.title} fill sizes="(max-width: 640px) 100vw, 33vw" />
              </div>
              <h3 className="mt-4 font-display text-2xl">{study.title}</h3>
              <p className="mt-1 text-xs text-ink/60">{study.note}</p>
            </LocaleLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
