import { afterEach, describe, expect, it, vi } from "vitest";

describe("envOrdersEnabledDefault", () => {
  const previous = process.env.NEXT_PUBLIC_ORDERS_ENABLED;

  afterEach(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_ORDERS_ENABLED;
    else process.env.NEXT_PUBLIC_ORDERS_ENABLED = previous;
    vi.resetModules();
  });

  it("is false when the env flag is unset", async () => {
    delete process.env.NEXT_PUBLIC_ORDERS_ENABLED;
    vi.resetModules();
    expect((await import("@/lib/commerce")).envOrdersEnabledDefault()).toBe(false);
  });

  it("is false when the env flag is not exactly true", async () => {
    process.env.NEXT_PUBLIC_ORDERS_ENABLED = "false";
    vi.resetModules();
    expect((await import("@/lib/commerce")).envOrdersEnabledDefault()).toBe(false);
  });

  it("is true when NEXT_PUBLIC_ORDERS_ENABLED=true", async () => {
    process.env.NEXT_PUBLIC_ORDERS_ENABLED = "true";
    vi.resetModules();
    expect((await import("@/lib/commerce")).envOrdersEnabledDefault()).toBe(true);
  });
});

describe("assertLivePaymentsForOrders", () => {
  const keys = ["GROW_USER_ID", "GROW_PAGE_CODE", "GROW_WEBHOOK_SECRET", "STRIPE_SECRET_KEY"] as const;
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  afterEach(() => {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("allows enabling orders outside production with demo payments", async () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.GROW_USER_ID;
    delete process.env.STRIPE_SECRET_KEY;
    const { assertLivePaymentsForOrders } = await import("@/lib/payments/provider");
    expect(() => assertLivePaymentsForOrders(true)).not.toThrow();
  });

  it("rejects enabling orders in production with demo payments", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.GROW_USER_ID;
    delete process.env.GROW_PAGE_CODE;
    delete process.env.GROW_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    const { assertLivePaymentsForOrders } = await import("@/lib/payments/provider");
    expect(() => assertLivePaymentsForOrders(true)).toThrow(/Grow or Stripe/);
  });
});
