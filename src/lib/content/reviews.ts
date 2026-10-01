import type { Locale } from "@/lib/i18n/config";

export type StoreReview = {
  id: string;
  /** When set, the quote also appears on that fragrance's page. */
  productSlug?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  author: string;
  quote: string;
  quoteHe?: string;
  quoteRu?: string;
};

/**
 * Published client notes. Leave this empty until a real order can be quoted.
 * Do not add paraphrased or sample praise.
 */
export const storeReviews: StoreReview[] = [];

export function publishedReviews() {
  return storeReviews;
}

export function reviewsForProduct(slug: string) {
  return storeReviews.filter((review) => review.productSlug === slug);
}

export function reviewQuote(review: StoreReview, locale: Locale) {
  if (locale === "he" && review.quoteHe) return review.quoteHe;
  if (locale === "ru" && review.quoteRu) return review.quoteRu;
  return review.quote;
}

export function averageRating(reviews: StoreReview[]) {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}
