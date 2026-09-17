import { afterEach, describe, expect, it } from "vitest";

import { sanitizeImageBase64 } from "@/lib/marketing/gemini-image";
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

describe("sanitizeImageBase64", () => {
  it("strips data-URI and whitespace", () => {
    const raw = "data:image/jpeg;base64,YWJj\nZGVm";
    expect(sanitizeImageBase64(raw)).toBe("YWJjZGVm");
  });

  it("rejects truncated junk", () => {
    expect(() => sanitizeImageBase64("/9j/4AAQ...truncated")).toThrow(/Invalid base64/);
  });
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

  it("returns 400 when imageUrl is missing", async () => {
    process.env.GEMINI_API_KEY = "test-key-not-used";
    await expect(generateProductVisual({ mode: "flyer" })).rejects.toMatchObject({
      status: 400,
      name: "GeminiImageError",
    });
  });
});
