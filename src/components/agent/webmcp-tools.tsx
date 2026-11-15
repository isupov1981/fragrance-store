"use client";

import { useEffect } from "react";

import {
  SITE_EMAIL,
  SITE_NAME,
  SITE_PHONE_E164,
  siteBaseUrl,
} from "@/lib/seo/site";

export type WebMcpProduct = {
  name: string;
  brand: string;
  slug: string;
  priceLabel: string;
  url: string;
};

type ModelContextTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<string> | string;
};

type ModelContextApi = {
  registerTool: (tool: ModelContextTool) => Promise<unknown> | unknown;
};

function getModelContext(): ModelContextApi | null {
  if (typeof window === "undefined") return null;
  const fromDocument = (document as Document & { modelContext?: ModelContextApi }).modelContext;
  if (fromDocument?.registerTool) return fromDocument;
  const fromNavigator = (navigator as Navigator & { modelContext?: ModelContextApi }).modelContext;
  if (fromNavigator?.registerTool) return fromNavigator;
  return null;
}

export function WebMcpTools({
  locale,
  products,
}: {
  locale: string;
  products: WebMcpProduct[];
}) {
  useEffect(() => {
    const ctx = getModelContext();
    if (!ctx) return;

    const base = siteBaseUrl();
    let cancelled = false;

    async function register() {
      const tools: ModelContextTool[] = [
        {
          name: "get_store_info",
          description: `Return identity and contact details for ${SITE_NAME}.`,
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          execute: async () =>
            JSON.stringify({
              name: SITE_NAME,
              url: base,
              locale,
              email: SITE_EMAIL,
              telephone: SITE_PHONE_E164,
              catalogue: `${base}/${locale}/collections/all`,
              llmsTxt: `${base}/llms.txt`,
              mcpServerCard: `${base}/.well-known/mcp/server-card.json`,
            }),
        },
        {
          name: "list_featured_fragrances",
          description: "List featured fragrances currently shown on the homepage, with prices.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          execute: async () => JSON.stringify({ products }),
        },
        {
          name: "find_fragrance",
          description: "Find a featured fragrance by name or brand substring.",
          inputSchema: {
            type: "object",
            required: ["query"],
            properties: {
              query: { type: "string", description: "Name or brand fragment" },
            },
            additionalProperties: false,
          },
          execute: async (input) => {
            const query = String(input.query || "")
              .trim()
              .toLowerCase();
            const matches = products.filter(
              (product) =>
                product.name.toLowerCase().includes(query) ||
                product.brand.toLowerCase().includes(query) ||
                product.slug.toLowerCase().includes(query),
            );
            return JSON.stringify({ query, matches });
          },
        },
      ];

      for (const tool of tools) {
        if (cancelled) return;
        try {
          await ctx!.registerTool(tool);
        } catch {
          /* Duplicate registration or unsupported browser — ignore. */
        }
      }
    }

    void register();
    return () => {
      cancelled = true;
    };
  }, [locale, products]);

  return null;
}
