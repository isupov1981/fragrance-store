import { NextResponse } from "next/server";

import { priceCheckoutItems, CheckoutPricingError } from "@/lib/checkout/pricing";
import {
  findOrderByIdempotencyKey,
  saveOrder,
  type Order,
} from "@/lib/checkout/orders";
import { checkoutSchema } from "@/lib/checkout/schema";
import { getOrdersEnabled } from "@/lib/commerce";
import { getOrderMailer } from "@/lib/email/mailer";
import { GrowCheckoutError } from "@/lib/payments/grow";
import { getPaymentProvider } from "@/lib/payments/provider";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getOrdersEnabled())) {
    return NextResponse.json(
      { error: "Ordering is temporarily unavailable" },
      { status: 503 },
    );
  }

  try {
    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout data", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const existing = await findOrderByIdempotencyKey(parsed.data.idempotencyKey);
    if (existing) {
      return NextResponse.json({
        orderId: existing.id,
        status: existing.status,
        redirectUrl: existing.paymentUrl,
      });
    }

    const provider = getPaymentProvider();
    const cart = await priceCheckoutItems(
      parsed.data.items,
      parsed.data.shippingMethod,
      provider.name === "grow" ? "ILS" : parsed.data.currency,
    );
    const order: Order = {
      id: crypto.randomUUID(),
      idempotencyKey: parsed.data.idempotencyKey,
      customer: parsed.data.customer,
      cart,
      paymentProvider: provider.name,
      status: "pending",
      createdAt: new Date().toISOString(),
      locale: parsed.data.locale,
    };
    const configuredOrigin = process.env.APP_URL?.replace(/\/$/, "");
    const origin = configuredOrigin ?? new URL(request.url).origin;
    const payment = await provider.createSession(order, origin);
    order.paymentReference = payment.reference;
    order.paymentUrl = payment.redirectUrl;
    order.status = payment.paid ? "paid" : "pending";
    await saveOrder(order);

    if (payment.paid) {
      await getOrderMailer().sendConfirmation(order).catch(console.error);
    }

    return NextResponse.json(
      {
        orderId: order.id,
        status: order.status,
        redirectUrl: payment.redirectUrl,
        demo: payment.provider === "demo",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof GrowCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof CheckoutPricingError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Unable to start checkout" },
      { status: 500 },
    );
  }
}
