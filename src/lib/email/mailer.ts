import nodemailer from "nodemailer";

import type { Order } from "@/lib/checkout/orders";
import { buildOrderDisclosure, type SupplyChannel } from "@/lib/email/disclosure";
import { listStoreProducts } from "@/lib/db/products";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";

export type NewArrivalMailProduct = {
  productName: string;
  productUrl: string;
  priceLabel: string;
  /** Absolute HTTPS URL of the product photo. */
  imageUrl: string;
  brand?: string | null;
  /** When false, omit the "from price" line (e.g. price is 0). */
  showPrice?: boolean;
};

export type NewArrivalMail = {
  to: string;
  locale: Locale;
  products: NewArrivalMailProduct[];
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
    const from = resolveMailFrom();
    const admin = process.env.ORDER_ADMIN_EMAIL;
    const copy = orderConfirmationCopy(await withProductDisclosure(order));
    await this.transport().sendMail({
      from,
      to: order.customer.email,
      ...(admin ? { bcc: admin } : {}),
      subject: copy.subject,
      text: copy.text,
    });
  }

  async sendEnquiry(input: { name: string; email: string; subject: string; message: string }) {
    const from = resolveMailFrom();
    await this.transport().sendMail({
      from,
      to: process.env.ORDER_ADMIN_EMAIL ?? from,
      replyTo: input.email,
      subject: `Atelier enquiry: ${input.subject}`,
      text: [`From: ${input.name} <${input.email}>`, "", input.message].join("\n"),
    });
  }

  async sendNewArrival(input: NewArrivalMail) {
    const from = resolveMailFrom();
    const products = input.products.filter((product) => product.productName.trim() && product.productUrl.trim());
    if (!products.length) return;
    const copy = newArrivalCopy(input.locale, products);

    const textBlocks = products.flatMap((product) => {
      const brand = product.brand?.trim();
      const showPrice = product.showPrice !== false && Boolean(product.priceLabel.trim());
      return [
        brand || null,
        product.productName,
        product.productUrl,
        showPrice ? priceLine(input.locale, product.priceLabel) : null,
        "",
      ];
    });

    const text = [
      copy.greeting,
      "",
      copy.body,
      "",
      ...textBlocks,
      copy.unsubscribe,
      input.unsubscribeUrl,
      "",
      copy.advertiser,
    ]
      .filter((line): line is string => line != null)
      .join("\n");

    const html = buildNewArrivalHtml({
      copy,
      products,
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

/** Hostinger rejects a From address that is not the authenticated mailbox. */
export function resolveMailFrom() {
  const user = process.env.SMTP_USER?.trim();
  const configured = (process.env.EMAIL_FROM ?? process.env.ORDER_FROM_EMAIL ?? "").trim();
  const parsed = configured ? parseMailbox(configured) : undefined;
  const name = parsed?.name || "The Perfume Room";
  if (user) {
    const configuredAddress = parsed?.address.toLowerCase();
    if (!configuredAddress || configuredAddress !== user.toLowerCase()) {
      return `${name} <${user}>`;
    }
  }
  if (parsed?.name) return `${parsed.name} <${parsed.address}>`;
  if (parsed?.address) return parsed.address;
  return user ? `${name} <${user}>` : `${name} <orders@parfums.cloud>`;
}

function parseMailbox(value: string): { name?: string; address: string } {
  const trimmed = value.trim();
  const wrapped = trimmed.match(/^(?:"([^"]+)"|([^<]+?))?\s*<([^>]+)>\s*$/);
  if (wrapped) {
    const name = (wrapped[1] ?? wrapped[2] ?? "").trim();
    return { name: name || undefined, address: wrapped[3].trim() };
  }
  return { address: trimmed };
}

function priceLine(locale: Locale, priceLabel: string) {
  if (locale === "he") return `החל מ־${priceLabel}`;
  if (locale === "ru") return `От ${priceLabel}`;
  return `From ${priceLabel}`;
}

function newArrivalCopy(locale: Locale, products: NewArrivalMailProduct[]) {
  const many = products.length > 1;
  const productName = products[0]?.productName ?? "";
  if (locale === "he") {
    return {
      subject: many ? "פרסומת: חדשים באטלייה" : `פרסומת: חדש באטלייה: ${productName}`,
      greeting: "שלום,",
      body: many
        ? "נוספו ניחוחות חדשים לקולקציה."
        : `נוסף ניחוח חדש לקולקציה — \u200F${productName}.`,
      cta: "לצפייה בניחוח",
      unsubscribe: "להסרה מרשימת התפוצה",
      eyebrow: many ? "פרסומת · חדשים באתר" : "פרסומת · חדש באתר",
      advertiser: "The Perfume Room · orders@parfums.cloud",
    };
  }
  if (locale === "ru") {
    return {
      subject: many ? "Реклама: Новинки в ателье" : `Реклама: Новинка в ателье: ${productName}`,
      greeting: "Здравствуйте,",
      body: many
        ? "В коллекции появились новые ароматы."
        : `В коллекции появился новый аромат — ${productName}.`,
      cta: "Смотреть аромат",
      unsubscribe: "Отписаться от рассылки",
      eyebrow: many ? "Реклама · Новинки" : "Реклама · Новинка",
      advertiser: "The Perfume Room · orders@parfums.cloud",
    };
  }
  return {
    subject: many
      ? "Advertisement: New from the atelier"
      : `Advertisement: New from the atelier: ${productName}`,
    greeting: "Hello,",
    body: many
      ? "New fragrances have joined the collection."
      : `A new fragrance has joined the collection — ${productName}.`,
    cta: "View fragrance",
    unsubscribe: "Unsubscribe from these notes",
    eyebrow: many ? "Advertisement · New arrivals" : "Advertisement · New arrival",
    advertiser: "The Perfume Room · orders@parfums.cloud",
  };
}

function buildNewArrivalHtml(input: {
  copy: ReturnType<typeof newArrivalCopy>;
  products: NewArrivalMailProduct[];
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

  const productBlocks = input.products
    .map((product, index) => {
      const brand = product.brand?.trim();
      const showPrice = product.showPrice !== false && Boolean(product.priceLabel.trim());
      const brandLine = brand
        ? `<p style="margin:0 0 6px;font-family:${uiFont};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8178;text-align:center;">${escapeHtml(brand)}</p>`
        : "";
      const price = showPrice
        ? `<p dir="${dir}" style="margin:12px 0 0;font-family:${bodyFont};font-size:15px;color:#5c534a;text-align:center;">${escapeHtml(priceLine(input.locale, product.priceLabel))}</p>`
        : "";
      const divider =
        index > 0
          ? `<tr><td style="padding:0 28px;"><div style="border-top:1px solid #e6e0d6;"></div></td></tr>`
          : "";
      return `${divider}
          <tr>
            <td style="padding:${index === 0 ? "8px" : "24px"} 28px 0;">
              <a href="${escapeAttr(product.productUrl)}" style="display:block;text-decoration:none;">
                <img src="${escapeAttr(product.imageUrl)}" alt="${escapeAttr(product.productName)}" width="504" style="display:block;width:100%;max-width:504px;height:auto;border:0;background:#ebe6de;" />
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 28px 8px;text-align:center;font-family:${bodyFont};">
              ${brandLine}
              <h1 style="margin:0;font-family:${bodyFont};font-size:30px;line-height:1.25;font-weight:500;color:#201d19;text-align:center;">${escapeHtml(product.productName)}</h1>
              ${price}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 28px 28px;text-align:center;">
              <a href="${escapeAttr(product.productUrl)}" style="display:inline-block;background:#201d19;color:#fffcf7;font-family:${uiFont};font-size:13px;letter-spacing:${isHe ? "0.06em" : "0.16em"};${isHe ? "" : "text-transform:uppercase;"};text-decoration:none;padding:14px 28px;">${escapeHtml(input.copy.cta)}</a>
            </td>
          </tr>`;
    })
    .join("");

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
          ${productBlocks}
          <tr>
            <td dir="${dir}" align="center" style="padding:0 28px 28px;text-align:center;font-family:${uiFont};font-size:13px;color:#8a8178;direction:${dir};">
              <a href="${escapeAttr(input.unsubscribeUrl)}" style="color:#8a8178;font-family:${uiFont};text-decoration:underline;">${escapeHtml(input.copy.unsubscribe)}</a>
              <p dir="${dir}" style="margin:12px 0 0;font-size:11px;line-height:1.5;color:#8a8178;">${escapeHtml(input.copy.advertiser)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function withProductDisclosure(order: Order): Promise<Order> {
  const products = await listStoreProducts();
  return {
    ...order,
    cart: {
      ...order.cart,
      lines: order.cart.lines.map((line) => {
        const product = products.find((item) => item.id === line.productId);
        if (!product) return line;
        return {
          ...line,
          brand: line.brand || product.brand || undefined,
          manufacturer: line.manufacturer || product.manufacturer,
          originCountry: line.originCountry || product.originCountry,
          inci: line.inci || product.inci,
          supplyChannel: line.supplyChannel || product.supplyChannel,
        };
      }),
    },
  };
}

function orderConfirmationCopy(order: Order) {
  const locale: Locale = order.locale ?? "en";
  const origin = siteOrigin();
  const terms = `${origin}${localizedPath(locale, "/terms")}`;
  const refund = `${origin}${localizedPath(locale, "/refund")}`;
  const privacy = `${origin}${localizedPath(locale, "/privacy")}`;
  const total = `${(order.cart.total / 100).toFixed(2)} ${order.cart.currency.toUpperCase()}`;
  const lines = order.cart.lines
    .map((line) => `${line.productName} (${line.variantName}) × ${line.quantity}`)
    .join("\n");
  const disclosure = buildOrderDisclosure(
    locale,
    order.customer.country,
    order.cart.lines.map((line) => ({
      productName: line.productName,
      variantName: line.variantName,
      quantity: line.quantity,
      brand: line.brand,
      manufacturer: line.manufacturer,
      originCountry: line.originCountry,
      inci: line.inci,
      supplyChannel: line.supplyChannel as SupplyChannel | undefined,
    })),
  );

  if (locale === "he") {
    return {
      subject: `הזמנה ${order.id} אושרה`,
      text: [
        `תודה, ${order.customer.name}.`,
        `הזמנה ${order.id} שולמה.`,
        `סה״כ: ${total}`,
        "",
        "פריטים:",
        lines,
        "",
        disclosure,
        "",
        "ניתן לבטל עסקת מכר מרחוק תוך 14 ימים מקבלת הטובין או ממסמך גילוי זה — לפי המאוחר. בושם שנפתח בדרך כלל אינו ניתן להחזרה.",
        "דמי ביטול אם אין פגם: 5% או ₪100 לפי הנמוך.",
        `תקנון: ${terms}`,
        `החזרות: ${refund}`,
        `פרטיות: ${privacy}`,
        "",
        "פרטי העוסק המלאים יפורסמו באתר עם השלמת הרישום. עד אז: orders@parfums.cloud",
      ].join("\n"),
    };
  }
  if (locale === "ru") {
    return {
      subject: `Заказ ${order.id} подтверждён`,
      text: [
        `Спасибо, ${order.customer.name}.`,
        `Заказ ${order.id} оплачен.`,
        `Итого: ${total}`,
        "",
        "Позиции:",
        lines,
        "",
        disclosure,
        "",
        "Дистанционную сделку можно отменить в течение 14 дней с получения товара или этого документа раскрытия — что позже. Вскрытый аромат обычно нельзя вернуть.",
        "Комиссия при отсутствии дефекта: 5% или ₪100 — что меньше.",
        `Правила: ${terms}`,
        `Возвраты: ${refund}`,
        `Конфиденциальность: ${privacy}`,
        "",
        "Полные реквизиты продавца будут опубликованы на сайте после регистрации. До этого: orders@parfums.cloud",
      ].join("\n"),
    };
  }
  return {
    subject: `Order ${order.id} confirmed`,
    text: [
      `Thank you, ${order.customer.name}.`,
      `Your order ${order.id} has been paid.`,
      `Total: ${total}`,
      "",
      "Items:",
      lines,
      "",
      disclosure,
      "",
      "You may cancel a distance sale within 14 days of receiving the goods or this disclosure document, whichever is later. Opened fragrance generally cannot be returned.",
      "Cancellation fee if there is no defect: 5% or ₪100, whichever is lower.",
      `Terms: ${terms}`,
      `Returns: ${refund}`,
      `Privacy: ${privacy}`,
      "",
      "Full seller identity will be published on the site once registration is complete. Until then: orders@parfums.cloud",
    ].join("\n"),
  };
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
