"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CartLink } from "./cart-link";
import { categories } from "@/lib/catalog";

const editorialLinks = [
  { href: "/collections/all", label: "All fragrances" },
  { href: "/collections/all?edit=new", label: "New arrivals" },
  { href: "/collections/all?edit=featured", label: "Curator's edit" },
];

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

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
        Skip to content
      </a>
      {!isHome && (
        <div className="bg-ink px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-ivory">
          Complimentary delivery on orders over $250
        </div>
      )}
      <div className="shell flex h-20 items-center justify-between gap-5 lg:h-24">
        <details className="mobile-menu lg:hidden">
          <summary className="icon-button">
            <Menu aria-hidden="true" size={21} />
            <span className="sr-only">Open navigation</span>
          </summary>
          <div
            className={`fixed inset-x-0 overflow-y-auto border-t border-ink/10 bg-ivory p-6 text-ink ${
              isHome
                ? "top-20 h-[calc(100dvh-5rem)] lg:top-24 lg:h-[calc(100dvh-6rem)]"
                : "top-[112px] h-[calc(100dvh-112px)] lg:top-32 lg:h-[calc(100dvh-8rem)]"
            }`}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="eyebrow">Menu</span>
              <span className="menu-close icon-button" aria-hidden="true">
                <X size={20} />
              </span>
            </div>
            <nav aria-label="Mobile navigation">
              <ul className="space-y-1">
                {editorialLinks.map((item) => (
                  <li key={item.href}>
                    <Link className="block border-b border-ink/10 py-4 font-display text-2xl" href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="eyebrow mb-3 mt-9">Shop by mood</p>
              <ul className="grid grid-cols-2 gap-2">
                {categories.slice(1).map((category) => (
                  <li key={category.slug}>
                    <Link className="block bg-sand/45 p-4 text-sm" href={`/collections/${category.slug}`}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-6 text-sm">
                <Link href="/contact">Contact</Link>
                <Link href="/faq">FAQ</Link>
              </div>
            </nav>
          </div>
        </details>

        <nav className="hidden flex-1 lg:block" aria-label="Primary navigation">
          <ul className="flex items-center gap-8 text-xs font-medium uppercase tracking-[0.16em]">
            <li className="group">
              <Link className="nav-link" href="/collections/all">Shop</Link>
              <div className="invisible absolute inset-x-0 top-full border-y border-ink/10 bg-ivory text-ink opacity-0 shadow-[0_24px_45px_rgba(32,29,25,.08)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="shell grid grid-cols-[1.1fr_1fr] gap-16 py-10">
                  <div>
                    <p className="eyebrow mb-5">The collection</p>
                    <ul className="grid grid-cols-2 gap-x-10 gap-y-4">
                      {editorialLinks.map((item) => (
                        <li key={item.href}>
                          <Link className="font-display text-xl normal-case tracking-normal hover:text-bronze" href={item.href}>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-l border-ink/10 pl-16">
                    <p className="eyebrow mb-5">Olfactive families</p>
                    <ul className="grid grid-cols-2 gap-3">
                      {categories.slice(1).map((category) => (
                        <li key={category.slug}>
                          <Link className="text-sm normal-case tracking-normal hover:text-bronze" href={`/collections/${category.slug}`}>
                            {category.name} <span aria-hidden="true">↗</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li><Link className="nav-link" href="/collections/all?edit=new">New</Link></li>
            <li><Link className="nav-link" href="/about">Our atelier</Link></li>
          </ul>
        </nav>

        <Link className="shrink-0 text-center" href="/" aria-label="Privé Atelier home">
          <span className="block font-display text-[1.65rem] leading-none tracking-[0.08em] sm:text-3xl">PRIVÉ</span>
          <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.48em]">Atelier</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <form className="group hidden items-center border-b border-ink/25 xl:flex" action="/collections/all">
            <label className="sr-only" htmlFor="site-search">Search fragrances</label>
            <input
              className="w-36 bg-transparent py-2 text-xs outline-none placeholder:text-ink/55 focus:w-44"
              id="site-search"
              name="q"
              type="search"
              placeholder="Search fragrance"
            />
            <button className="p-2" type="submit" aria-label="Search">
              <Search aria-hidden="true" size={17} />
            </button>
          </form>
          <Link className="icon-button xl:hidden" href="/collections/all?search=open" aria-label="Search">
            <Search aria-hidden="true" size={20} />
          </Link>
          <Link className="icon-button hidden sm:grid" href="/account" aria-label="Account">
            <UserRound aria-hidden="true" size={20} />
          </Link>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
