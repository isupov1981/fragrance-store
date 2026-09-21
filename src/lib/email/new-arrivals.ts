import { formatMoney } from "@/lib/currency";
import { databaseEnabled } from "@/lib/db/enabled";
import {
  getOrderMailer,
  isSmtpConfigured,
  smtpErrorMessage,
} from "@/lib/email/mailer";
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
  /** Short SMTP/send error for the admin UI when something failed. */
  lastError?: string;
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

  let failed = 0;
  await Promise.all(
    subscribers.map(async (subscriber) => {
      const locale: Locale = isLocale(subscriber.locale) ? subscriber.locale : "en";
      try {
        await mailer.sendNewArrival({
          to: subscriber.email,
          locale,
          products: [
            {
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
            },
          ],
          unsubscribeUrl: `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`,
        });
      } catch (error) {
        failed += 1;
        console.error(`New-arrival email failed for ${subscriber.email}`, error);
      }
    }),
  );

  // Allow a later admin blast if every send failed.
  if (failed === subscribers.length) {
    await prisma.product.update({
      where: { id: product.id },
      data: { newArrivalAnnouncedAt: null },
    });
  }
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
 * Admin blast: one email per subscriber listing every unannounced new arrival,
 * then stamp newArrivalAnnouncedAt.
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
  let lastError: string | undefined;
  const productSlugs = products.map((product) => product.slug);

  for (const subscriber of subscribers) {
    const locale: Locale = isLocale(subscriber.locale) ? subscriber.locale : "en";
    const intl = locale === "he" ? "he-IL" : locale === "ru" ? "ru-RU" : "en-US";
    emailsAttempted += 1;
    try {
      await mailer.sendNewArrival({
        to: subscriber.email,
        locale,
        products: products.map((product) => ({
          productName: product.name,
          brand: product.brand,
          productUrl: `${origin}${localizedPath(locale, `/products/${product.slug}`)}`,
          priceLabel: formatMoney(product.startingPrice, "ILS", intl),
          showPrice: product.startingPrice > 0,
          imageUrl: absoluteMediaUrl(product.imageUrl, origin),
        })),
        unsubscribeUrl: `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`,
      });
    } catch (error) {
      emailsFailed += 1;
      lastError = smtpErrorMessage(error);
      console.error(`New-arrival blast failed for ${subscriber.email}`, error);
    }
  }

  // Stamp every product once at least one digest was delivered.
  if (emailsAttempted > 0 && emailsFailed < emailsAttempted) {
    await prisma.product.updateMany({
      where: {
        id: { in: products.map((product) => product.id) },
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
    lastError,
  };
}

/** Clear announce stamp so an admin can retry a failed blast for a slug. */
export async function clearNewArrivalAnnouncement(slug: string) {
  if (!databaseEnabled()) return false;
  const { prisma } = await import("@/lib/db/prisma");
  const result = await prisma.product.updateMany({
    where: { slug, newArrival: true },
    data: { newArrivalAnnouncedAt: null },
  });
  return result.count > 0;
}
