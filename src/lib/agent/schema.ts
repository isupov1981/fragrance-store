import { z } from "zod";

const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const merchandisingTagSchema = z.enum([
  "back-in-stock",
  "testers-refills",
  "additional-products",
]);

export const productVariantInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sku: z.string().trim().min(2).max(100),
  price: z.coerce.number().int().nonnegative(),
  stock: z.coerce.number().int().nonnegative().default(0),
  compareAt: z.coerce.number().int().nonnegative().optional(),
});

export const productImageInputSchema = z.object({
  url: z.string().trim().min(1).max(2000),
  alt: z.string().trim().max(200).optional(),
});

export const createProductInputSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: slugSchema,
  description: z.string().trim().min(10),
  descriptionHe: z.string().trim().min(10).optional(),
  brand: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  merchandising: z.array(merchandisingTagSchema).max(3).optional().default([]),
  concentration: z.enum(["edp", "extrait"]).optional(),
  featured: z.boolean().optional().default(false),
  newArrival: z.boolean().optional().default(false),
  notes: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  images: z.array(productImageInputSchema).max(12).optional(),
  variants: z.array(productVariantInputSchema).min(1).max(20),
});

export const updateProductInputSchema = z.object({
  id: z.string().min(1).optional(),
  slug: slugSchema.optional(),
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().min(10).optional(),
  descriptionHe: z.string().trim().min(10).nullable().optional(),
  brand: z.string().trim().min(1).max(120).nullable().optional(),
  category: z.string().trim().min(1).max(120).nullable().optional(),
  merchandising: z.array(merchandisingTagSchema).max(3).nullable().optional(),
  concentration: z.enum(["edp", "extrait"]).nullable().optional(),
  featured: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  notes: z.array(z.string().trim().min(1).max(80)).max(12).nullable().optional(),
  images: z.array(productImageInputSchema).max(12).optional(),
  variants: z.array(productVariantInputSchema).min(1).max(20).optional(),
  status: z.enum(["DRAFT", "ARCHIVED"]).optional(),
});

export const productLookupSchema = z
  .object({
    id: z.string().min(1).optional(),
    slug: slugSchema.optional(),
  })
  .refine((value) => Boolean(value.id || value.slug), { message: "id or slug is required" });

export const listProductsInputSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  merchandising: merchandisingTagSchema.optional(),
  take: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export const adminSimpleProductSchema = z.object({
  name: z.string().min(2),
  slug: slugSchema,
  description: z.string().min(10),
  descriptionHe: z.string().min(10).optional(),
  sku: z.string().min(2),
  price: z.coerce.number().int().nonnegative(),
  stock: z.coerce.number().int().nonnegative().default(0),
  imageUrl: z.union([z.url(), z.literal("")]).optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  newArrival: z
    .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((value) => value === true || value === "on" || value === "true"),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type MerchandisingTag = z.infer<typeof merchandisingTagSchema>;
