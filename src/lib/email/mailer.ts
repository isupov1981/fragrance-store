import nodemailer from "nodemailer";

import type { Order } from "@/lib/checkout/orders";

export interface OrderMailer {
  sendConfirmation(order: Order): Promise<void>;
}

class NoopOrderMailer implements OrderMailer {
  async sendConfirmation() {}
}

class SmtpOrderMailer implements OrderMailer {
  async sendConfirmation(order: Order) {
    const transport = nodemailer.createTransport({
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
    await transport.sendMail({
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
}

export function getOrderMailer(): OrderMailer {
  return process.env.SMTP_HOST
    ? new SmtpOrderMailer()
    : new NoopOrderMailer();
}
