import Stripe from "stripe";

import type { Order } from "@/lib/checkout/orders";
import { createGrowPaymentProcess, isGrowConfigured } from "./grow";

export type PaymentSession = {
  provider: "grow" | "stripe" | "demo";
  reference: string;
  redirectUrl: string;
  paid: boolean;
};

export interface PaymentProvider {
  readonly name: PaymentSession["provider"];
  createSession(order: Order, origin: string): Promise<PaymentSession>;
}

class DemoPaymentProvider implements PaymentProvider {
  readonly name = "demo";

  async createSession(order: Order, origin: string): Promise<PaymentSession> {
    const locale = order.locale ?? "en";
    return {
      provider: this.name,
      reference: `demo_${order.id}`,
      redirectUrl: `${origin}/${locale}/checkout/success?order=${encodeURIComponent(order.id)}&demo=1`,
      paid: true,
    };
  }
}

class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  constructor(private readonly secretKey: string) {}

  async createSession(order: Order, origin: string): Promise<PaymentSession> {
    const stripe = new Stripe(this.secretKey);
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: order.customer.email,
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        line_items: [
          ...order.cart.lines.map((line) => ({
            quantity: line.quantity,
            price_data: {
              currency: order.cart.currency,
              unit_amount: line.unitPrice,
              product_data: {
                name: `${line.productName} — ${line.variantName}`,
                metadata: { sku: line.sku, variantId: line.variantId },
              },
            },
          })),
          ...(order.cart.shippingTotal
            ? [{
                quantity: 1,
                price_data: {
                  currency: order.cart.currency,
                  unit_amount: order.cart.shippingTotal,
                  product_data: { name: "Shipping" },
                },
              }]
            : []),
        ],
        success_url: `${origin}/${order.locale ?? "en"}/checkout/success?order=${encodeURIComponent(order.id)}`,
        cancel_url: `${origin}/${order.locale ?? "en"}/checkout/cancel`,
      },
      { idempotencyKey: order.idempotencyKey },
    );

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return {
      provider: this.name,
      reference: session.id,
      redirectUrl: session.url,
      paid: false,
    };
  }
}

class GrowPaymentProvider implements PaymentProvider {
  readonly name = "grow" as const;

  async createSession(order: Order, origin: string): Promise<PaymentSession> {
    const session = await createGrowPaymentProcess(order, origin);
    return {
      provider: this.name,
      reference: session.reference,
      redirectUrl: session.url,
      paid: false,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (isGrowConfigured()) return new GrowPaymentProvider();
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key ? new StripePaymentProvider(key) : new DemoPaymentProvider();
}

/** True when a real acquirer (Grow or Stripe) is configured. */
export function hasLivePaymentProvider() {
  return getPaymentProvider().name !== "demo";
}

/**
 * Production must never accept orders through the demo provider
 * (which marks orders paid without charging).
 */
export function assertLivePaymentsForOrders(enabled: boolean) {
  if (!enabled) return;
  if (process.env.NODE_ENV !== "production") return;
  if (hasLivePaymentProvider()) return;
  throw new Error(
    "Cannot enable ordering in production without Grow or Stripe credentials",
  );
}

export function ordersBlockedByDemoPayments() {
  return process.env.NODE_ENV === "production" && !hasLivePaymentProvider();
}
