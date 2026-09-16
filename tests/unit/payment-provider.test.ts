import { afterEach, describe, expect, it, vi } from "vitest";
import { getPaymentProvider, hasLivePaymentProvider, ordersBlockedByDemoPayments } from "@/lib/payments/provider";
import { isGrowConfigured } from "@/lib/payments/grow";

const keys = ["GROW_USER_ID", "GROW_PAGE_CODE", "GROW_WEBHOOK_SECRET", "STRIPE_SECRET_KEY"] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
  vi.unstubAllEnvs();
});

describe("getPaymentProvider", () => {
  it("uses demo until Grow credentials exist", () => {
    delete process.env.GROW_USER_ID;
    delete process.env.GROW_PAGE_CODE;
    delete process.env.GROW_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    expect(getPaymentProvider().name).toBe("demo");
    expect(hasLivePaymentProvider()).toBe(false);
  });

  it("does not treat Grow as configured without webhook secret", () => {
    process.env.GROW_USER_ID = "user";
    process.env.GROW_PAGE_CODE = "page";
    delete process.env.GROW_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    expect(isGrowConfigured()).toBe(false);
    expect(getPaymentProvider().name).toBe("demo");
  });

  it("prefers Grow over Stripe when fully configured", () => {
    process.env.GROW_USER_ID = "user";
    process.env.GROW_PAGE_CODE = "page";
    process.env.GROW_WEBHOOK_SECRET = "grow-webhook-secret";
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    expect(isGrowConfigured()).toBe(true);
    expect(getPaymentProvider().name).toBe("grow");
    expect(hasLivePaymentProvider()).toBe(true);
  });

  it("blocks demo orders only in production", () => {
    delete process.env.GROW_USER_ID;
    delete process.env.GROW_PAGE_CODE;
    delete process.env.GROW_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    vi.stubEnv("NODE_ENV", "development");
    expect(ordersBlockedByDemoPayments()).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    expect(ordersBlockedByDemoPayments()).toBe(true);
  });
});
