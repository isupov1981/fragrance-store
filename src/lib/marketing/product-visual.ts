import sharp from "sharp";

import { editProductImage, GeminiImageError, isGeminiConfigured } from "@/lib/marketing/gemini-image";
import {
  ALLOWED_IMAGE_TYPES,
  assertImageUpload,
  createMarketingObjectKey,
  isAllowedImageType,
  MAX_UPLOAD_BYTES,
  storeImage,
  type AllowedImageType,
} from "@/lib/storage";

export { GeminiImageError, isGeminiConfigured };

export type VisualMode = "beautify" | "flyer";
export type VisualLanguage = "he" | "ru" | "en";

const MAX_EDGE_PX = 1600;

export type GenerateProductVisualInput = {
  mode: VisualMode;
  data: string;
  contentType?: string;
  productName?: string;
  brand?: string;
  priceLabel?: string;
  language?: VisualLanguage;
  styleHint?: string;
};

export function buildBeautifyPrompt(opts?: { styleHint?: string }) {
  const hint = opts?.styleHint?.trim();
  return [
    "Edit this perfume bottle product photo into a boutique catalog shot.",
    "Replace the background with a soft luxury scene (subtle marble, velvet, or muted gradient).",
    "Improve lighting gently — soft highlights on glass, natural reflections.",
    "CRITICAL: Preserve the bottle silhouette, glass color, cap, and all label text exactly. Do not invent or distort branding.",
    "No watermarks, no extra logos, no floating badges, no UI chrome.",
    "Square-friendly product composition with the bottle centered.",
    hint ? `Style hint: ${hint}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildFlyerPrompt(input: {
  productName?: string;
  brand?: string;
  priceLabel?: string;
  language?: VisualLanguage;
  styleHint?: string;
}) {
  const language = input.language ?? "en";
  const langLine =
    language === "he"
      ? "All on-image text must be in Hebrew (RTL where appropriate)."
      : language === "ru"
        ? "All on-image text must be in Russian."
        : "All on-image text must be in English.";

  const name = input.productName?.trim() || "Fragrance";
  const brand = input.brand?.trim() || "The Perfume Room";
  const price = input.priceLabel?.trim();
  const hint = input.styleHint?.trim();

  return [
    "Create a polished Instagram story flyer (aspect ratio about 4:5) from this perfume bottle photo.",
    "Keep the real bottle recognizable: silhouette, glass, cap, and label must stay accurate.",
    "Boutique luxury aesthetic for The Perfume Room — quiet, elegant, not marketplace-loud.",
    "Layout: product photo as the hero, brand/store name, product name as headline, and a clear price line if provided.",
    langLine,
    `Brand line: ${brand}`,
    `Product name: ${name}`,
    price
      ? `Price text exactly: ${price}`
      : "Omit a price number — do not invent prices.",
    "Use large readable typography. Avoid clutter, stickers, and fake UI.",
    "No watermarks other than the The Perfume Room name as brand.",
    hint ? `Style hint: ${hint}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

async function normalizeForStore(buffer: Buffer, preferredType: string) {
  let pipeline = sharp(buffer).rotate().resize({
    width: MAX_EDGE_PX,
    height: MAX_EDGE_PX,
    fit: "inside",
    withoutEnlargement: true,
  });

  let contentType: AllowedImageType = "image/jpeg";
  if (preferredType === "image/png") {
    contentType = "image/png";
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else if (preferredType === "image/webp") {
    contentType = "image/webp";
    pipeline = pipeline.webp({ quality: 85 });
  } else {
    pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true });
  }

  let out = await pipeline.toBuffer();
  if (out.byteLength > MAX_UPLOAD_BYTES) {
    out = await sharp(out)
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer();
    contentType = "image/jpeg";
  }
  if (out.byteLength > MAX_UPLOAD_BYTES) {
    throw new GeminiImageError("Generated image exceeds 5 MB after compression", 413);
  }
  return { buffer: out, contentType };
}

export async function generateProductVisual(input: GenerateProductVisualInput) {
  if (!isGeminiConfigured()) {
    throw new GeminiImageError("Gemini image API is not configured (GEMINI_API_KEY)", 503);
  }

  const contentType = input.contentType || "image/jpeg";
  if (!isAllowedImageType(contentType)) {
    throw new GeminiImageError("Only JPEG, PNG and WebP images are allowed", 415);
  }

  const body = Buffer.from(input.data, "base64");
  assertImageUpload({ type: contentType, size: body.byteLength });

  const prompt =
    input.mode === "flyer"
      ? buildFlyerPrompt({
          productName: input.productName,
          brand: input.brand,
          priceLabel: input.priceLabel,
          language: input.language,
          styleHint: input.styleHint,
        })
      : buildBeautifyPrompt({ styleHint: input.styleHint });

  const edited = await editProductImage({
    imageBase64: input.data,
    mimeType: contentType,
    prompt,
  });

  const normalized = await normalizeForStore(edited.buffer, edited.contentType);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const key = createMarketingObjectKey(normalized.contentType);

  const stored = await storeImage({
    body: normalized.buffer,
    contentType: normalized.contentType,
    size: normalized.buffer.byteLength,
    origin,
    key,
  });

  return {
    url: stored.url,
    key: stored.key,
    mode: input.mode,
    contentType: normalized.contentType,
  };
}

/** Re-export for callers that only need the type map. */
export { ALLOWED_IMAGE_TYPES };
