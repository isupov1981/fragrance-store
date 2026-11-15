import { describe, expect, it } from "vitest";

import { prefersMarkdown } from "@/lib/seo/accept";
import { homeJsonLdGraph } from "@/lib/seo/home-json-ld";
import { buildHomeMarkdown, buildLlmsTxt } from "@/lib/seo/llms-txt";
import { mcpServerCard, SITE_EMAIL } from "@/lib/seo/site";
import { isCmsProbePath } from "@/lib/security/probe-paths";

const sampleProduct = {
  id: "1",
  name: "Test Fragrance",
  slug: "test-fragrance",
  brand: "Maison Test",
  description: "A test scent",
  category: "floral",
  featured: true,
  newArrival: false,
  images: ["https://example.com/a.jpg"],
  variants: [{ id: "v1", name: "50ml", sku: "T-50", price: 99000, stock: 3 }],
} as never;

describe("AI visibility helpers", () => {
  it("prefers markdown when Accept asks for it", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/html")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0.9, text/html;q=0.8")).toBe(true);
    expect(prefersMarkdown("text/html;q=1, text/markdown;q=0.1")).toBe(false);
  });

  it("builds homepage JSON-LD with Organization address and top-level offers", () => {
    const graph = homeJsonLdGraph("en", [sampleProduct]);
    const json = JSON.stringify(graph);
    expect(json).toContain("Organization");
    expect(json).toContain("OnlineStore");
    expect(json).toContain('"@type":"WebSite"');
    expect(json).toContain('"@type":"Product"');
    expect(json).toContain('"@type":"Offer"');
    expect(json).toContain('"@type":"PostalAddress"');
    expect(json).toContain("streetAddress");
    expect(json).toContain("addressCountry");
    expect(json).toContain(SITE_EMAIL);
    expect(json).toContain("sameAs");
    expect(
      graph["@graph"].some((node) => {
        const type = (node as { "@type"?: string | string[] })["@type"];
        return type === "Product" || (Array.isArray(type) && type.includes("Product"));
      }),
    ).toBe(true);
  });

  it("builds llms.txt and markdown homepage content", () => {
    const llms = buildLlmsTxt([sampleProduct]);
    expect(llms.startsWith("# The Perfume Room")).toBe(true);
    expect(llms).toContain("/en/collections/all");
    expect(llms).toContain("test-fragrance");

    const md = buildHomeMarkdown("en", [sampleProduct]);
    expect(md).toContain("mailto:orders@parfums.cloud");
    expect(md).toContain("From:");
  });

  it("publishes an MCP server card with capabilities and endpoint", () => {
    const card = mcpServerCard();
    expect(card.name).toContain("/");
    expect(card.capabilities?.tools?.listChanged).toBe(true);
    expect(card.transport?.endpoint).toContain("/api/agent/mcp");
    expect(card.authentication?.schemes).toContain("bearer");
    expect(card.remotes?.[0]?.url).toContain("/api/agent/mcp");
    expect(card.remotes?.[0]?.headers?.[0]?.name).toBe("Authorization");
  });

  it("keeps CMS probe blocking intact", () => {
    expect(isCmsProbePath("/wp-admin")).toBe(true);
  });
});
