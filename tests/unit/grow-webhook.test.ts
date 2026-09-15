import { describe, expect, it } from "vitest";
import {
  applyGrowWebhookAction,
  growAmountsMatch,
  interpretGrowNotify,
  parseGrowNotify,
} from "@/lib/payments/grow-event";

const payload = {
  transactionId: "79755",
  transactionToken: "abc",
  sum: "669.96",
  cField1: "ord_1",
};

describe("parseGrowNotify", () => {
  it("reads nested customFields[cField1] from form posts", () => {
    expect(
      parseGrowNotify({
        transactionId: "1",
        transactionToken: "tok",
        sum: "10.00",
        "customFields[cField1]": "ord_nested",
      })?.cField1,
    ).toBe("ord_nested");
  });
});

describe("growAmountsMatch", () => {
  it("compares Grow major units to ILS agorot", () => {
    expect(growAmountsMatch("669.96", 66996)).toBe(true);
    expect(growAmountsMatch("10", 1000)).toBe(true);
    expect(growAmountsMatch("10.01", 1000)).toBe(false);
  });
});

describe("interpretGrowNotify", () => {
  it("rejects unauthorized callbacks", () => {
    expect(
      interpretGrowNotify({ authorized: false, alreadyProcessed: false, payload, order: { id: "ord_1", status: "pending", ilsTotal: 66996 } }),
    ).toEqual({ kind: "unauthorized" });
  });

  it("marks a matching pending order paid", () => {
    expect(
      interpretGrowNotify({
        authorized: true,
        alreadyProcessed: false,
        payload,
        order: { id: "ord_1", status: "pending", ilsTotal: 66996 },
      }),
    ).toEqual({
      kind: "mark_paid",
      orderId: "ord_1",
      transactionId: "79755",
      notify: payload,
    });
  });

  it("rejects amount mismatches", () => {
    expect(
      interpretGrowNotify({
        authorized: true,
        alreadyProcessed: false,
        payload,
        order: { id: "ord_1", status: "pending", ilsTotal: 100 },
      }),
    ).toEqual({ kind: "amount_mismatch", orderId: "ord_1" });
  });
});

describe("applyGrowWebhookAction", () => {
  it("approves then pays a pending order once", async () => {
    const updates: unknown[] = [];
    const approved: string[] = [];
    const result = await applyGrowWebhookAction(
      { kind: "mark_paid", orderId: "ord_1", transactionId: "79755", notify: payload },
      "grow_79755_abc",
      {
        findOrder: async () => ({ id: "ord_1", status: "pending" }),
        updateOrder: async (id, update) => {
          updates.push({ id, update });
        },
        markProcessed: async () => {},
        sendConfirmation: async () => {},
        approveTransaction: async (notify) => {
          approved.push(notify.transactionId);
        },
      },
    );
    expect(result.status).toBe(200);
    expect(approved).toEqual(["79755"]);
    expect(updates).toEqual([{ id: "ord_1", update: { status: "paid", paymentReference: "79755" } }]);
  });
});
