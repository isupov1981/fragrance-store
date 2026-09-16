import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Noto_Sans_Hebrew, Noto_Serif_Hebrew } from "next/font/google";
import { headers } from "next/headers";
import { isLocale, localeMeta } from "@/lib/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const hebrewSans = Noto_Sans_Hebrew({
  variable: "--font-hebrew-sans",
  subsets: ["hebrew"],
  weight: ["400", "500", "600"],
});

const hebrewDisplay = Noto_Serif_Hebrew({
  variable: "--font-hebrew-display",
  subsets: ["hebrew"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "The Perfume Room — Rare fragrance, intimately chosen",
    template: "%s — The Perfume Room",
  },
  description:
    "A considered collection of niche fragrance: rare materials, singular perfumers and compositions made to live close to the skin.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headerList = await headers();
  const localeHeader = headerList.get("x-locale");
  const nonce = headerList.get("x-nonce") ?? undefined;
  const locale = isLocale(localeHeader) ? localeHeader : "en";
  const meta = localeMeta[locale];

  return (
    <html
      lang={meta.html}
      dir={meta.dir}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${display.variable} ${hebrewSans.variable} ${hebrewDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" data-nonce={nonce}>
        {children}
      </body>
    </html>
  );
}
