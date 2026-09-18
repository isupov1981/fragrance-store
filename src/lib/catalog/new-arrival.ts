/** Storefront "NEW" badge window from product creation. */
export const NEW_ARRIVAL_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isNewProduct(
  product: { createdAt?: string | Date | null; newArrival?: boolean },
  now: Date = new Date(),
): boolean {
  if (product.createdAt) {
    const created =
      product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt);
    if (Number.isNaN(created.getTime())) return Boolean(product.newArrival);
    const ageMs = now.getTime() - created.getTime();
    return ageMs >= 0 && ageMs < NEW_ARRIVAL_DAYS * DAY_MS;
  }
  return Boolean(product.newArrival);
}
