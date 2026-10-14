import { beforeAll, describe, expect, it, vi } from "vitest";

const expireStaleReservations = vi.fn(async () => 2);
vi.mock("@/lib/inventory/service", () => ({ expireStaleReservations }));

function cronRequest(token: string) {
  return new Request("http://localhost/api/cron/inventory-reservations", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("inventory reservation cron", () => {
  beforeAll(() => {
    process.env.CRON_SECRET = "cron-secret-for-tests-0123456789";
  });

  it("rejects calls without the cron token", async () => {
    const { POST } = await import("@/app/api/cron/inventory-reservations/route");
    const response = await POST(cronRequest("wrong"));
    expect(response.status).toBe(401);
    expect(expireStaleReservations).not.toHaveBeenCalled();
  });

  it("runs once, then skips repeat calls within the hour without querying", async () => {
    const { POST } = await import("@/app/api/cron/inventory-reservations/route");
    const first = await POST(cronRequest("cron-secret-for-tests-0123456789"));
    expect(await first.json()).toEqual({ released: 2 });

    const second = await POST(cronRequest("cron-secret-for-tests-0123456789"));
    expect(await second.json()).toEqual({ released: 0, skipped: true });
    expect(expireStaleReservations).toHaveBeenCalledTimes(1);
  });
});
