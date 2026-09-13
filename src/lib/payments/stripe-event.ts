export type StripeWebhookSession = {
  id?: string;
  metadata?: { orderId?: string } | null;
  client_reference_id?: string | null;
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: { object: StripeWebhookSession };
};

export type StripeWebhookAction =
  | { kind: "duplicate" }
  | { kind: "ignore" }
  | { kind: "mark_paid"; orderId: string; sessionId: string }
  | { kind: "mark_failed"; orderId: string };

const paidTypes = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);

export function interpretStripeEvent(event: StripeWebhookEvent, alreadyProcessed: boolean): StripeWebhookAction {
  if (alreadyProcessed) return { kind: "duplicate" };

  const session = event.data.object;
  const orderId = session.metadata?.orderId ?? session.client_reference_id ?? undefined;
  const sessionId = session.id ?? event.id;

  if (paidTypes.has(event.type)) {
    return orderId ? { kind: "mark_paid", orderId, sessionId } : { kind: "ignore" };
  }
  if (event.type === "checkout.session.async_payment_failed") {
    return orderId ? { kind: "mark_failed", orderId } : { kind: "ignore" };
  }
  return { kind: "ignore" };
}

export async function applyStripeWebhookAction(
  action: StripeWebhookAction,
  eventId: string,
  deps: {
    findOrder: (id: string) => Promise<{ id: string; status: string } | undefined>;
    updateOrder: (id: string, update: { status: "paid" | "payment_failed"; paymentReference?: string }) => Promise<unknown>;
    markProcessed: (id: string) => Promise<void>;
    sendConfirmation: (order: { id: string; status: string }) => Promise<void>;
  },
) {
  if (action.kind === "duplicate") {
    return { received: true, duplicate: true as const };
  }

  if (action.kind === "mark_paid") {
    const order = await deps.findOrder(action.orderId);
    if (order && order.status !== "paid") {
      await deps.updateOrder(order.id, { status: "paid", paymentReference: action.sessionId });
      await deps.sendConfirmation({ ...order, status: "paid" });
    }
  } else if (action.kind === "mark_failed") {
    await deps.updateOrder(action.orderId, { status: "payment_failed" });
  }

  await deps.markProcessed(eventId);
  return { received: true, duplicate: false as const };
}
