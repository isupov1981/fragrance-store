import { NextResponse } from "next/server";

import { auditLog } from "@/lib/security/audit";
import { recordRequestTraffic } from "@/lib/security/traffic";

export const runtime = "nodejs";

/**
 * Rewrite target for CMS probe paths blocked in proxy.
 * Records a scanner sample (no PII) and returns 404 without hitting the App Router.
 */
async function handle(request: Request) {
  const url = new URL(request.url);
  const probedPath = url.searchParams.get("path") || "/blocked";
  recordRequestTraffic(request, {
    pathname: probedPath,
    forcedClass: "scanner",
    status: 404,
  });
  auditLog({
    event: "cms_probe_blocked",
    level: "info",
    outcome: "blocked",
    meta: {
      path: probedPath.slice(0, 96),
      method: request.method,
    },
  });
  return new NextResponse(null, {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      "X-Traffic-Class": "scanner",
    },
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
