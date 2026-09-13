import nodemailer from "nodemailer";

import type { Order } from "@/lib/checkout/orders";

export interface OrderMailer {
  sendConfirmation(order: Order): Promise<void>;
  sendEnquiry(input: { name: string; email: string; subject: string; message: string }): Promise<void>;
}

class NoopOrderMailer implements OrderMailer {
  async sendConfirmation() {}
  async sendEnquiry() {}
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
    await this.transport().sendMail({
      from: process.env.EMAIL_FROM ?? "orders@example.com",
      to: order.customer.email,
      subject: `Order ${order.id} confirmed`,
      text: [
        `Thank you, ${order.customer.name}.`,
        `Your order ${order.id} has been paid.`,
        `Total: ${(order.cart.subtotal / 100).toFixed(2)} ${order.cart.currency.toUpperCase()}`,
      ].join("\n"),
    });
  }

  async sendEnquiry(input: { name: string; email: string; subject: string; message: string }) {
    await this.transport().sendMail({
      from: process.env.EMAIL_FROM ?? "concierge@example.com",
      to: process.env.EMAIL_FROM ?? "concierge@example.com",
      replyTo: input.email,
      subject: `Atelier enquiry: ${input.subject}`,
      text: [`From: ${input.name} <${input.email}>`, "", input.message].join("\n"),
    });
  }
}

export function getOrderMailer(): OrderMailer {
  return process.env.SMTP_HOST
    ? new SmtpOrderMailer()
    : new NoopOrderMailer();
}
