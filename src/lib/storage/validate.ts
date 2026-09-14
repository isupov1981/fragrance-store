export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export class StorageError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export function isAllowedImageType(type: string): type is AllowedImageType {
  return type in ALLOWED_IMAGE_TYPES;
}

export function assertImageUpload(input: { type: string; size: number }) {
  if (!isAllowedImageType(input.type)) {
    throw new StorageError("Only JPEG, PNG and WebP images are allowed", 415);
  }
  if (input.size <= 0 || input.size > MAX_UPLOAD_BYTES) {
    throw new StorageError("Image must be between 1 byte and 5 MB", 413);
  }
}

export function createObjectKey(mime: string, now = new Date(), id = crypto.randomUUID()) {
  if (!isAllowedImageType(mime)) {
    throw new StorageError("Only JPEG, PNG and WebP images are allowed", 415);
  }
  const ext = ALLOWED_IMAGE_TYPES[mime];
  const stamp = now.toISOString().slice(0, 10);
  return `products/${stamp}/${id}.${ext}`;
}

export function resolveStoredPath(root: string, key: string) {
  const normalized = key.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.startsWith("/")) {
    throw new StorageError("Invalid object key", 400);
  }
  return { key: normalized, absolute: `${root.replace(/[\\/]+$/, "")}/${normalized}` };
}
