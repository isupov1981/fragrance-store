import { afterEach, describe, expect, it } from "vitest";

import {
  buildBeautifyPrompt,
  buildFlyerPrompt,
  generateProductVisual,
  isGeminiConfigured,
} from "@/lib/marketing/product-visual";

const originalKey = process.env.GEMINI_API_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
});

describe("product visual prompts", () => {
  it("beautify prompt preserves bottle fidelity rules", () => {
    const prompt = buildBeautifyPrompt({ styleHint: "dark amber" });
    expect(prompt).toMatch(/Preserve the bottle silhouette/i);
    expect(prompt).toMatch(/dark amber/);
  });

  it("flyer prompt includes language, name, and exact price when given", () => {
    const prompt = buildFlyerPrompt({
      productName: "Xerjoff Naxos",
      brand: "The Perfume Room",
      priceLabel: "₪79",
      language: "he",
    });
    expect(prompt).toMatch(/Hebrew/);
    expect(prompt).toMatch(/Xerjoff Naxos/);
    expect(prompt).toMatch(/₪79/);
    expect(prompt).not.toMatch(/invent prices/i);
  });

  it("flyer without price tells the model not to invent one", () => {
    const prompt = buildFlyerPrompt({ productName: "Test", language: "ru" });
    expect(prompt).toMatch(/Russian/);
    expect(prompt).toMatch(/do not invent prices/i);
  });
});

describe("generateProductVisual config", () => {
  it("reports missing when GEMINI_API_KEY is unset", () => {
    delete process.env.GEMINI_API_KEY;
    expect(isGeminiConfigured()).toBe(false);
  });

  it("returns 503 when key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      generateProductVisual({
        mode: "beautify",
        data: Buffer.from("not-a-real-image").toString("base64"),
        contentType: "image/jpeg",
      }),
    ).rejects.toMatchObject({ status: 503, name: "GeminiImageError" });
  });
});
