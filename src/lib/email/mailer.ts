import nodemailer from "nodemailer";

import type { Order } from "@/lib/checkout/orders";
import type { Locale } from "@/lib/i18n/config";

export type NewArrivalMail = {
  to: string;
  locale: Locale;
  productName: string;
  productUrl: string;
  priceLabel: string;
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
    const copy = newArrivalCopy(input.locale, input.productName, input.priceLabel);
    await this.transport().sendMail({
      from,
      to: input.to,
      subject: copy.subject,
      text: [
        copy.greeting,
        "",
        copy.body,
        input.productUrl,
        "",
        copy.price,
        "",
        copy.unsubscribe,
        input.unsubscribeUrl,
      ].join("\n"),
      html: `
        <p>${escapeHtml(copy.greeting)}</p>
        <p>${escapeHtml(copy.body)}</p>
        <p><a href="${escapeAttr(input.productUrl)}">${escapeHtml(input.productName)}</a></p>
        <p>${escapeHtml(copy.price)}</p>
        <p style="font-size:12px;color:#666"><a href="${escapeAttr(input.unsubscribeUrl)}">${escapeHtml(copy.unsubscribe)}</a></p>
      `,
    });
  }
}

function newArrivalCopy(locale: Locale, productName: string, priceLabel: string) {
  if (locale === "he") {
    return {
      subject: `חדש באטלייה: ${productName}`,
      greeting: "שלום,",
      body: `נוסף ניחוח חדש לקולקציה — ${productName}.`,
      price: `החל מ־${priceLabel}`,
      unsubscribe: "להסרה מרשימת התפוצה",
    };
  }
  if (locale === "ru") {
    return {
      subject: `Новинка в ателье: ${productName}`,
      greeting: "Здравствуйте,",
      body: `В коллекции появился новый аромат — ${productName}.`,
      price: `От ${priceLabel}`,
      unsubscribe: "Отписаться от рассылки",
    };
  }
  return {
    subject: `New from the atelier: ${productName}`,
    greeting: "Hello,",
    body: `A new fragrance has joined the collection — ${productName}.`,
    price: `From ${priceLabel}`,
    unsubscribe: "Unsubscribe from these notes",
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

export function getOrderMailer(): OrderMailer {
  return process.env.SMTP_HOST
    ? new SmtpOrderMailer()
    : new NoopOrderMailer();
}
