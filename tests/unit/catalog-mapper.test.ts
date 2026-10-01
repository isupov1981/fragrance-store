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
      manufacturer: "Maison Test",
      originCountry: "France",
      inci: "Alcohol Denat., Parfum",
      supplyChannel: "official",
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
    expect(mapped?.pyramid).toBeUndefined();
    expect(mapped?.manufacturer).toBe("Maison Test");
    expect(mapped?.originCountry).toBe("France");
    expect(mapped?.inci).toBe("Alcohol Denat., Parfum");
    expect(mapped?.supplyChannel).toBe("official");
    expect(mapped?.createdAt).toBeTruthy();
  });

  it("reads a note pyramid and scent labels from the notes object", () => {
    const mapped = toStoreProduct({
      id: "p2",
      slug: "pyramid",
      name: "Pyramid",
      description: "A structured composition with a clear dry-down.",
      descriptionHe: null,
      excerpt: null,
      status: "ACTIVE",
      featured: false,
      newArrival: false,
      newArrivalAnnouncedAt: null,
      concentration: "edp",
      manufacturer: null,
      originCountry: null,
      inci: null,
      supplyChannel: null,
      notes: {
        top: ["Bergamot"],
        heart: ["Iris"],
        base: ["Amber", "Musk"],
        occasion: "evening",
        season: "cool",
        sillage: "intimate",
      },
      seoTitle: null,
      seoDescription: null,
      brandId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      brand: null,
      images: [],
      variants: [
        {
          id: "v2",
          productId: "p2",
          name: "50 ml",
          sku: "PY-50",
          price: 10000,
          compareAt: null,
          stock: 2,
          attributes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      categories: [],
    });

    expect(mapped?.pyramid).toEqual({
      top: ["Bergamot"],
      heart: ["Iris"],
      base: ["Amber", "Musk"],
    });
    expect(mapped?.notes).toEqual(["Bergamot", "Iris", "Amber", "Musk"]);
    expect(mapped?.occasion).toBe("evening");
    expect(mapped?.season).toBe("cool");
    expect(mapped?.sillage).toBe("intimate");
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
        manufacturer: null,
        originCountry: null,
        inci: null,
        supplyChannel: null,
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
