import { afterEach, describe, expect, it } from "vitest";
import {
  consumeRateLimit,
  rateLimitPolicies,
  resetRateLimitMemory,
} from "@/lib/security/rate-limit";

afterEach(() => {
  resetRateLimitMemory();
});

describe("rate limit", () => {
  it("allows requests under the limit and blocks after", async () => {
    const config = { name: "test-bucket", limit: 3, windowMs: 60_000 };
    expect((await consumeRateLimit("ip-1", config)).allowed).toBe(true);
    expect((await consumeRateLimit("ip-1", config)).allowed).toBe(true);
    expect((await consumeRateLimit("ip-1", config)).allowed).toBe(true);
    const blocked = await consumeRateLimit("ip-1", config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates keys and exposes admin login policy", async () => {
    const a = await consumeRateLimit("a", rateLimitPolicies.adminLogin);
    const b = await consumeRateLimit("b", rateLimitPolicies.adminLogin);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(rateLimitPolicies.adminLogin.limit).toBe(8);
  });
});
