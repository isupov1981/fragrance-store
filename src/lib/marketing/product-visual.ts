import sharp from "sharp";

import {
  editProductImage,
  GeminiImageError,
  isGeminiConfigured,
  sanitizeImageBase64,
} from "@/lib/marketing/gemini-image";
import {
  ALLOWED_IMAGE_TYPES,
  assertDecodableImage,
  assertImageUpload,
  createMarketingObjectKey,
  isAllowedImageType,
  MAX_UPLOAD_BYTES,
  storeImage,
  StorageError,
  type AllowedImageType,
} from "@/lib/storage";

export { GeminiImageError, isGeminiConfigured, sanitizeImageBase64 };

export type VisualMode = "beautify" | "flyer";
export type VisualLanguage = "he" | "ru" | "en";

const MAX_EDGE_PX = 1600;
const FETCH_TIMEOUT_MS = 30_000;

export type GenerateProductVisualInput = {
  mode: VisualMode;
  /** Preferred: public URL from upload_product_image (avoids truncated MCP base64). */
  imageUrl?: string;
  /** Fallback only for tiny images — prefer imageUrl. */
  data?: string;
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
    "Edit this perfume bottle product photo into a boutique catalog / Instagram visual.",
    "Replace the background with a soft luxury scene (subtle marble, velvet, or muted gradient).",
    "Improve lighting gently — soft highlights on glass, natural reflections.",
    "CRITICAL: Preserve the bottle silhouette, glass color, cap, and all label text on the bottle exactly. Do not invent or distort branding.",
    "NO on-image typography: no headlines, slogans, prices, store name overlays, watermarks, stickers, or captions.",
    "The output must be photo-only — the bottle is the only subject.",
    "No floating badges, no UI chrome.",
    "Square-friendly composition with the bottle centered.",
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

function allowedFetchOrigins(): Set<string> {
  const origins = new Set<string>();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      origins.add(new URL(site).origin);
    } catch {
      /* ignore */
    }
  }
  const s3 = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (s3) {
    try {
      origins.add(new URL(s3).origin);
    } catch {
      /* ignore */
    }
  }
  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");
  return origins;
}

function sniffContentType(buffer: Buffer, headerType: string | null): AllowedImageType {
  if (headerType && isAllowedImageType(headerType.split(";")[0].trim())) {
    return headerType.split(";")[0].trim() as AllowedImageType;
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/webp";
  throw new GeminiImageError("Fetched file is not a JPEG, PNG or WebP image", 415);
}

async function fetchSourceImage(imageUrl: string): Promise<{ buffer: Buffer; contentType: AllowedImageType }> {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new GeminiImageError("Invalid imageUrl", 400);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new GeminiImageError("imageUrl must be http(s)", 400);
  }
  const allowed = allowedFetchOrigins();
  if (!allowed.has(url.origin)) {
    throw new GeminiImageError("imageUrl host is not an allowed store media origin", 400);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "image/jpeg,image/png,image/webp,*/*" },
    });
  } catch {
    throw new GeminiImageError("Failed to fetch imageUrl", 502);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new GeminiImageError(`Failed to fetch imageUrl (${response.status})`, 502);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = sniffContentType(buffer, response.headers.get("content-type"));
  try {
    assertImageUpload({ type: contentType, size: buffer.byteLength });
    await assertDecodableImage(buffer);
  } catch (error) {
    if (error instanceof StorageError) {
      throw new GeminiImageError(error.message, error.status);
    }
    throw error;
  }
  return { buffer, contentType };
}

async function resolveSourceImage(input: GenerateProductVisualInput): Promise<{
  buffer: Buffer;
  contentType: AllowedImageType;
  imageBase64: string;
}> {
  if (input.imageUrl?.trim()) {
    const fetched = await fetchSourceImage(input.imageUrl.trim());
    return {
      ...fetched,
      imageBase64: fetched.buffer.toString("base64"),
    };
  }

  if (input.data?.trim()) {
    const imageBase64 = sanitizeImageBase64(input.data);
    const contentType = (input.contentType || "image/jpeg") as string;
    if (!isAllowedImageType(contentType)) {
      throw new GeminiImageError("Only JPEG, PNG and WebP images are allowed", 415);
    }
    const buffer = Buffer.from(imageBase64, "base64");
    assertImageUpload({ type: contentType, size: buffer.byteLength });
    return { buffer, contentType, imageBase64 };
  }

  throw new GeminiImageError("Provide imageUrl (preferred) or data (base64)", 400);
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
    out = await sharp(out).jpeg({ quality: 75, mozjpeg: true }).toBuffer();
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

  const source = await resolveSourceImage(input);

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
    imageBase64: source.imageBase64,
    mimeType: source.contentType,
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
    source: input.imageUrl?.trim() ? "imageUrl" : "data",
  };
}

/** Re-export for callers that only need the type map. */
export { ALLOWED_IMAGE_TYPES };
