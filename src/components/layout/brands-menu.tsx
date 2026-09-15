"use client";

import { ChevronDown } from "lucide-react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { groupBrandsByLetter, type StoreBrand } from "@/lib/catalog/brands";
import { interpolate } from "@/lib/i18n/interpolate";

export function BrandsMenu({ brands, variant = "mobile" }: { brands: StoreBrand[]; variant?: "mobile" | "desktop" }) {
  const { dict } = useI18n();
  const groups = groupBrandsByLetter(brands);

  if (!brands.length) return null;

  if (variant === "desktop") {
    return (
      <div className="shell grid gap-8 py-10 lg:grid-cols-[180px_1fr]">
        <div>
          <p className="eyebrow mb-4">{dict.nav.brands}</p>
          <LocaleLink className="text-sm normal-case tracking-normal text-ink/65 hover:text-bronze" href="/brands">
            {dict.brands.viewAll}
          </LocaleLink>
        </div>
        <ul className="columns-2 gap-x-12 space-y-5 md:columns-3 xl:columns-4">
          {groups.map((group) => (
            <li key={group.letter} className="break-inside-avoid">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                {group.letter === "0-9" || group.letter === "#"
                  ? group.letter
                  : interpolate(dict.brands.letterBrands, { letter: group.letter })}
              </p>
              <ul className="space-y-1.5">
                {group.brands.map((brand) => (
                  <li key={brand.slug}>
                    <LocaleLink
                      className="block text-sm normal-case tracking-normal hover:text-bronze"
                      href={`/brands/${brand.slug}`}
                    >
                      {brand.name}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <details className="group border-b border-ink/10">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-2xl [&::-webkit-details-marker]:hidden">
        <span>{dict.nav.brands}</span>
        <ChevronDown className="size-5 shrink-0 transition group-open:-rotate-180" aria-hidden="true" />
      </summary>
      <ul className="pb-4">
        {groups.map((group) => (
          <li key={group.letter}>
            <details className="group/letter border-t border-ink/10">
              <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] [&::-webkit-details-marker]:hidden">
                <span>
                  {group.letter === "0-9" || group.letter === "#"
                    ? group.letter
                    : interpolate(dict.brands.letterBrands, { letter: group.letter })}
                </span>
                <span className="grid size-7 place-items-center rounded-full border border-ink/15">
                  <ChevronDown className="size-3.5 transition group-open/letter:-rotate-180" aria-hidden="true" />
                </span>
              </summary>
              <ul className="space-y-1 pb-3 ps-1">
                {group.brands.map((brand) => (
                  <li key={brand.slug}>
                    <LocaleLink className="block py-2 text-sm text-ink/80 hover:text-ink" href={`/brands/${brand.slug}`}>
                      {brand.name}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </details>
  );
}
