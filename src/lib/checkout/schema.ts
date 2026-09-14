import { z } from "zod";

import { ISO_COUNTRY_CODES } from "@/lib/i18n/countries";

const countryCodes: readonly string[] = ISO_COUNTRY_CODES;

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(16).max(128),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email(),
    phone: z.string().trim().max(30).optional(),
    addressLine1: z.string().trim().min(3).max(150),
    addressLine2: z.string().trim().max(150).optional(),
    city: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(2).max(20),
    country: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine((value) => countryCodes.includes(value), { message: "Invalid country code" }),
  }),
  shippingMethod: z.enum(["standard", "express"]),
  currency: z.enum(["USD", "EUR", "ILS"]).default("USD"),
  locale: z.enum(["en", "he"]).default("en"),
  acceptsTerms: z.literal(true),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
