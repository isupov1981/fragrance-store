import { describe, expect, it } from "vitest";
import { z } from "zod";
import { locales } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/en";
import { he } from "@/lib/i18n/he";
import { ru } from "@/lib/i18n/ru";
import { toClientDictionary } from "@/lib/i18n/get-dictionary";

const newsletterSchema = z.object({
  email: z.email(),
  locale: z.enum(locales).optional(),
  marketingConsent: z.literal(true),
});

describe("public newsletter subscribe schema", () => {
  it("requires explicit marketing consent", () => {
    expect(newsletterSchema.safeParse({ email: "ada@example.com" }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "ada@example.com", marketingConsent: true }).success).toBe(true);
  });
});

describe("legal dictionaries", () => {
  it("keeps the same legal documents in every locale", () => {
    for (const dict of [en, he, ru]) {
      expect(dict.legal.terms.sections.length).toBe(en.legal.terms.sections.length);
      expect(dict.legal.privacy.sections.length).toBe(en.legal.privacy.sections.length);
      expect(dict.legal.cookies.sections.length).toBe(en.legal.cookies.sections.length);
      expect(dict.legal.accessibility.sections.length).toBe(en.legal.accessibility.sections.length);
    }
  });

  it("strips legal and other server-only copy from the client dictionary", () => {
    const client = toClientDictionary(en);
    expect(client).not.toHaveProperty("legal");
    expect(client).not.toHaveProperty("faq");
    expect(client).not.toHaveProperty("catalog");
    expect(client).not.toHaveProperty("notes");
    expect(client.nav.shop).toBe(en.nav.shop);
    expect(client.consent.title).toBe(en.consent.title);
    expect(client.home.explore).toBe(en.home.explore);
  });
});
