import { formatMoney } from "@/lib/currency";
import { databaseEnabled } from "@/lib/db/enabled";
import { getOrderMailer, isSmtpConfigured } from "@/lib/email/mailer";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { listActiveSubscribers } from "@/lib/newsletter/subscribers";

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function absoluteMediaUrl(url: string, origin: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
  return `${origin}/${trimmed}`;
}

const unannouncedInclude = {
  brand: true,
  variants: { orderBy: { price: "asc" as const }, take: 1 },
  images: { orderBy: { position: "asc" as const }, take: 1 },
} as const;

export type UnannouncedNewArrival = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string;
  startingPrice: number;
};

export type NewArrivalBlastResult = {
  products: number;
  subscribers: number;
  emailsAttempted: number;
  emailsFailed: number;
  productSlugs: string[];
  smtpConfigured: boolean;
};

/**
 * Sends new-arrival emails when an ACTIVE product is newly marked as newArrival
 * and has not been announced yet. Clears the announce stamp when the flag is removed.
 */
export async function announceNewArrivalIfNeeded(productId: string) {
  if (!databaseEnabled()) return;
  const { prisma } = await import("@/lib/db/prisma");
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      brand: true,
      variants: { orderBy: { price: "asc" }, take: 1 },
      images: { orderBy: { position: "asc" }, take: 1 },
    },
  });
  if (!product) return;

  if (!product.newArrival) {
    if (product.newArrivalAnnouncedAt) {
      await prisma.product.update({
        where: { id: product.id },
        data: { newArrivalAnnouncedAt: null },
      });
    }
    return;
  }

  if (product.status !== "ACTIVE" || product.newArrivalAnnouncedAt) return;
  if (!product.images[0]?.url || !product.variants.length) return;

  const claimed = await prisma.product.updateMany({
    where: {
      id: product.id,
      newArrival: true,
      status: "ACTIVE",
      newArrivalAnnouncedAt: null,
    },
    data: { newArrivalAnnouncedAt: new Date() },
  });
  if (claimed.count !== 1) return;

  const subscribers = await listActiveSubscribers();
  if (!subscribers.length) return;

  const origin = siteOrigin();
  const startingPrice = product.variants[0]?.price ?? 0;
  const imageUrl = absoluteMediaUrl(product.images[0].url, origin);
  const mailer = getOrderMailer();

  await Promise.all(
    subscribers.map(async (subscriber) => {
      const locale: Locale = isLocale(subscriber.locale) ? subscriber.locale : "en";
      try {
        await mailer.sendNewArrival({
          to: subscriber.email,
          locale,
          productName: product.name,
          brand: product.brand?.name,
          productUrl: `${origin}${localizedPath(locale, `/products/${product.slug}`)}`,
          priceLabel: formatMoney(
            startingPrice,
            "ILS",
            locale === "he" ? "he-IL" : locale === "ru" ? "ru-RU" : "en-US",
          ),
          showPrice: startingPrice > 0,
          imageUrl,
          unsubscribeUrl: `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`,
        });
      } catch (error) {
        console.error(`New-arrival email failed for ${subscriber.email}`, error);
      }
    }),
  );
}

export async function listUnannouncedNewArrivals(): Promise<UnannouncedNewArrival[]> {
  if (!databaseEnabled()) return [];
  const { prisma } = await import("@/lib/db/prisma");
  const rows = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      newArrival: true,
      newArrivalAnnouncedAt: null,
      images: { some: {} },
      variants: { some: {} },
    },
    include: unannouncedInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows
    .map((product) => {
      const imageUrl = product.images[0]?.url?.trim();
      if (!imageUrl) return null;
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand?.name ?? null,
        imageUrl,
        startingPrice: product.variants[0]?.price ?? 0,
      } satisfies UnannouncedNewArrival;
    })
    .filter((item): item is UnannouncedNewArrival => Boolean(item));
}

export async function countUnannouncedNewArrivals() {
  return (await listUnannouncedNewArrivals()).length;
}

/**
 * Admin blast: email every subscriber about each unannounced new arrival using
 * the original product photo, then stamp newArrivalAnnouncedAt.
 */
export async function blastUnannouncedNewArrivals(): Promise<NewArrivalBlastResult> {
  const smtpConfigured = isSmtpConfigured();
  const empty: NewArrivalBlastResult = {
    products: 0,
    subscribers: 0,
    emailsAttempted: 0,
    emailsFailed: 0,
    productSlugs: [],
    smtpConfigured,
  };

  if (!databaseEnabled()) return empty;
  if (!smtpConfigured) {
    throw new Error("SMTP is not configured");
  }

  const products = await listUnannouncedNewArrivals();
  const subscribers = await listActiveSubscribers();
  if (!products.length) {
    return { ...empty, subscribers: subscribers.length };
  }

  const origin = siteOrigin();
  const mailer = getOrderMailer();
  const { prisma } = await import("@/lib/db/prisma");

  let emailsAttempted = 0;
  let emailsFailed = 0;
  const productSlugs: string[] = [];

  for (const product of products) {
    const imageUrl = absoluteMediaUrl(product.imageUrl, origin);
    productSlugs.push(product.slug);

    for (const subscriber of subscribers) {
      const locale: Locale = isLocale(subscriber.locale) ? subscriber.locale : "en";
      emailsAttempted += 1;
      try {
        await mailer.sendNewArrival({
          to: subscriber.email,
          locale,
          productName: product.name,
          brand: product.brand,
          productUrl: `${origin}${localizedPath(locale, `/products/${product.slug}`)}`,
          priceLabel: formatMoney(
            product.startingPrice,
            "ILS",
            locale === "he" ? "he-IL" : locale === "ru" ? "ru-RU" : "en-US",
          ),
          showPrice: product.startingPrice > 0,
          imageUrl,
          unsubscribeUrl: `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`,
        });
      } catch (error) {
        emailsFailed += 1;
        console.error(`New-arrival blast failed for ${subscriber.email} / ${product.slug}`, error);
      }
    }

    await prisma.product.updateMany({
      where: {
        id: product.id,
        newArrival: true,
        status: "ACTIVE",
        newArrivalAnnouncedAt: null,
      },
      data: { newArrivalAnnouncedAt: new Date() },
    });
  }

  return {
    products: productSlugs.length,
    subscribers: subscribers.length,
    emailsAttempted,
    emailsFailed,
    productSlugs,
    smtpConfigured,
  };
}
