"use client";

import { useLayoutEffect } from "react";

import { localeMeta, type Locale } from "@/lib/i18n/config";

/** Keeps lang/dir correct after client navigations, when the inline script does not run again. */
export function DocumentLocaleSync({ locale }: { locale: Locale }) {
  const meta = localeMeta[locale];

  useLayoutEffect(() => {
    document.documentElement.lang = meta.html;
    document.documentElement.dir = meta.dir;
  }, [meta.dir, meta.html]);

  return null;
}
