import { randomUUID } from "node:crypto";

import { databaseEnabled } from "@/lib/db/enabled";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

export type NewsletterSubscribeInput = {
  email: string;
  locale?: string;
};

export async function subscribeToNewsletter(input: NewsletterSubscribeInput) {
  if (!databaseEnabled()) {
    throw new Error("Database is not configured");
  }
  const { prisma } = await import("@/lib/db/prisma");
  const email = input.email.trim().toLowerCase();
  const locale: Locale = isLocale(input.locale) ? input.locale : defaultLocale;

  return prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      locale,
      unsubscribeToken: randomUUID(),
    },
    update: {
      locale,
      unsubscribedAt: null,
    },
  });
}

export async function unsubscribeByToken(token: string) {
  if (!databaseEnabled()) return null;
  const { prisma } = await import("@/lib/db/prisma");
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!subscriber) return null;
  if (subscriber.unsubscribedAt) return subscriber;
  return prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { unsubscribedAt: new Date() },
  });
}

export async function listActiveSubscribers() {
  if (!databaseEnabled()) return [];
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.newsletterSubscriber.findMany({
    where: { unsubscribedAt: null },
    orderBy: { createdAt: "asc" },
  });
}
