import Stripe from "stripe";

import {
  findOrder,
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
  updateOrder,
} from "@/lib/checkout/orders";
import { getOrderMailer } from "@/lib/email/mailer";
import { applyStripeWebhookAction, interpretStripeEvent } from "@/lib/payments/stripe-event";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return Response.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(secretKey);
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  try {
    const session = "object" in event.data ? event.data.object : undefined;
    const stripeSession =
      session && typeof session === "object"
        ? {
            id: "id" in session && typeof session.id === "string" ? session.id : undefined,
            metadata:
              "metadata" in session && session.metadata && typeof session.metadata === "object"
                ? { orderId: (session.metadata as { orderId?: string }).orderId }
                : null,
            client_reference_id:
              "client_reference_id" in session && typeof session.client_reference_id === "string"
                ? session.client_reference_id
                : null,
          }
        : {};

    const action = interpretStripeEvent(
      { id: event.id, type: event.type, data: { object: stripeSession } },
      await hasProcessedWebhookEvent(event.id),
    );
    const result = await applyStripeWebhookAction(action, event.id, {
      findOrder,
      updateOrder,
      markProcessed: markWebhookEventProcessed,
      sendConfirmation: async (order) => {
        const record = await findOrder(order.id);
        if (record) await getOrderMailer().sendConfirmation(record);
      },
    });
    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
