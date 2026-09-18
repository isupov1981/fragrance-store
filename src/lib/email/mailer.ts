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
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure =
      process.env.SMTP_SECURE === "true" || port === 465;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      requireTLS: !secure && port === 587,
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 30_000,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
    });
  }

  async verify() {
    await this.transport().verify();
  }

  async sendConfirmation(order: Order) {
    const from = process.env.EMAIL_FROM ?? process.env.ORDER_FROM_EMAIL ?? "The Perfume Room <noreply@parfums.cloud>";
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
    const from = process.env.EMAIL_FROM ?? process.env.ORDER_FROM_EMAIL ?? "The Perfume Room <noreply@parfums.cloud>";
    await this.transport().sendMail({
      from,
      to: process.env.ORDER_ADMIN_EMAIL ?? from,
      replyTo: input.email,
      subject: `Atelier enquiry: ${input.subject}`,
      text: [`From: ${input.name} <${input.email}>`, "", input.message].join("\n"),
    });
  }

  async sendNewArrival(input: NewArrivalMail) {
    const from = process.env.EMAIL_FROM ?? process.env.ORDER_FROM_EMAIL ?? "The Perfume Room <noreply@parfums.cloud>";
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
      body: `נוסף ניחוח חדש לקולקציה — \u200F${productName}.`,
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
  const isHe = input.locale === "he";
  const dir = isHe ? "rtl" : "ltr";
  const textAlign = isHe ? "right" : "left";
  /** Elegant Hebrew stack + Latin fallbacks; Google Fonts load where clients allow. */
  const bodyFont = isHe
    ? "'Frank Ruhl Libre','Noto Serif Hebrew',David,'Times New Roman',Georgia,serif"
    : "Georgia,'Times New Roman',serif";
  const uiFont = isHe
    ? "'Assistant','Noto Sans Hebrew',Arial,Helvetica,sans-serif"
    : "Arial,Helvetica,sans-serif";
  const fontLink = isHe
    ? `<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600&family=Frank+Ruhl+Libre:wght@400;500;700&display=swap" rel="stylesheet">`
    : "";

  const brandLine = input.brand
    ? `<p style="margin:0 0 6px;font-family:${uiFont};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8178;text-align:center;">${escapeHtml(input.brand)}</p>`
    : "";
  const priceLine = input.showPrice
    ? `<p dir="${dir}" style="margin:12px 0 0;font-family:${bodyFont};font-size:15px;color:#5c534a;text-align:center;">${escapeHtml(input.copy.price)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="${escapeAttr(input.locale)}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${fontLink}
</head>
<body dir="${dir}" style="margin:0;padding:0;background:#f6f3ed;color:#201d19;font-family:${bodyFont};direction:${dir};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="${dir}" style="background:#f6f3ed;padding:32px 16px;direction:${dir};">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="${dir}" style="max-width:560px;background:#fffcf7;border:1px solid #e6e0d6;direction:${dir};">
          <tr>
            <td dir="${dir}" align="${isHe ? "right" : "left"}" style="padding:28px 28px 12px;text-align:${textAlign};direction:${dir};font-family:${bodyFont};">
              <p dir="${dir}" style="margin:0;font-family:${uiFont};font-size:11px;letter-spacing:${isHe ? "0.08em" : "0.2em"};text-transform:uppercase;color:#9a8570;text-align:${textAlign};direction:${dir};">${escapeHtml(input.copy.eyebrow)}</p>
              <p dir="${dir}" style="margin:14px 0 0;font-family:${bodyFont};font-size:17px;line-height:1.65;color:#5c534a;text-align:${textAlign};direction:${dir};">${escapeHtml(input.copy.greeting)}</p>
              <p dir="${dir}" style="margin:10px 0 0;font-family:${bodyFont};font-size:17px;line-height:1.75;color:#5c534a;text-align:${textAlign};direction:${dir};">${escapeHtml(input.copy.body)}</p>
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
            <td align="center" style="padding:22px 28px 8px;text-align:center;font-family:${bodyFont};">
              ${brandLine}
              <h1 style="margin:0;font-family:${bodyFont};font-size:30px;line-height:1.25;font-weight:500;color:#201d19;text-align:center;">${escapeHtml(input.productName)}</h1>
              ${priceLine}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 28px 28px;text-align:center;">
              <a href="${escapeAttr(input.productUrl)}" style="display:inline-block;background:#201d19;color:#fffcf7;font-family:${uiFont};font-size:13px;letter-spacing:${isHe ? "0.06em" : "0.16em"};${isHe ? "" : "text-transform:uppercase;"};text-decoration:none;padding:14px 28px;">${escapeHtml(input.copy.cta)}</a>
            </td>
          </tr>
          <tr>
            <td dir="${dir}" align="center" style="padding:0 28px 28px;text-align:center;font-family:${uiFont};font-size:13px;color:#8a8178;direction:${dir};">
              <a href="${escapeAttr(input.unsubscribeUrl)}" style="color:#8a8178;font-family:${uiFont};text-decoration:underline;">${escapeHtml(input.copy.unsubscribe)}</a>
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
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASSWORD?.trim(),
  );
}

export function getOrderMailer(): OrderMailer {
  return isSmtpConfigured() ? new SmtpOrderMailer() : new NoopOrderMailer();
}

/** Probe SMTP credentials; returns null when ok, or a short error message. */
export async function probeSmtp(): Promise<string | null> {
  if (!isSmtpConfigured()) return "SMTP is not configured";
  try {
    await new SmtpOrderMailer().verify();
    return null;
  } catch (error) {
    return smtpErrorMessage(error);
  }
}

export function smtpErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Unknown SMTP error";
  const withCode = error as Error & { code?: string; response?: string; responseCode?: number };
  const parts = [withCode.message];
  if (withCode.code) parts.push(`code=${withCode.code}`);
  if (withCode.responseCode) parts.push(`smtp=${withCode.responseCode}`);
  if (withCode.response) parts.push(String(withCode.response).slice(0, 180));
  return parts.filter(Boolean).join(" · ");
}
