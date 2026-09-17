import sharp from "sharp";

import { putLocalObject } from "./local";
import { isS3Configured, putS3Object } from "./s3";
import {
  assertImageUpload,
  MIN_IMAGE_EDGE_PX,
  StorageError,
} from "./validate";

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

export async function assertDecodableImage(body: Buffer) {
  let meta: sharp.Metadata;
  try {
    meta = await sharp(body).metadata();
  } catch {
    throw new StorageError("Invalid or corrupt image data", 400);
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_IMAGE_EDGE_PX || height < MIN_IMAGE_EDGE_PX) {
    throw new StorageError(
      `Image too small (${width}x${height}); min edge ${MIN_IMAGE_EDGE_PX}px — likely truncated upload`,
      400,
    );
  }
}

export async function storeImage(input: {
  body: Buffer;
  contentType: string;
  size: number;
  origin: string;
  key?: string;
}) {
  assertImageUpload({ type: input.contentType, size: input.size });
  await assertDecodableImage(input.body);
  if (isS3Configured()) {
    return putS3Object({ body: input.body, contentType: input.contentType, key: input.key });
  }
  return putLocalObject({
    body: input.body,
    contentType: input.contentType,
    origin: input.origin,
    key: input.key,
  });
}
