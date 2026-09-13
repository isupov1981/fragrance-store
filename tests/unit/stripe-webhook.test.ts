import { describe, expect, it } from "vitest";
import { applyStripeWebhookAction, interpretStripeEvent } from "@/lib/payments/stripe-event";

function event(type: string, orderId = "ord_1", sessionId = "cs_1") {
  return {
    id: `evt_${type}`,
    type,
    data: { object: { id: sessionId, metadata: { orderId }, client_reference_id: orderId } },
  };
}

describe("interpretStripeEvent", () => {
  it("returns duplicate when the event was already processed", () => {
    expect(interpretStripeEvent(event("checkout.session.completed"), true)).toEqual({ kind: "duplicate" });
  });

  it("marks the order paid for completed checkout sessions", () => {
    expect(interpretStripeEvent(event("checkout.session.completed"), false)).toEqual({
      kind: "mark_paid",
      orderId: "ord_1",
      sessionId: "cs_1",
    });
  });

  it("marks the order failed when async payment fails", () => {
    expect(interpretStripeEvent(event("checkout.session.async_payment_failed"), false)).toEqual({
      kind: "mark_failed",
      orderId: "ord_1",
    });
  });

  it("ignores unrelated event types", () => {
    expect(interpretStripeEvent(event("charge.succeeded"), false)).toEqual({ kind: "ignore" });
  });
});

describe("applyStripeWebhookAction", () => {
  it("does not update an order twice for a duplicate event", async function () {
    const updates: unknown[] = [];
    const result = await applyStripeWebhookAction({ kind: "duplicate" }, "evt_dup", {
      findOrder: async () => ({ id: "ord_1", status: "pending" }),
      updateOrder: async (id, update) => {
        updates.push({ id, update });
      },
      markProcessed: async () => {
        throw new Error("should not mark a duplicate");
      },
      sendConfirmation: async () => {
        throw new Error("should not email a duplicate");
      },
    });
    expect(result).toEqual({ received: true, duplicate: true });
    expect(updates).toEqual([]);
  });

  it("pays a pending order once and sends confirmation", async function () {
    const updates: unknown[] = [];
    const emails: string[] = [];
    const processed: string[] = [];
    const result = await applyStripeWebhookAction(
      { kind: "mark_paid", orderId: "ord_1", sessionId: "cs_1" },
      "evt_paid",
      {
        findOrder: async () => ({ id: "ord_1", status: "pending" }),
        updateOrder: async (id, update) => {
          updates.push({ id, update });
        },
        markProcessed: async (id) => {
          processed.push(id);
        },
        sendConfirmation: async (order) => {
          emails.push(order.id);
        },
      },
    );
    expect(result).toEqual({ received: true, duplicate: false });
    expect(updates).toEqual([{ id: "ord_1", update: { status: "paid", paymentReference: "cs_1" } }]);
    expect(emails).toEqual(["ord_1"]);
    expect(processed).toEqual(["evt_paid"]);
  });

  it("does not send another confirmation if the order is already paid", async function () {
    const emails: string[] = [];
    await applyStripeWebhookAction(
      { kind: "mark_paid", orderId: "ord_1", sessionId: "cs_1" },
      "evt_paid_again",
      {
        findOrder: async () => ({ id: "ord_1", status: "paid" }),
        updateOrder: async () => {
          throw new Error("should not update a paid order");
        },
        markProcessed: async () => {},
        sendConfirmation: async (order) => {
          emails.push(order.id);
        },
      },
    );
    expect(emails).toEqual([]);
  });
});
