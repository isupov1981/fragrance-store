import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { ConsentManager } from "@/components/analytics/consent-manager";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "PRIVÉ ATELIER — Rare fragrance, intimately chosen",
    template: "%s — PRIVÉ ATELIER",
  },
  description:
    "A considered collection of niche fragrance: rare materials, singular perfumers and compositions made to live close to the skin.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        {children}
        <Footer />
        <ConsentManager />
      </body>
    </html>
  );
}
