import Link from "next/link";
import { ArrowRight } from "lucide-react";

const footerGroups = [
  {
    title: "Explore",
    links: [
      ["/collections/all", "All fragrances"],
      ["/collections/all?edit=new", "New arrivals"],
      ["/about", "Our atelier"],
    ],
  },
  {
    title: "Client care",
    links: [
      ["/contact", "Contact"],
      ["/shipping", "Delivery"],
      ["/refund", "Returns"],
      ["/faq", "FAQ"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-ivory">
      <div className="shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_.7fr_.7fr] lg:gap-20 lg:py-24">
        <div className="max-w-lg">
          <p className="eyebrow text-ivory/60">Private correspondence</p>
          <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">Notes from the atelier</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-ivory/65">
            New compositions, quiet rituals and invitations to our private edits, delivered occasionally.
          </p>
          <form className="mt-8 flex max-w-md border-b border-ivory/35" action="#" method="post">
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-ivory/45"
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Your email address"
            />
            <button className="grid size-11 place-items-center transition hover:text-bronze" type="submit" aria-label="Subscribe">
              <ArrowRight aria-hidden="true" size={19} />
            </button>
          </form>
        </div>
        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="eyebrow text-ivory/45">{group.title}</p>
            <ul className="mt-5 space-y-3 text-sm text-ivory/75">
              {group.links.map(([href, label]) => (
                <li key={href}>
                  <Link className="transition hover:text-white" href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="shell flex flex-col gap-5 border-t border-ivory/15 py-7 text-[11px] text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Privé Atelier. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <span>Paris · New York · Worldwide</span>
          <a className="font-semibold uppercase tracking-[0.15em] transition hover:text-white" href="https://instagram.com" aria-label="Instagram">IG</a>
        </div>
      </div>
    </footer>
  );
}
