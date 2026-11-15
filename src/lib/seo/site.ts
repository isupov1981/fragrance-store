import { getSocialLinks } from "@/lib/social";
import { SITE_VERSION } from "@/lib/version";

export const SITE_NAME = "The Perfume Room";
export const SITE_LEGAL_NAME = "The Perfume Room";
export const SITE_EMAIL = "orders@parfums.cloud";
export const SITE_PHONE_E164 = "+972535324510";
export const SITE_PHONE_DISPLAY = "+972 53-532-4510";
export const SITE_WHATSAPP = "972535324510";

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

export function mcpServerCard() {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: "parfums.cloud/perfume-room-agent",
    version: SITE_VERSION,
    description: "Catalogue and operations tools for The Perfume Room fragrance store.",
    title: SITE_NAME,
    websiteUrl: siteBaseUrl(),
    remotes: [
      {
        type: "streamable-http" as const,
        url: mcpEndpointUrl(),
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
