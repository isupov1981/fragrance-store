import { formatMoney } from "@/lib/currency";
import { databaseEnabled } from "@/lib/db/enabled";
import { getOrderMailer } from "@/lib/email/mailer";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { listActiveSubscribers } from "@/lib/newsletter/subscribers";

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

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
  const mailer = getOrderMailer();

  await Promise.all(
    subscribers.map(async (subscriber) => {
      const locale: Locale = isLocale(subscriber.locale) ? subscriber.locale : "en";
      try {
        await mailer.sendNewArrival({
          to: subscriber.email,
          locale,
          productName: product.name,
          productUrl: `${origin}${localizedPath(locale, `/products/${product.slug}`)}`,
          priceLabel: formatMoney(startingPrice, "ILS", locale === "he" ? "he-IL" : locale === "ru" ? "ru-RU" : "en-US"),
          unsubscribeUrl: `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`,
        });
      } catch (error) {
        console.error(`New-arrival email failed for ${subscriber.email}`, error);
      }
    }),
  );
}
