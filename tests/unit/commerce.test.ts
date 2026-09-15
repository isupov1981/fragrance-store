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
