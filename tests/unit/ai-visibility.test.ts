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

  it("builds homepage JSON-LD with Organization, WebSite and offers", () => {
    const graph = homeJsonLdGraph("en", [sampleProduct]);
    const json = JSON.stringify(graph);
    expect(json).toContain('"@type":"Organization"');
    expect(json).toContain('"@type":"WebSite"');
    expect(json).toContain('"@type":"ItemList"');
    expect(json).toContain('"@type":"Offer"');
    expect(json).toContain(SITE_EMAIL);
    expect(json).toContain("sameAs");
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

  it("publishes an MCP server card with endpoint and auth header", () => {
    const card = mcpServerCard();
    expect(card.name).toContain("/");
    expect(card.remotes?.[0]?.url).toContain("/api/agent/mcp");
    expect(card.remotes?.[0]?.headers?.[0]?.name).toBe("Authorization");
  });

  it("keeps CMS probe blocking intact", () => {
    expect(isCmsProbePath("/wp-admin")).toBe(true);
  });
});
