"use client";

import { usePathname } from "next/navigation";
import { Menu, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandsMenu } from "./brands-menu";
import { CartLink } from "./cart-link";
import { CategoriesMenu } from "./categories-menu";
import { FavoritesLink } from "./favorites-link";
import { CurrencySwitcher } from "@/components/i18n/currency-switcher";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useCurrency } from "@/components/i18n/currency-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useCommerce } from "@/components/commerce/commerce-provider";
import type { StoreBrand } from "@/lib/catalog/brands";
import { isMerchCategorySlug } from "@/lib/catalog/merchandising";
import { interpolate } from "@/lib/i18n/interpolate";
import { localizedPath, stripLocalePrefix } from "@/lib/i18n/path";
import { categories } from "@/lib/catalog";
import { FREE_SHIPPING_ILS_CENTS } from "@/lib/currency";

export function Header({ brands = [] }: { brands?: StoreBrand[] }) {
  const pathname = usePathname();
  const { locale, dict } = useI18n();
  const { format } = useCurrency();
  const { ordersEnabled } = useCommerce();
  const isHome = stripLocalePrefix(pathname) === "/";
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const familyCategories = categories.filter((category) => category.slug !== "all" && !isMerchCategorySlug(category.slug));

  function closeMobileMenu() {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
  }

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const overlay = isHome && !scrolled;

  return (
    <header
      className={`site-header z-50 border-b transition-[background-color,border-color,color] duration-500 ${
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0"
      } ${overlay ? "header-over-hero border-transparent bg-transparent text-ivory" : "border-ink/10 bg-ivory/95 text-ink backdrop-blur-md"}`}
    >
      <a className="skip-link" href="#main-content">
        {dict.nav.skip}
      </a>
      {!isHome && (
        <div className="bg-ink px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-ivory">
          {ordersEnabled
            ? interpolate(dict.nav.promo, { amount: format(FREE_SHIPPING_ILS_CENTS) })
            : dict.nav.browseOnlyPromo}
        </div>
      )}
      <div className="shell flex h-20 items-center justify-between gap-5 lg:h-24">
        <details ref={mobileMenuRef} className="mobile-menu lg:hidden">
          <summary className="icon-button">
            <Menu aria-hidden="true" size={21} />
            <span className="sr-only">{dict.nav.open}</span>
          </summary>
          <div
            className={`fixed inset-x-0 overflow-y-auto border-t border-ink/10 bg-ivory p-6 text-ink ${
              isHome
                ? "top-20 h-[calc(100dvh-5rem)] lg:top-24 lg:h-[calc(100dvh-6rem)]"
                : "top-[112px] h-[calc(100dvh-112px)] lg:top-32 lg:h-[calc(100dvh-8rem)]"
            }`}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="eyebrow">{dict.nav.menu}</span>
              <button className="menu-close icon-button" type="button" onClick={closeMobileMenu} aria-label={dict.nav.close}>
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <nav aria-label={dict.nav.menu} onClick={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest("a")) closeMobileMenu();
            }}>
              <CategoriesMenu variant="mobile" />
              {brands.length ? (
                <div className="mt-2">
                  <BrandsMenu brands={brands} variant="mobile" />
                </div>
              ) : null}
              <p className="eyebrow mb-3 mt-9">{dict.nav.families}</p>
              <ul className="grid grid-cols-2 gap-2">
                {familyCategories.map((category) => (
                  <li key={category.slug}>
                    <LocaleLink className="block bg-sand/45 p-4 text-sm" href={`/collections/${category.slug}`}>
                      {dict.categories[category.slug as keyof typeof dict.categories]?.name ?? category.name}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <LocaleLink href="/saved">{dict.nav.saved}</LocaleLink>
                <LocaleLink href="/contact">{dict.nav.contact}</LocaleLink>
                <LocaleLink href="/faq">{dict.nav.faq}</LocaleLink>
              </div>
              <div className="mt-8 flex gap-6">
                <LanguageSwitcher />
                <CurrencySwitcher />
              </div>
            </nav>
          </div>
        </details>

        <nav className="hidden flex-1 lg:block" aria-label="Primary navigation">
          <ul className="flex items-center gap-8 text-xs font-medium uppercase tracking-[0.16em]">
            <li className="group">
              <LocaleLink className="nav-link" href="/collections/all">{dict.nav.categories}</LocaleLink>
              <div className="invisible absolute inset-x-0 top-full border-y border-ink/10 bg-ivory text-ink opacity-0 shadow-[0_24px_45px_rgba(32,29,25,.08)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <CategoriesMenu variant="desktop" />
              </div>
            </li>
            {brands.length ? (
              <li className="group">
                <LocaleLink className="nav-link" href="/brands">{dict.nav.brands}</LocaleLink>
                <div className="invisible absolute inset-x-0 top-full border-y border-ink/10 bg-ivory text-ink opacity-0 shadow-[0_24px_45px_rgba(32,29,25,.08)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <BrandsMenu brands={brands} variant="desktop" />
                </div>
              </li>
            ) : null}
            <li className="group">
              <span className="nav-link cursor-default">{dict.nav.families}</span>
              <div className="invisible absolute inset-x-0 top-full border-y border-ink/10 bg-ivory text-ink opacity-0 shadow-[0_24px_45px_rgba(32,29,25,.08)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="shell py-10">
                  <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {familyCategories.map((category) => (
                      <li key={category.slug}>
                        <LocaleLink className="text-sm normal-case tracking-normal hover:text-bronze" href={`/collections/${category.slug}`}>
                          {dict.categories[category.slug as keyof typeof dict.categories]?.name ?? category.name}
                        </LocaleLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
            <li><LocaleLink className="nav-link" href="/about">{dict.nav.atelier}</LocaleLink></li>
          </ul>
        </nav>

        <LocaleLink className="site-brand shrink-0" href="/" aria-label={dict.nav.home} dir="ltr" lang="en">
          <span className="site-brand__title">THE PERFUME</span>
          <span className="site-brand__subtitle">Room</span>
        </LocaleLink>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
          <form className="group hidden items-center border-b border-ink/25 xl:flex" action={localizedPath(locale, "/collections/all")}>
            <label className="sr-only" htmlFor="site-search">{dict.nav.searchFragrances}</label>
            <input
              className="w-36 bg-transparent py-2 text-xs outline-none placeholder:text-ink/55 focus:w-44"
              id="site-search"
              name="q"
              type="search"
              placeholder={dict.nav.searchPlaceholder}
            />
            <button className="p-2" type="submit" aria-label={dict.nav.search}>
              <Search aria-hidden="true" size={17} />
            </button>
          </form>
          <LocaleLink className="icon-button xl:hidden" href="/collections/all?search=open" aria-label={dict.nav.search}>
            <Search aria-hidden="true" size={20} />
          </LocaleLink>
          <LocaleLink className="icon-button hidden sm:grid" href="/account" aria-label={dict.nav.account}>
            <UserRound aria-hidden="true" size={20} />
          </LocaleLink>
          <FavoritesLink />
          {ordersEnabled ? <CartLink /> : null}
        </div>
      </div>
    </header>
  );
}
