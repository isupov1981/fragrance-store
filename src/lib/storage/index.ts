import { putLocalObject } from "./local";
import { isS3Configured, putS3Object } from "./s3";
import { assertImageUpload } from "./validate";

export {
  StorageError,
  assertImageUpload,
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_TYPES,
  createMarketingObjectKey,
  isAllowedImageType,
  type AllowedImageType,
} from "./validate";
export { isS3Configured } from "./s3";

export async function storeImage(input: {
  body: Buffer;
  contentType: string;
  size: number;
  origin: string;
  key?: string;
}) {
  assertImageUpload({ type: input.contentType, size: input.size });
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
