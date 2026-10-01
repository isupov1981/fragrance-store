import { localeMeta, type Locale } from "@/lib/i18n/config";

import { DocumentLocaleSync } from "./document-locale-sync";

/** Sets `<html lang/dir>` without reading the request, so the storefront can stay cached. */
export function DocumentLocale({ locale }: { locale: Locale }) {
  const meta = localeMeta[locale];
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(meta.html)};document.documentElement.dir=${JSON.stringify(meta.dir)};`,
        }}
      />
      <DocumentLocaleSync locale={locale} />
    </>
  );
}
