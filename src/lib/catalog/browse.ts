import type { StoreProduct } from "@/lib/catalog";
import { isNewProduct } from "@/lib/catalog/new-arrival";

export const COLLECTION_PAGE_SIZE = 9;

export const collectionSorts = ["featured", "newest", "price-asc", "price-desc", "name"] as const;

export type CollectionSort = (typeof collectionSorts)[number];

export function isCollectionSort(value: string | undefined | null): value is CollectionSort {
  return collectionSorts.includes(value as CollectionSort);
}

function startingPrice(product: StoreProduct) {
  return product.variants[0]?.price ?? 0;
}

function createdAtMs(product: StoreProduct) {
  if (!product.createdAt) return 0;
  const value = new Date(product.createdAt).getTime();
  return Number.isNaN(value) ? 0 : value;
}

export function sortCollection(products: StoreProduct[], sort: CollectionSort) {
  const copy = [...products];
  copy.sort((left, right) => {
    switch (sort) {
      case "newest":
        return (
          createdAtMs(right) - createdAtMs(left) ||
          Number(isNewProduct(right)) - Number(isNewProduct(left)) ||
          left.name.localeCompare(right.name)
        );
      case "price-asc":
        return startingPrice(left) - startingPrice(right);
      case "price-desc":
        return startingPrice(right) - startingPrice(left);
      case "name":
        return left.name.localeCompare(right.name);
      default:
        return Number(Boolean(right.featured)) - Number(Boolean(left.featured)) || left.name.localeCompare(right.name);
    }
  });
  return copy;
}

export function paginateCollection<T>(items: T[], page: number, pageSize = COLLECTION_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    totalPages,
    total: items.length,
  };
}
