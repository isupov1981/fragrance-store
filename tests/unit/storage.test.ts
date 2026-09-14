import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, assertImageUpload, createObjectKey, resolveStoredPath, StorageError } from "@/lib/storage/validate";

describe("assertImageUpload", () => {
  it("accepts a jpeg under the size cap", () => {
    expect(() => assertImageUpload({ type: "image/jpeg", size: 1200 })).not.toThrow();
  });

  it("rejects unsupported types and oversized files", () => {
    expect(() => assertImageUpload({ type: "image/gif", size: 100 })).toThrow(StorageError);
    expect(() => assertImageUpload({ type: "image/png", size: MAX_UPLOAD_BYTES + 1 })).toThrow(StorageError);
  });
});

describe("createObjectKey", () => {
  it("uses a dated product prefix and the mime extension", () => {
    const key = createObjectKey("image/webp", new Date("2026-09-13T00:00:00.000Z"), "id-1");
    expect(key).toBe("products/2026-09-13/id-1.webp");
  });
});

describe("resolveStoredPath", () => {
  it("rejects path traversal", () => {
    expect(() => resolveStoredPath("/uploads", "../secret.png")).toThrow(StorageError);
  });
});
