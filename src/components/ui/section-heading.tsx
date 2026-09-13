"use client";

import { LocaleLink } from "@/components/i18n/locale-link";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
}: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="font-display text-4xl leading-none sm:text-5xl">{title}</h2>
        {description && <p className="mt-4 max-w-xl text-sm leading-6 text-ink/65">{description}</p>}
      </div>
      {href && (
        <LocaleLink className="text-link shrink-0" href={href}>
          {linkLabel} <span aria-hidden="true">↗</span>
        </LocaleLink>
      )}
    </div>
  );
}
