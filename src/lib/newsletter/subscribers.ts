import { randomUUID } from "node:crypto";

import { databaseEnabled } from "@/lib/db/enabled";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

export type NewsletterSubscribeInput = {
  email: string;
  locale?: string;
};

export type NewsletterSubscriberRecord = {
  id: string;
  email: string;
  locale: string;
  unsubscribeToken: string;
  createdAt: Date;
  unsubscribedAt: Date | null;
};

function serialize(subscriber: NewsletterSubscriberRecord) {
  return {
    id: subscriber.id,
    email: subscriber.email,
    locale: subscriber.locale,
    createdAt: subscriber.createdAt.toISOString(),
    unsubscribedAt: subscriber.unsubscribedAt?.toISOString() ?? null,
    active: subscriber.unsubscribedAt == null,
  };
}

export type AdminSubscriber = ReturnType<typeof serialize>;

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

export async function listAllSubscribers(): Promise<AdminSubscriber[]> {
  if (!databaseEnabled()) return [];
  const { prisma } = await import("@/lib/db/prisma");
  const rows = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serialize);
}

export async function createSubscriber(input: NewsletterSubscribeInput): Promise<AdminSubscriber> {
  const row = await subscribeToNewsletter(input);
  return serialize(row);
}

export async function setSubscriberBlocked(id: string, blocked: boolean): Promise<AdminSubscriber | null> {
  if (!databaseEnabled()) return null;
  const { prisma } = await import("@/lib/db/prisma");
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { id } });
  if (!existing) return null;

  if (blocked) {
    if (existing.unsubscribedAt) return serialize(existing);
    const row = await prisma.newsletterSubscriber.update({
      where: { id },
      data: { unsubscribedAt: new Date() },
    });
    return serialize(row);
  }

  if (!existing.unsubscribedAt) return serialize(existing);
  const row = await prisma.newsletterSubscriber.update({
    where: { id },
    data: { unsubscribedAt: null },
  });
  return serialize(row);
}

export async function deleteSubscriber(id: string): Promise<boolean> {
  if (!databaseEnabled()) return false;
  const { prisma } = await import("@/lib/db/prisma");
  try {
    await prisma.newsletterSubscriber.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
