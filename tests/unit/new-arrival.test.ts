import { describe, expect, it } from "vitest";
import { isNewProduct } from "@/lib/catalog/new-arrival";

describe("isNewProduct", () => {
  const now = new Date("2026-09-18T12:00:00.000Z");

  it("is true within 30 days of createdAt", () => {
    expect(isNewProduct({ createdAt: "2026-09-01T00:00:00.000Z" }, now)).toBe(true);
    expect(isNewProduct({ createdAt: "2026-08-20T12:00:00.000Z" }, now)).toBe(true);
  });

  it("is false after 30 days", () => {
    expect(isNewProduct({ createdAt: "2026-08-18T11:59:00.000Z", newArrival: true }, now)).toBe(false);
  });

  it("falls back to newArrival when createdAt is missing", () => {
    expect(isNewProduct({ newArrival: true }, now)).toBe(true);
    expect(isNewProduct({ newArrival: false }, now)).toBe(false);
  });
});
