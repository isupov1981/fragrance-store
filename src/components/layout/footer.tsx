import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";
import { SocialLinks } from "./social-links";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath } from "@/lib/i18n/path";

export function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const footerGroups = [
    {
      title: dict.footer.explore,
      links: [
        ["/collections/all", dict.nav.all],
        ["/brands", dict.nav.brands],
        ["/collections/all?edit=new", dict.nav.arrivals],
        ["/about", dict.nav.atelier],
      ],
    },
    {
      title: dict.footer.care,
      links: [
        ["/contact", dict.nav.contact],
        ["/shipping", dict.footer.delivery],
        ["/refund", dict.footer.returns],
        ["/faq", dict.nav.faq],
      ],
    },
  ] as const;

  return (
    <footer className="mt-auto bg-ink text-ivory">
      <div className="shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_.7fr_.7fr] lg:gap-20 lg:py-24">
        <div className="max-w-lg">
          <p className="eyebrow text-ivory/60">{dict.footer.correspondence}</p>
          <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">{dict.footer.notesTitle}</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-ivory/65">{dict.footer.notesCopy}</p>
          <NewsletterForm />
          <SocialLinks className="mt-8" />
        </div>
        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="eyebrow text-ivory/45">{group.title}</p>
            <ul className="mt-5 space-y-3 text-sm text-ivory/75">
              {group.links.map(([href, label]) => (
                <li key={href}>
                  <Link className="transition hover:text-white" href={localizedPath(locale, href)}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="shell flex flex-col gap-5 border-t border-ivory/15 py-7 text-[11px] text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
        <p>{interpolate(dict.footer.rights, { year: new Date().getFullYear() })}</p>
        <span>{dict.footer.cities}</span>
      </div>
    </footer>
  );
}
