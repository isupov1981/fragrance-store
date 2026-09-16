import type { Order } from "@/lib/checkout/orders";
import { growMajorAmount, type GrowNotifyPayload } from "./grow-event";

const SANDBOX_BASE = "https://sandbox.meshulam.co.il/api/light/server/1.0";
const LIVE_BASE = "https://secure.meshulam.co.il/api/light/server/1.0";

/** Grow is ready only when merchant credentials *and* a webhook secret exist. */
export function isGrowConfigured() {
  return Boolean(
    process.env.GROW_USER_ID?.trim() &&
      process.env.GROW_PAGE_CODE?.trim() &&
      process.env.GROW_WEBHOOK_SECRET?.trim(),
  );
}

export function growApiBase() {
  if (process.env.GROW_API_BASE?.trim()) return process.env.GROW_API_BASE.replace(/\/$/, "");
  return process.env.GROW_SANDBOX === "true" ? SANDBOX_BASE : LIVE_BASE;
}

function sanitize(value: string) {
  return value.replaceAll(/[^\w\s.@+-]/g, " ").replaceAll(/\s+/g, " ").trim();
}

function invoiceName(name: string) {
  const cleaned = sanitize(name);
  return cleaned.includes(" ") ? cleaned : `${cleaned} Customer`;
}

function israeliPhone(phone?: string) {
  const digits = (phone ?? "").replaceAll(/\D/g, "");
  if (digits.startsWith("972") && digits.length >= 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return "";
}

export class GrowCheckoutError extends Error {}

async function postForm(path: string, fields: Record<string, string>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  const response = await fetch(`${growApiBase()}/${path}`, {
    method: "POST",
    body,
  });
  const json = (await response.json().catch(() => null)) as
    | { status?: number; err?: string; data?: Record<string, unknown> }
    | null;
  if (!response.ok || json?.status === 0) {
    throw new Error(json?.err || `Grow ${path} failed (${response.status})`);
  }
  return json?.data ?? {};
}

export async function createGrowPaymentProcess(order: Order, origin: string) {
  const pageCode = process.env.GROW_PAGE_CODE?.trim() ?? "";
  const userId = process.env.GROW_USER_ID?.trim() ?? "";
  const phone = israeliPhone(order.customer.phone);
  if (!phone) {
    throw new GrowCheckoutError("Grow checkout requires an Israeli mobile number (05xxxxxxxx).");
  }

  const secret = process.env.GROW_WEBHOOK_SECRET?.trim();
  const notify = new URL(`${origin}/api/webhooks/grow`);
  if (secret) notify.searchParams.set("secret", secret);

  const description = sanitize(
    order.cart.lines.map((line) => `${line.productName} ${line.variantName}`).join(" ") || "The Perfume Room order",
  );

  const data = await postForm("createPaymentProcess", {
    pageCode,
    userId,
    chargeType: "1",
    sum: growMajorAmount(order.cart.ilsTotal),
    successUrl: `${origin}/${order.locale ?? "en"}/checkout/success?order=${encodeURIComponent(order.id)}`,
    cancelUrl: `${origin}/${order.locale ?? "en"}/checkout/cancel`,
    notifyUrl: notify.toString(),
    description: description.slice(0, 120),
    saveCardToken: "0",
    paymentNum: "1",
    "pageField[fullName]": invoiceName(order.customer.name),
    "pageField[phone]": phone,
    "pageField[email]": order.customer.email,
    cField1: order.id,
    "customFields[cField1]": order.id,
  });

  const url =
    (typeof data.url === "string" && data.url) ||
    (typeof data.paymentPageUrl === "string" && data.paymentPageUrl) ||
    (typeof data.processUrl === "string" && data.processUrl) ||
    "";
  if (!url) throw new Error("Grow did not return a payment page URL");

  const reference =
    (typeof data.processId === "number" && String(data.processId)) ||
    (typeof data.processId === "string" && data.processId) ||
    order.id;

  return { url, reference };
}

export async function approveGrowTransaction(notify: GrowNotifyPayload) {
  const pageCode = process.env.GROW_PAGE_CODE?.trim() ?? "";
  await postForm("approveTransaction", {
    pageCode,
    transactionId: notify.transactionId,
    transactionToken: notify.transactionToken,
    transactionTypeId: notify.transactionTypeId ?? "1",
    paymentType: notify.paymentType ?? "2",
    sum: notify.sum,
    firstPaymentSum: notify.firstPaymentSum ?? notify.sum,
    periodicalPaymentSum: notify.periodicalPaymentSum ?? "0",
    paymentsNum: notify.paymentsNum ?? "1",
    allPaymentsNum: notify.allPaymentsNum ?? "1",
    asmachta: notify.asmachta ?? notify.transactionId,
    description: notify.description ?? "order",
    fullName: invoiceName(notify.fullName ?? "Store Customer"),
    payerPhone: israeliPhone(notify.payerPhone) || "0500000000",
    cardBrandCode: notify.cardBrandCode ?? "3",
    cardExp: notify.cardExp ?? "0000",
  });
}
