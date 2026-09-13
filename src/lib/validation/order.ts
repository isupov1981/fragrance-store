import { z } from "zod";

export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  email: z.email(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  address: z.object({
    line1: z.string().trim().min(3).max(160),
    line2: z.string().trim().max(160).optional(),
    city: z.string().trim().min(2).max(100),
    region: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().min(2).max(20),
    country: z.string().trim().length(2),
  }),
  shippingMethod: z.enum(["standard", "express"]),
  items: z.array(cartLineSchema).min(1).max(50),
  acceptsTerms: z.literal(true),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
