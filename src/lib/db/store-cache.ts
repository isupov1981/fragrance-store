import { revalidatePath, revalidateTag } from "next/cache";

/** Public catalogue, brands, and categories. */
export const STORE_CATALOG_TAG = "store-catalog";
/** Admin ordering toggle read by the storefront layout. */
export const STORE_ORDERS_TAG = "store-orders";

/**
 * Background refresh interval for catalogue reads. Admin edits invalidate the tag
 * immediately, so this is only a fallback — keep it long, because every refresh
 * wakes Neon and burns free-plan compute. Checkout stock does not use this.
 */
export const STORE_CATALOG_REVALIDATE_SECONDS = 86_400;

function revalidateStorefront(tag: string) {
  try {
    revalidateTag(tag, "max");
    revalidatePath("/", "layout");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("static generation store missing")) return;
    throw error;
  }
}

export function revalidateStoreCatalog() {
  revalidateStorefront(STORE_CATALOG_TAG);
}

export function revalidateStoreOrdersFlag() {
  revalidateStorefront(STORE_ORDERS_TAG);
}
