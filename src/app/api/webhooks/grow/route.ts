import {
  findOrder,
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
  updateOrder,
} from "@/lib/checkout/orders";
import { getOrderMailer } from "@/lib/email/mailer";
import { applyGrowWebhookAction, interpretGrowNotify, parseGrowNotify } from "@/lib/payments/grow-event";
import { approveGrowTransaction, isGrowConfigured } from "@/lib/payments/grow";

export const runtime = "nodejs";

async function readNotifyBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = await request.json().catch(() => null);
    return json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  }
  const text = await request.text();
  const params = new URLSearchParams(text);
  const record: Record<string, unknown> = {};
  for (const [key, value] of params.entries()) record[key] = value;
  return record;
}

export async function POST(request: Request) {
  if (!isGrowConfigured()) {
    return Response.json({ error: "Grow webhook is not configured" }, { status: 503 });
  }

  const expected = process.env.GROW_WEBHOOK_SECRET?.trim();
  const provided = new URL(request.url).searchParams.get("secret") ?? "";
  const authorized = !expected || provided === expected;

  try {
    const payload = parseGrowNotify(await readNotifyBody(request));
    const eventId = payload
      ? `grow_${payload.transactionId}_${payload.transactionToken}`
      : `grow_${crypto.randomUUID()}`;
    const order = payload?.cField1 ? await findOrder(payload.cField1) : undefined;
    const action = interpretGrowNotify({
      authorized,
      alreadyProcessed: await hasProcessedWebhookEvent(eventId),
      payload,
      order: order
        ? { id: order.id, status: order.status, ilsTotal: order.cart.ilsTotal }
        : null,
    });
    const result = await applyGrowWebhookAction(action, eventId, {
      findOrder,
      updateOrder,
      markProcessed: markWebhookEventProcessed,
      sendConfirmation: async (paid) => {
        const record = await findOrder(paid.id);
        if (record) await getOrderMailer().sendConfirmation(record);
      },
      approveTransaction: approveGrowTransaction,
    });
    return Response.json(result, { status: result.status });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
