import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/content/legal-document";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";

type LegalKind = "terms" | "privacy" | "cookies" | "accessibility";
type PageParams = { params: Promise<{ lang: string }> };

export function legalMetadata(kind: LegalKind) {
  return async function generateMetadata({ params }: PageParams): Promise<Metadata> {
    const { lang } = await params;
    if (!hasLocale(lang)) return {};
    return { title: getDictionary(lang).legal[kind].title };
  };
}

export function LegalRoutePage(kind: LegalKind) {
  return async function Page({ params }: PageParams) {
    const { lang } = await params;
    if (!hasLocale(lang)) notFound();
    return <LegalDocument dict={getDictionary(lang)} kind={kind} />;
  };
}
