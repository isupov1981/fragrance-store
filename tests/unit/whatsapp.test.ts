import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { he } from "@/lib/i18n/he";
import { ru } from "@/lib/i18n/ru";

describe("whatsapp chat link", () => {
  it("builds localized wa.me links for each storefront language", () => {
    const number = "972535324510";
    const locales = [
      { dict: en, message: "Hello! I'd like to ask about a fragrance from The Perfume Room." },
      { dict: ru, message: "Здравствуйте! Хочу спросить об аромате из The Perfume Room." },
      { dict: he, message: "שלום! אשמח לשאול על ניחוח מ־The Perfume Room." },
    ] as const;

    for (const { dict, message } of locales) {
      expect(dict.whatsapp.message).toBe(message);
      expect(dict.whatsapp.label.length).toBeGreaterThan(0);
      const href = `https://wa.me/${number}?text=${encodeURIComponent(dict.whatsapp.message)}`;
      expect(href).toContain(`https://wa.me/${number}?text=`);
      expect(decodeURIComponent(href)).toContain(message);
    }
  });
});
