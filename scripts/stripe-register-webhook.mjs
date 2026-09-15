#!/usr/bin/env node
/**
 * Create (or reuse) the Stripe webhook for parfums.cloud.
 *
 *   node --env-file=.env.production scripts/stripe-register-webhook.mjs
 *
 * Prints STRIPE_WEBHOOK_SECRET once for new endpoints. Add it to hPanel and rebuild.
 */
import Stripe from "stripe";
import { loadEnvFiles } from "./prisma-env.mjs";

loadEnvFiles();

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error("Set STRIPE_SECRET_KEY (Stripe Dashboard → Developers → API keys).");
  process.exit(1);
}

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://parfums.cloud").replace(/\/$/, "");
const url = `${site}/api/webhooks/stripe`;
const enabledEvents = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
];

const stripe = new Stripe(secret);

async function main() {
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const match = existing.data.find((endpoint) => endpoint.url === url);
  if (match) {
    await stripe.webhookEndpoints.update(match.id, { enabled_events: enabledEvents });
    console.log(`Updated existing webhook ${match.id}`);
    console.log(`URL ${url}`);
    console.log("Signing secret is only shown when the endpoint is first created. Reuse STRIPE_WEBHOOK_SECRET in hPanel.");
    return;
  }

  const created = await stripe.webhookEndpoints.create({
    url,
    enabled_events: enabledEvents,
    description: "The Perfume Room checkout",
  });
  console.log(`Created webhook ${created.id}`);
  console.log(`URL ${url}`);
  if (created.secret) {
    console.log(`STRIPE_WEBHOOK_SECRET=${created.secret}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
