import { afterEach, describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  buildHstsHeader,
  cspHeaderName,
} from "@/lib/security/headers";

const originalEnforce = process.env.CSP_ENFORCE;
const originalPreload = process.env.HSTS_PRELOAD;

afterEach(() => {
  if (originalEnforce === undefined) delete process.env.CSP_ENFORCE;
  else process.env.CSP_ENFORCE = originalEnforce;
  if (originalPreload === undefined) delete process.env.HSTS_PRELOAD;
  else process.env.HSTS_PRELOAD = originalPreload;
});

describe("security headers", () => {
  it("builds a nonce-aware CSP and defaults to report-only", () => {
    delete process.env.CSP_ENFORCE;
    const csp = buildContentSecurityPolicy("abc123");
    expect(csp).toContain("script-src 'self' 'nonce-abc123'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(cspHeaderName()).toBe("Content-Security-Policy-Report-Only");
  });

  it("switches to enforcing CSP and optional HSTS preload", () => {
    process.env.CSP_ENFORCE = "true";
    process.env.HSTS_PRELOAD = "true";
    expect(cspHeaderName()).toBe("Content-Security-Policy");
    expect(buildHstsHeader()).toBe("max-age=31536000; includeSubDomains; preload");
  });
});
