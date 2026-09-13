import Stripe from "stripe";

import {
  findOrder,
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
  updateOrder,
} from "@/lib/checkout/orders";
import { getOrderMailer } from "@/lib/email/mailer";

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

  if (await hasProcessedWebhookEvent(event.id)) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      const orderId = session.metadata?.orderId ?? session.client_reference_id;
      const order = orderId ? await findOrder(orderId) : undefined;
      if (order && order.status !== "paid") {
        await updateOrder(order.id, {
          status: "paid",
          paymentReference: session.id,
        });
        await getOrderMailer().sendConfirmation(order);
      }
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId ?? session.client_reference_id;
      if (orderId) await updateOrder(orderId, { status: "payment_failed" });
    }
    await markWebhookEventProcessed(event.id);
    return Response.json({ received: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
