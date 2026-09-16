import { describe, expect, it } from "vitest";
import { toStoreProduct } from "@/lib/db/products";

describe("toStoreProduct", () => {
  it("maps a published Prisma product onto the storefront shape", () => {
    const mapped = toStoreProduct({
      id: "p1",
      slug: "test-oud",
      name: "Test Oud",
      description: "English copy for the composition.",
      descriptionHe: "תיאור בעברית",
      excerpt: null,
      status: "ACTIVE",
      featured: true,
      newArrival: true,
      newArrivalAnnouncedAt: null,
      concentration: "extrait",
      notes: ["Incense", "Oud"],
      seoTitle: null,
      seoDescription: null,
      brandId: "b1",
      createdAt: new Date(),
      updatedAt: new Date(),
      brand: {
        id: "b1",
        name: "Maison Test",
        slug: "maison-test",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      images: [
        {
          id: "i1",
          productId: "p1",
          url: "/products/test.jpg",
          alt: "Test",
          position: 0,
        },
      ],
      variants: [
        {
          id: "v1",
          productId: "p1",
          name: "1 ml",
          sku: "MT-TO-1",
          price: 3200,
          compareAt: null,
          stock: 4,
          attributes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      categories: [
        {
          productId: "p1",
          categoryId: "c1",
          category: {
            id: "c1",
            name: "Woody",
            slug: "woody",
            description: null,
            imageUrl: null,
            seoTitle: null,
            seoDescription: null,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
    });

    expect(mapped?.brand).toBe("Maison Test");
    expect(mapped?.category).toBe("woody");
    expect(mapped?.descriptionHe).toBe("תיאור בעברית");
    expect(mapped?.variants[0]?.price).toBe(3200);
    expect(mapped?.notes).toEqual(["Incense", "Oud"]);
  });

  it("returns null when there are no variants", () => {
    expect(
      toStoreProduct({
        id: "p1",
        slug: "empty",
        name: "Empty",
        description: "No variants yet.",
        descriptionHe: null,
        excerpt: null,
        status: "ACTIVE",
        featured: false,
        newArrival: false,
        newArrivalAnnouncedAt: null,
        concentration: null,
        notes: null,
        seoTitle: null,
        seoDescription: null,
        brandId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        brand: null,
        images: [],
        variants: [],
        categories: [],
      }),
    ).toBeNull();
  });
});
