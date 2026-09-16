import { afterEach, describe, expect, it, vi } from "vitest";

describe("announceNewArrivalIfNeeded", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("no-ops when the database is disabled", async () => {
    vi.doMock("@/lib/db/enabled", () => ({ databaseEnabled: () => false }));
    const { announceNewArrivalIfNeeded } = await import("@/lib/email/new-arrivals");
    await expect(announceNewArrivalIfNeeded("prod_1")).resolves.toBeUndefined();
  });
});

describe("getSocialLinks", () => {
  const keys = [
    "NEXT_PUBLIC_INSTAGRAM_URL",
    "NEXT_PUBLIC_FACEBOOK_URL",
    "NEXT_PUBLIC_YOUTUBE_URL",
    "NEXT_PUBLIC_TIKTOK_URL",
  ] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  afterEach(() => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.resetModules();
  });

  it("falls back to placeholder profile roots", async () => {
    for (const key of keys) delete process.env[key];
    vi.resetModules();
    const { getSocialLinks } = await import("@/lib/social");
    expect(getSocialLinks().map((link) => link.id)).toEqual([
      "instagram",
      "facebook",
      "youtube",
      "tiktok",
    ]);
    expect(getSocialLinks()[0]?.href).toContain("instagram.com");
  });
});
