import { siteBaseUrl } from "@/lib/seo/site";

export const runtime = "nodejs";

export function GET() {
  const base = siteBaseUrl();
  const body = [
    "User-agent: *",
    "Content-Signal: search=yes, ai-train=no, ai-input=yes",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Disallow: /*/checkout",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
