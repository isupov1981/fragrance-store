"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localizedPath } from "@/lib/i18n/path";
import { useI18n } from "./i18n-provider";

type LocaleLinkProps = ComponentProps<typeof Link>;

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const { locale } = useI18n();
  const localized = typeof href === "string" ? localizedPath(locale, href) : href;
  return <Link href={localized} {...props} />;
}
