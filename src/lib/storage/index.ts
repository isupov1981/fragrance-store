import { putLocalObject } from "./local";
import { isS3Configured, putS3Object } from "./s3";
import { assertImageUpload, isAllowedImageType, StorageError } from "./validate";

export {
  StorageError,
  assertImageUpload,
  MAX_UPLOAD_BYTES,
  MIN_UPLOAD_BYTES,
  MIN_IMAGE_EDGE_PX,
  ALLOWED_IMAGE_TYPES,
  createMarketingObjectKey,
  isAllowedImageType,
  type AllowedImageType,
} from "./validate";
export { isS3Configured } from "./s3";

/** Validate image without sharp (Hostinger glibc often breaks native sharp). */
export async function assertDecodableImage(body: Buffer) {
  const jpeg = body[0] === 0xff && body[1] === 0xd8;
  const png = body[0] === 0x89 && body[1] === 0x50 && body[2] === 0x4e && body[3] === 0x47;
  const webp =
    body[0] === 0x52 &&
    body[1] === 0x49 &&
    body[2] === 0x46 &&
    body[3] === 0x46 &&
    body[8] === 0x57 &&
    body[9] === 0x45 &&
    body[10] === 0x42 &&
    body[11] === 0x50;
  if (!jpeg && !png && !webp) {
    throw new StorageError("Invalid or corrupt image data", 400);
  }
}

function sniffMime(body: Buffer) {
  if (body[0] === 0xff && body[1] === 0xd8) return "image/jpeg" as const;
  if (body[0] === 0x89 && body[1] === 0x50) return "image/png" as const;
  if (body[0] === 0x52 && body[1] === 0x49 && body[2] === 0x46) return "image/webp" as const;
  return null;
}

export async function storeImage(input: {
  body: Buffer;
  contentType: string;
  size: number;
  origin: string;
  key?: string;
}) {
  const sniffed = sniffMime(input.body);
  const contentType =
    input.contentType && isAllowedImageType(input.contentType)
      ? input.contentType
      : sniffed || input.contentType;

  assertImageUpload({ type: contentType, size: input.size });
  await assertDecodableImage(input.body);
  const allowLocalFallback =
    process.env.NODE_ENV !== "production" || process.env.STORAGE_ALLOW_LOCAL === "true";

  if (isS3Configured()) {
    try {
      return await putS3Object({
        body: input.body,
        contentType,
        key: input.key,
      });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      if (!allowLocalFallback) {
        console.error("S3 upload failed:", error);
        throw new StorageError("Object storage upload failed", 502);
      }
      console.error("S3 upload failed, falling back to local storage:", error);
    }
  } else if (!allowLocalFallback) {
    throw new StorageError(
      "Object storage is not configured (set S3_*). Local uploads are ephemeral on Hostinger.",
      503,
    );
  }

  try {
    return await putLocalObject({
      body: input.body,
      contentType,
      origin: input.origin,
      key: input.key,
    });
  } catch (error) {
    if (error instanceof StorageError) throw error;
    const message = error instanceof Error ? error.message : "Storage upload failed";
    console.error("storeImage failed:", error);
    throw new StorageError(message, 502);
  }
}
