import { afterEach, describe, expect, it } from "vitest";

import { resolveMailFrom } from "@/lib/email/mailer";

const envKeys = ["SMTP_USER", "EMAIL_FROM", "ORDER_FROM_EMAIL"] as const;
const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
});

describe("resolveMailFrom", () => {
  it("uses the authenticated mailbox when EMAIL_FROM is a different address", () => {
    process.env.SMTP_USER = "orders@parfums.cloud";
    process.env.EMAIL_FROM = "The Perfume Room <noreply@parfums.cloud>";
    delete process.env.ORDER_FROM_EMAIL;
    expect(resolveMailFrom()).toBe("The Perfume Room <orders@parfums.cloud>");
  });

  it("keeps EMAIL_FROM when it matches SMTP_USER", () => {
    process.env.SMTP_USER = "orders@parfums.cloud";
    process.env.EMAIL_FROM = "The Perfume Room <orders@parfums.cloud>";
    expect(resolveMailFrom()).toBe("The Perfume Room <orders@parfums.cloud>");
  });
});
