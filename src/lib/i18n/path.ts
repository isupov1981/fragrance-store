import { defaultLocale, isLocale, type Locale } from "./config";

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : defaultLocale;
}

export function stripLocalePrefix(pathname: string) {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) {
    const rest = parts.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

export function localizedPath(locale: Locale, href: string) {
  if (!href || href.startsWith("mailto:") || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("#")) {
    return href;
  }
  const [pathAndQuery, hash] = href.split("#");
  const [pathname, search] = pathAndQuery.split("?");
  const unprefixed = stripLocalePrefix(pathname);
  const localized = unprefixed === "/" ? `/${locale}` : `/${locale}${unprefixed}`;
  return `${localized}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

export function replaceLocaleInPath(pathname: string, nextLocale: Locale) {
  return localizedPath(nextLocale, stripLocalePrefix(pathname));
}
