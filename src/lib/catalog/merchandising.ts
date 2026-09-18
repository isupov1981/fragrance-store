import type { Dictionary } from "@/lib/i18n/en";
import { isNewProduct } from "@/lib/catalog/new-arrival";

export const MERCH_CATEGORY_SLUGS = ["back-in-stock", "testers-refills", "additional-products"] as const;

export type MerchCategorySlug = (typeof MERCH_CATEGORY_SLUGS)[number];

export type MerchandisingEdit = "new" | "featured" | "back-in-stock" | "testers" | "additional";

export function isMerchCategorySlug(value: string): value is MerchCategorySlug {
  return (MERCH_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function isMerchandisingEdit(value: string): value is MerchandisingEdit {
  return value === "new" || value === "featured" || value === "back-in-stock" || value === "testers" || value === "additional";
}

export const merchandisingCategoryDefs: { slug: MerchCategorySlug; name: string; description: string }[] = [
  {
    slug: "back-in-stock",
    name: "Back In Stock",
    description: "Recently restocked fragrances.",
  },
  {
    slug: "testers-refills",
    name: "Testers / Refills",
    description: "Testers and refill formats.",
  },
  {
    slug: "additional-products",
    name: "Additional Products",
    description: "Complementary products beyond the core collection.",
  },
];

export type CategoryMenuLink = {
  id: string;
  href: string;
  label: (dict: Dictionary) => string;
};

export const categoryMenuLinks: CategoryMenuLink[] = [
  {
    id: "all",
    href: "/collections/all",
    label: (dict) => dict.categoriesMenu.allProducts,
  },
  {
    id: "new",
    href: "/collections/all?edit=new",
    label: (dict) => dict.categoriesMenu.newArrivals,
  },
  {
    id: "back-in-stock",
    href: "/collections/all?edit=back-in-stock",
    label: (dict) => dict.categoriesMenu.backInStock,
  },
  {
    id: "testers",
    href: "/collections/all?edit=testers",
    label: (dict) => dict.categoriesMenu.testersRefills,
  },
  {
    id: "additional",
    href: "/collections/all?edit=additional",
    label: (dict) => dict.categoriesMenu.additionalProducts,
  },
];

export function matchesMerchandisingEdit(
  product: {
    newArrival?: boolean;
    createdAt?: string | Date | null;
    featured?: boolean;
    categorySlugs?: string[];
    category: string;
  },
  edit: string,
) {
  if (!edit) return true;
  if (edit === "new") return isNewProduct(product);
  if (edit === "featured") return Boolean(product.featured);
  if (edit === "back-in-stock") {
    return (product.categorySlugs ?? [product.category]).includes("back-in-stock");
  }
  if (edit === "testers") {
    return (product.categorySlugs ?? [product.category]).includes("testers-refills");
  }
  if (edit === "additional") {
    return (product.categorySlugs ?? [product.category]).includes("additional-products");
  }
  return true;
}

export function merchandisingTitle(dict: Dictionary, edit: string, fallback: string) {
  switch (edit) {
    case "new":
      return dict.categoriesMenu.newArrivals;
    case "featured":
      return dict.collection.featured;
    case "back-in-stock":
      return dict.categoriesMenu.backInStock;
    case "testers":
      return dict.categoriesMenu.testersRefills;
    case "additional":
      return dict.categoriesMenu.additionalProducts;
    default:
      return fallback;
  }
}
