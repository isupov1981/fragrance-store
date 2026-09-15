"use client";

import Image from "next/image";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";

type TrioProduct = {
  slug: string;
  name: string;
  images: string[];
  notes?: string[];
};

export function EditorialTrio({ products }: { products: TrioProduct[] }) {
  const { dict } = useI18n();
  const studies = products.slice(0, 3);
  if (!studies.length) return null;

  return (
    <section className="shell py-6 sm:py-10">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow">{dict.home.trioEyebrow}</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl">
          {studies.length >= 3 ? dict.home.trioTitle : dict.home.trioTitleSingle}
        </h2>
        <p className="mt-4 text-sm leading-6 text-ink/65">
          {studies.length >= 3 ? dict.home.trioCopy : dict.home.trioCopySingle}
        </p>
      </header>
      <ul className={`grid gap-4 ${studies.length === 1 ? "" : "sm:grid-cols-3"}`}>
        {studies.map((study) => (
          <li key={study.slug}>
            <LocaleLink className="group block" href={`/products/${study.slug}`}>
              <div className={`relative overflow-hidden bg-stone ${studies.length === 1 ? "aspect-[16/10]" : "aspect-square"}`}>
                {study.images[0] ? (
                  <Image
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
                    src={study.images[0]}
                    alt={study.name}
                    fill
                    sizes={studies.length === 1 ? "100vw" : "(max-width: 640px) 100vw, 33vw"}
                  />
                ) : null}
              </div>
              <h3 className="mt-4 font-display text-2xl">{study.name}</h3>
              <p className="mt-1 text-xs text-ink/60">{study.notes?.slice(0, 3).join(" · ")}</p>
            </LocaleLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
