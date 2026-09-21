import { describe, expect, it } from "vitest";
import { parseConsent, serializeConsent } from "@/lib/consent/preferences";

describe("parseConsent", () => {
  it("treats a missing value as no choice", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("")).toBeNull();
  });

  it("migrates the previous accepted/declined strings", () => {
    expect(parseConsent("accepted")).toMatchObject({ analytics: true, marketing: true });
    expect(parseConsent("declined")).toMatchObject({ analytics: false, marketing: false });
  });

  it("reads granular JSON preferences", () => {
    const raw = serializeConsent({ analytics: true, marketing: false });
    expect(parseConsent(raw)).toMatchObject({ analytics: true, marketing: false });
  });

  it("rejects malformed payloads", () => {
    expect(parseConsent("{")).toBeNull();
    expect(parseConsent(JSON.stringify({ analytics: "yes" }))).toBeNull();
  });
});
