import { mcpServerCard } from "@/lib/seo/site";

export const runtime = "nodejs";

/** SEP-2127 recommended MCP Server Card location. */
export function GET() {
  return Response.json(mcpServerCard(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
