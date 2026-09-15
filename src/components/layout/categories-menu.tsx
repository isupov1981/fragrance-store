"use client";

import { ChevronDown } from "lucide-react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { categoryMenuLinks } from "@/lib/catalog/merchandising";

export function CategoriesMenu({ variant = "mobile" }: { variant?: "mobile" | "desktop" }) {
  const { dict } = useI18n();
  const links = categoryMenuLinks.map((item) => ({
    id: item.id,
    href: item.href,
    label: item.label(dict),
  }));

  if (variant === "desktop") {
    return (
      <div className="shell py-10">
        <p className="eyebrow mb-6">{dict.nav.categories}</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {links.map((item) => (
            <li key={item.id}>
              <LocaleLink
                className="block border border-ink/10 px-5 py-4 font-display text-xl normal-case tracking-normal transition hover:border-bronze hover:text-bronze"
                href={item.href}
              >
                {item.label}
              </LocaleLink>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <details className="group border-b border-ink/10" open>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-2xl [&::-webkit-details-marker]:hidden">
        <span>{dict.nav.categories}</span>
        <ChevronDown className="size-5 shrink-0 transition group-open:-rotate-180" aria-hidden="true" />
      </summary>
      <ul className="pb-2">
        {links.map((item) => (
          <li key={item.id} className="border-t border-ink/10">
            <LocaleLink className="block py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em]" href={item.href}>
              {item.label}
            </LocaleLink>
          </li>
        ))}
      </ul>
    </details>
  );
}
