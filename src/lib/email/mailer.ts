import nodemailer from "nodemailer";

import type { Order } from "@/lib/checkout/orders";
import type { Locale } from "@/lib/i18n/config";

export type NewArrivalMail = {
  to: string;
  locale: Locale;
  productName: string;
  productUrl: string;
  priceLabel: string;
  /** Absolute HTTPS URL of the product photo. */
  imageUrl: string;
  brand?: string | null;
  /** When false, omit the "from price" line (e.g. price is 0). */
  showPrice?: boolean;
  unsubscribeUrl: string;
};

export interface OrderMailer {
  sendConfirmation(order: Order): Promise<void>;
  sendEnquiry(input: { name: string; email: string; subject: string; message: string }): Promise<void>;
  sendNewArrival(input: NewArrivalMail): Promise<void>;
}

class NoopOrderMailer implements OrderMailer {
  async sendConfirmation() {}
  async sendEnquiry() {}
  async sendNewArrival() {}
}

class SmtpOrderMailer implements OrderMailer {
  private transport() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
    });
  }

  async sendConfirmation(order: Order) {
    const from = process.env.EMAIL_FROM ?? process.env.ORDER_FROM_EMAIL ?? "orders@example.com";
    const admin = process.env.ORDER_ADMIN_EMAIL;
    await this.transport().sendMail({
      from,
      to: order.customer.email,
      ...(admin ? { bcc: admin } : {}),
      subject: `Order ${order.id} confirmed`,
      text: [
        `Thank you, ${order.customer.name}.`,
        `Your order ${order.id} has been paid.`,
        `Total: ${(order.cart.subtotal / 100).toFixed(2)} ${order.cart.currency.toUpperCase()}`,
      ].join("\n"),
    });
  }

  async sendEnquiry(input: { name: string; email: string; subject: string; message: string }) {
    const from = process.env.EMAIL_FROM ?? process.env.ORDER_FROM_EMAIL ?? "concierge@example.com";
    await this.transport().sendMail({
      from,
      to: process.env.ORDER_ADMIN_EMAIL ?? from,
      replyTo: input.email,
      subject: `Atelier enquiry: ${input.subject}`,
      text: [`From: ${input.name} <${input.email}>`, "", input.message].join("\n"),
    });
  }

  async sendNewArrival(input: NewArrivalMail) {
    const from = process.env.EMAIL_FROM ?? process.env.ORDER_FROM_EMAIL ?? "notes@example.com";
    const showPrice = input.showPrice !== false && Boolean(input.priceLabel.trim());
    const copy = newArrivalCopy(input.locale, input.productName, input.priceLabel, showPrice);
    const brand = input.brand?.trim();

    const text = [
      copy.greeting,
      "",
      copy.body,
      brand ? brand : null,
      input.productName,
      input.productUrl,
      showPrice ? copy.price : null,
      "",
      copy.cta,
      input.productUrl,
      "",
      copy.unsubscribe,
      input.unsubscribeUrl,
    ]
      .filter((line): line is string => line != null)
      .join("\n");

    const html = buildNewArrivalHtml({
      copy,
      productName: input.productName,
      productUrl: input.productUrl,
      imageUrl: input.imageUrl,
      brand,
      showPrice,
      unsubscribeUrl: input.unsubscribeUrl,
      locale: input.locale,
    });

    await this.transport().sendMail({
      from,
      to: input.to,
      subject: copy.subject,
      text,
      html,
      headers: {
        "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  }
}

function newArrivalCopy(locale: Locale, productName: string, priceLabel: string, showPrice: boolean) {
  if (locale === "he") {
    return {
      subject: `חדש באטלייה: ${productName}`,
      greeting: "שלום,",
      body: `נוסף ניחוח חדש לקולקציה — ${productName}.`,
      price: showPrice ? `החל מ־${priceLabel}` : "",
      cta: "לצפייה בניחוח",
      unsubscribe: "להסרה מרשימת התפוצה",
      eyebrow: "חדש באתר",
    };
  }
  if (locale === "ru") {
    return {
      subject: `Новинка в ателье: ${productName}`,
      greeting: "Здравствуйте,",
      body: `В коллекции появился новый аромат — ${productName}.`,
      price: showPrice ? `От ${priceLabel}` : "",
      cta: "Смотреть аромат",
      unsubscribe: "Отписаться от рассылки",
      eyebrow: "Новинка",
    };
  }
  return {
    subject: `New from the atelier: ${productName}`,
    greeting: "Hello,",
    body: `A new fragrance has joined the collection — ${productName}.`,
    price: showPrice ? `From ${priceLabel}` : "",
    cta: "View fragrance",
    unsubscribe: "Unsubscribe from these notes",
    eyebrow: "New arrival",
  };
}

function buildNewArrivalHtml(input: {
  copy: ReturnType<typeof newArrivalCopy>;
  productName: string;
  productUrl: string;
  imageUrl: string;
  brand?: string;
  showPrice: boolean;
  unsubscribeUrl: string;
  locale: Locale;
}) {
  const dir = input.locale === "he" ? "rtl" : "ltr";
  const brandLine = input.brand
    ? `<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8178;">${escapeHtml(input.brand)}</p>`
    : "";
  const priceLine = input.showPrice
    ? `<p style="margin:12px 0 0;font-size:14px;color:#5c534a;">${escapeHtml(input.copy.price)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="${escapeAttr(input.locale)}" dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f3ed;color:#201d19;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ed;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffcf7;border:1px solid #e6e0d6;">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9a8570;">${escapeHtml(input.copy.eyebrow)}</p>
              <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:#5c534a;">${escapeHtml(input.copy.greeting)}</p>
              <p style="margin:10px 0 0;font-size:15px;line-height:1.7;color:#5c534a;">${escapeHtml(input.copy.body)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;">
              <a href="${escapeAttr(input.productUrl)}" style="display:block;text-decoration:none;">
                <img src="${escapeAttr(input.imageUrl)}" alt="${escapeAttr(input.productName)}" width="504" style="display:block;width:100%;max-width:504px;height:auto;border:0;background:#ebe6de;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px 8px;text-align:center;">
              ${brandLine}
              <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:normal;color:#201d19;">${escapeHtml(input.productName)}</h1>
              ${priceLine}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 28px 28px;">
              <a href="${escapeAttr(input.productUrl)}" style="display:inline-block;background:#201d19;color:#fffcf7;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">${escapeHtml(input.copy.cta)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a8178;">
              <a href="${escapeAttr(input.unsubscribeUrl)}" style="color:#8a8178;">${escapeHtml(input.copy.unsubscribe)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim());
}

export function getOrderMailer(): OrderMailer {
  return isSmtpConfigured() ? new SmtpOrderMailer() : new NoopOrderMailer();
}
