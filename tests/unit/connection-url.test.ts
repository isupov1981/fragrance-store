import { describe, expect, it } from "vitest";
import { isPooledDatabaseUrl, resolvePrismaDatabaseUrl } from "@/lib/db/connection-url";

describe("resolvePrismaDatabaseUrl", () => {
  it("caps the Prisma pool and leaves local docker URLs unencrypted", () => {
    const resolved = resolvePrismaDatabaseUrl(
      "postgresql://fragrance:fragrance@localhost:5432/fragrance?schema=public",
    );
    const url = new URL(resolved);
    expect(url.searchParams.get("connection_limit")).toBe("5");
    expect(url.searchParams.get("sslmode")).toBeNull();
    expect(url.searchParams.get("pgbouncer")).toBeNull();
  });

  it("prepares Neon pooled URLs for Prisma + PgBouncer", () => {
    const resolved = resolvePrismaDatabaseUrl(
      "postgresql://user:pass@ep-example-pooler.eu-west-2.aws.neon.tech/neondb",
    );
    const url = new URL(resolved);
    expect(url.searchParams.get("pgbouncer")).toBe("true");
    expect(url.searchParams.get("sslmode")).toBe("require");
    expect(url.searchParams.get("connect_timeout")).toBe("10");
    expect(url.searchParams.get("connection_limit")).toBe("5");
  });

  it("does not overwrite explicit query params", () => {
    const resolved = resolvePrismaDatabaseUrl(
      "postgresql://user:pass@ep-example-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=3",
    );
    const url = new URL(resolved);
    expect(url.searchParams.get("connection_limit")).toBe("3");
    expect(url.searchParams.get("pgbouncer")).toBe("true");
  });
});

describe("isPooledDatabaseUrl", () => {
  it("detects Neon pooler hosts", () => {
    expect(isPooledDatabaseUrl("postgresql://u:p@ep-x-pooler.aws.neon.tech/db")).toBe(true);
    expect(isPooledDatabaseUrl("postgresql://u:p@localhost:5432/db")).toBe(false);
  });
});
