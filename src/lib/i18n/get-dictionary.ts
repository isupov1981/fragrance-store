import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import { en, type Dictionary } from "./en";
import { he } from "./he";
import { ru } from "./ru";
import { interpolate } from "./interpolate";

const dictionaries: Record<Locale, Dictionary> = { en, he, ru };

/** Heavy copy that only server pages need — never send this to client components. */
const SERVER_ONLY_KEYS = [
  "legal",
  "faq",
  "catalog",
  "notes",
  "shipping",
  "refund",
  "about",
  "meta",
  "studies",
] as const;

export type ClientDictionary = Omit<Dictionary, (typeof SERVER_ONLY_KEYS)[number]>;

export type { Dictionary, Locale };
export { interpolate };

export function hasLocale(locale: string): locale is Locale {
  return isLocale(locale);
}

export function getDictionary(locale: string): Dictionary {
  if (!hasLocale(locale)) notFound();
  return dictionaries[locale];
}

export function toClientDictionary(dict: Dictionary): ClientDictionary {
  const {
    legal: _legal,
    faq: _faq,
    catalog: _catalog,
    notes: _notes,
    shipping: _shipping,
    refund: _refund,
    about: _about,
    meta: _meta,
    studies: _studies,
    ...client
  } = dict;
  return client;
}

export function getClientDictionary(locale: string): ClientDictionary {
  return toClientDictionary(getDictionary(locale));
}
