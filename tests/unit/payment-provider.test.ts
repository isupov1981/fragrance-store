import { afterEach, describe, expect, it } from "vitest";
import { getPaymentProvider } from "@/lib/payments/provider";

const keys = ["GROW_USER_ID", "GROW_PAGE_CODE", "STRIPE_SECRET_KEY"] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe("getPaymentProvider", () => {
  it("uses demo until Grow credentials exist", () => {
    delete process.env.GROW_USER_ID;
    delete process.env.GROW_PAGE_CODE;
    delete process.env.STRIPE_SECRET_KEY;
    expect(getPaymentProvider().name).toBe("demo");
  });

  it("prefers Grow over Stripe when both are set", () => {
    process.env.GROW_USER_ID = "user";
    process.env.GROW_PAGE_CODE = "page";
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    expect(getPaymentProvider().name).toBe("grow");
  });
});
