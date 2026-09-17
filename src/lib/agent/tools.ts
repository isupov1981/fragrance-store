import { z } from "zod";

import { requireAgentToken } from "@/lib/agent/auth";
import {
  createDraftProduct,
  listAgentProducts,
  publishProduct,
  updateProduct,
} from "@/lib/agent/products";
import { AgentCatalogError } from "@/lib/agent/products";
import {
  createProductInputSchema,
  listProductsInputSchema,
  productLookupSchema,
  updateProductInputSchema,
} from "@/lib/agent/schema";
import { buildDailyBriefing, getDailyReport, getRecommendations, AgentReportError } from "@/lib/agent/reports";
import {
  generateProductVisual,
  GeminiImageError,
} from "@/lib/marketing/product-visual";
import { StorageError, storeImage } from "@/lib/storage";

export const agentTools = [
  {
    name: "create_product",
    description:
      "Create a DRAFT fragrance product. Prices are ILS agorot (32₪ = 3200). Sample sizes typically 1/3/5/10 ml at 3200/7900/11900/21900. Never publishes. Use merchandising for store menu placement: back-in-stock, testers-refills, additional-products.",
    inputSchema: {
      type: "object",
      required: ["name", "slug", "description", "variants"],
      properties: {
        name: { type: "string" },
        slug: { type: "string" },
        description: { type: "string", description: "English description" },
        descriptionHe: { type: "string" },
        brand: { type: "string" },
        category: { type: "string", description: "Olfactive family slug or name, e.g. woody / floral / amber / citrus" },
        merchandising: {
          type: "array",
          description: "Store Categories menu tags",
          items: { type: "string", enum: ["back-in-stock", "testers-refills", "additional-products"] },
        },
        concentration: { type: "string", enum: ["edp", "extrait"] },
        featured: { type: "boolean" },
        newArrival: { type: "boolean" },
        notes: { type: "array", items: { type: "string" } },
        images: {
          type: "array",
          items: {
            type: "object",
            required: ["url"],
            properties: { url: { type: "string" }, alt: { type: "string" } },
          },
        },
        variants: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "sku", "price"],
            properties: {
              name: { type: "string" },
              sku: { type: "string" },
              price: { type: "integer" },
              stock: { type: "integer" },
              compareAt: { type: "integer" },
            },
          },
        },
      },
    },
  },
  {
    name: "update_product",
    description:
      "Update an existing product by id or slug. Cannot set ACTIVE — use publish_product. Set merchandising to place the product in Categories: Back In Stock / Testers / Additional (pass [] to clear).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        slug: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        descriptionHe: { type: "string" },
        brand: { type: "string" },
        category: { type: "string", description: "Olfactive family" },
        merchandising: {
          type: "array",
          items: { type: "string", enum: ["back-in-stock", "testers-refills", "additional-products"] },
        },
        featured: { type: "boolean" },
        newArrival: { type: "boolean" },
        images: { type: "array" },
        variants: { type: "array" },
      },
    },
  },
  {
    name: "publish_product",
    description: "Publish a draft to the storefront (ACTIVE). Requires at least one image and one variant. Only after the admin explicitly asks to publish.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, slug: { type: "string" } },
    },
  },
  {
    name: "list_products",
    description: "List products, optionally filtered by status, merchandising tag, or search query.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        status: { type: "string", enum: ["DRAFT", "ACTIVE", "ARCHIVED"] },
        merchandising: {
          type: "string",
          enum: ["back-in-stock", "testers-refills", "additional-products"],
        },
        take: { type: "integer" },
      },
    },
  },
  {
    name: "upload_product_image",
    description: "Store a JPEG/PNG/WebP product image (base64, max 5 MB) and return its public URL for create_product/update_product.",
    inputSchema: {
      type: "object",
      required: ["data"],
      properties: {
        contentType: { type: "string", description: "image/jpeg, image/png or image/webp" },
        data: { type: "string", description: "Raw image bytes encoded as base64" },
      },
    },
  },
  {
    name: "generate_product_visual",
    description:
      "Beautify or flyer from an already-uploaded store imageUrl. REQUIRED: imageUrl from upload (never pass Telegram photo base64). Prefer running hermes/generate-visual-from-file.mjs on the VPS with the local Image attached path. Do not auto-publish.",
    inputSchema: {
      type: "object",
      required: ["mode", "imageUrl"],
      properties: {
        mode: { type: "string", enum: ["beautify", "flyer"] },
        imageUrl: {
          type: "string",
          description: "Public URL from multipart upload or upload_product_image",
        },
        productName: { type: "string" },
        brand: { type: "string" },
        priceLabel: {
          type: "string",
          description: "Human price text already known, e.g. ₪32–₪219 — never invent",
        },
        language: { type: "string", enum: ["he", "ru", "en"] },
        styleHint: { type: "string", description: "Optional mood, e.g. dark amber, floral soft" },
      },
    },
  },
  {
    name: "get_daily_report",
    description: "Orders, revenue, drafts and low stock for the last 24 hours.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_recommendations",
    description: "What to publish, restock, or fix in the catalogue.",
    inputSchema: { type: "object", properties: {} },
  },
] as const;

export type AgentToolName = (typeof agentTools)[number]["name"];

export async function dispatchAgentTool(name: string, args: unknown) {
  switch (name) {
    case "create_product":
      return createDraftProduct(createProductInputSchema.parse(args ?? {}));
    case "update_product":
      return updateProduct(updateProductInputSchema.parse(args ?? {}));
    case "publish_product":
      return publishProduct(productLookupSchema.parse(args ?? {}));
    case "list_products":
      return listAgentProducts(listProductsInputSchema.parse(args ?? {}));
    case "upload_product_image": {
      const payload = z
        .object({
          contentType: z.string().default("image/jpeg"),
          data: z.string().min(1),
        })
        .parse(args ?? {});
      const body = Buffer.from(payload.data, "base64");
      const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      return storeImage({
        body,
        contentType: payload.contentType,
        size: body.byteLength,
        origin,
      });
    }
    case "generate_product_visual": {
      const payload = z
        .object({
          mode: z.enum(["beautify", "flyer"]),
          imageUrl: z.string().url(),
          productName: z.string().optional(),
          brand: z.string().optional(),
          priceLabel: z.string().optional(),
          language: z.enum(["he", "ru", "en"]).optional(),
          styleHint: z.string().max(200).optional(),
        })
        .parse(args ?? {});
      return generateProductVisual(payload);
    }
    case "get_daily_report": {
      const report = await getDailyReport();
      const recs = await getRecommendations();
      return { ...report, briefing: buildDailyBriefing(report, recs) };
    }
    case "get_recommendations":
      return getRecommendations();
    default:
      throw new AgentCatalogError(`Unknown tool: ${name}`, 404);
  }
}

export function assertAgentRequest(request: Request) {
  if (!requireAgentToken(request)) {
    throw new AgentCatalogError("Unauthorized", 401);
  }
}

export function jsonAgentError(error: unknown) {
  if (error instanceof StorageError) {
    return { error: error.message, status: error.status };
  }
  if (error instanceof GeminiImageError) {
    return { error: error.message, status: error.status };
  }
  if (error instanceof AgentCatalogError || error instanceof AgentReportError) {
    return { error: error.message, status: error.status };
  }
  if (error instanceof z.ZodError) {
    return { error: "Invalid arguments", issues: error.issues, status: 400 };
  }
  console.error(error);
  return { error: "Agent request failed", status: 500 };
}
