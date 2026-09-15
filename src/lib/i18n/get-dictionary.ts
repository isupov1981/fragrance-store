import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import { en, type Dictionary } from "./en";
import { he } from "./he";
import { ru } from "./ru";
import { interpolate } from "./interpolate";

const dictionaries: Record<Locale, Dictionary> = { en, he, ru };

export type { Dictionary, Locale };
export { interpolate };

export function hasLocale(locale: string): locale is Locale {
  return isLocale(locale);
}

export function getDictionary(locale: string): Dictionary {
  if (!hasLocale(locale)) notFound();
  return dictionaries[locale];
}
