import { getSocialLinks } from "@/lib/social";
import { SITE_VERSION } from "@/lib/version";

export const SITE_NAME = "The Perfume Room";
export const SITE_LEGAL_NAME = "The Perfume Room";
export const SITE_EMAIL = "orders@parfums.cloud";
export const SITE_PHONE_E164 = "+972535324510";
export const SITE_PHONE_DISPLAY = "+972 53-532-4510";
export const SITE_WHATSAPP = "972535324510";

/** Public business address used in Organization JSON-LD (overridable via env). */
export function siteAddress() {
  return {
    streetAddress:
      process.env.NEXT_PUBLIC_BUSINESS_STREET?.trim() || "Online fragrance boutique",
    addressLocality: process.env.NEXT_PUBLIC_BUSINESS_CITY?.trim() || "Tel Aviv",
    postalCode: process.env.NEXT_PUBLIC_BUSINESS_POSTAL?.trim() || "6100000",
    addressCountry: process.env.NEXT_PUBLIC_BUSINESS_COUNTRY?.trim() || "IL",
  };
}

export function siteBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://parfums.cloud").replace(/\/$/, "");
}

export function siteSameAs() {
  return getSocialLinks()
    .map((link) => link.href)
    .filter((href, index, all) => Boolean(href) && all.indexOf(href) === index);
}

export function organizationDescription() {
  return "Niche fragrance boutique selling rare and carefully chosen perfumes online, with shipping in Israel and worldwide.";
}

export function mcpEndpointUrl() {
  return `${siteBaseUrl()}/api/agent/mcp`;
}

/**
 * Dual-shaped MCP Server Card:
 * - SEP-1649 fields (`capabilities`, `transport`, `serverInfo`) for well-known checkers
 * - SEP-2127 `remotes` for newer clients
 */
export function mcpServerCard() {
  const endpoint = mcpEndpointUrl();
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: "2025-06-18",
    name: "parfums.cloud/perfume-room-agent",
    title: SITE_NAME,
    description: "Catalogue and operations tools for The Perfume Room fragrance store.",
    websiteUrl: siteBaseUrl(),
    serverInfo: {
      name: "parfums.cloud/perfume-room-agent",
      title: SITE_NAME,
      version: SITE_VERSION,
    },
    transport: {
      type: "streamable-http",
      endpoint,
    },
    capabilities: {
      tools: { listChanged: true },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false },
    },
    authentication: {
      required: true,
      schemes: ["bearer"],
    },
    tools: ["dynamic"],
    resources: [],
    prompts: [],
    remotes: [
      {
        type: "streamable-http" as const,
        url: endpoint,
        headers: [
          {
            name: "Authorization",
            description: "Bearer token from HERMES_AGENT_TOKEN / agent API credentials.",
            isRequired: true,
            isSecret: true,
          },
        ],
        supportedProtocolVersions: ["2025-06-18", "2025-03-26"],
      },
    ],
    _meta: {
      "parfums.cloud/capabilities": {
        tools: true,
        resources: false,
        prompts: false,
        publicDiscovery: true,
      },
    },
  };
}
