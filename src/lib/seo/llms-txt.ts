import type { StoreProduct } from "@/lib/catalog";
import { formatMoney, isCurrency, defaultCurrency } from "@/lib/currency";
import {
  organizationDescription,
  SITE_EMAIL,
  SITE_NAME,
  SITE_PHONE_DISPLAY,
  siteBaseUrl,
} from "@/lib/seo/site";

function currency() {
  const configured = process.env.NEXT_PUBLIC_STORE_CURRENCY;
  return isCurrency(configured) ? configured : defaultCurrency;
}

export function buildLlmsTxt(products: StoreProduct[] = []) {
  const base = siteBaseUrl();
  const cur = currency();
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${organizationDescription()} Contact: ${SITE_EMAIL}, WhatsApp/tel ${SITE_PHONE_DISPLAY}.`,
    "",
    "Online niche fragrance storefront for The Perfume Room (parfums.cloud).",
    "Catalogue pages are public. Checkout and admin APIs require a human session or agent token.",
    "Content preference: search indexing allowed; AI training disallowed (see /robots.txt Content-Signal).",
    "",
    "## Primary pages",
    "",
    `- [Home](${base}/en): Store homepage`,
    `- [All fragrances](${base}/en/collections/all): Full catalogue`,
    `- [Brands](${base}/en/brands): Houses in the collection`,
    `- [About](${base}/en/about): About The Perfume Room`,
    `- [Contact](${base}/en/contact): Customer care`,
    `- [FAQ](${base}/en/faq): Shipping and ordering questions`,
    `- [Shipping](${base}/en/shipping): Delivery information`,
    "",
    "## Locales",
    "",
    `- [English](${base}/en)`,
    `- [Hebrew](${base}/he)`,
    `- [Russian](${base}/ru)`,
    "",
    "## Agent interfaces",
    "",
    `- [llms.txt](${base}/llms.txt): This file`,
    `- [MCP server card](${base}/.well-known/mcp/server-card.json): MCP discovery (also ${base}/server-card)`,
    `- [MCP endpoint](${base}/api/agent/mcp): Authenticated MCP tools (Bearer token)`,
    `- Markdown: request homepage with \`Accept: text/markdown\``,
    "",
    "## Contact",
    "",
    `- Email: [${SITE_EMAIL}](mailto:${SITE_EMAIL})`,
    `- Phone / WhatsApp: [${SITE_PHONE_DISPLAY}](tel:${SITE_PHONE_DISPLAY.replace(/[^\d+]/g, "")})`,
    "",
  ];

  if (products.length) {
    lines.push("## Featured products", "");
    for (const product of products.slice(0, 12)) {
      const variant = product.variants[0];
      const price = variant ? formatMoney(variant.price, cur) : "price on request";
      lines.push(
        `- [${product.brand} — ${product.name}](${base}/en/products/${product.slug}): from ${price}`,
      );
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

export function buildHomeMarkdown(locale: string, products: StoreProduct[]) {
  const base = siteBaseUrl();
  const cur = currency();
  const lines = [
    `# ${SITE_NAME}`,
    "",
    organizationDescription(),
    "",
    `Locale: ${locale}`,
    `Contact: [${SITE_EMAIL}](mailto:${SITE_EMAIL}) · [${SITE_PHONE_DISPLAY}](tel:+972535324510)`,
    `Catalogue: [${base}/${locale}/collections/all](${base}/${locale}/collections/all)`,
    "",
    "## Featured fragrances",
    "",
  ];
  for (const product of products.slice(0, 12)) {
    const variant = product.variants[0];
    const price = variant ? formatMoney(variant.price, cur) : "price on request";
    lines.push(`### ${product.name}`);
    lines.push("");
    lines.push(`- Brand: ${product.brand}`);
    lines.push(`- From: ${price}`);
    lines.push(`- URL: ${base}/${locale}/products/${product.slug}`);
    lines.push("");
  }
  lines.push("## More");
  lines.push("");
  lines.push(`- [llms.txt](${base}/llms.txt)`);
  lines.push(`- [About](${base}/${locale}/about)`);
  lines.push(`- [Contact](${base}/${locale}/contact)`);
  lines.push("");
  return `${lines.join("\n").trim()}\n`;
}
