import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/lib/auth/server";
import { collectReadiness } from "@/lib/health/readiness";
import { safeEqualString } from "@/lib/security/timing-safe";

export const runtime = "nodejs";

/**
 * Detailed readiness for operators.
 * Allowed with an admin session cookie or HEALTH_CHECK_TOKEN bearer.
 */
export async function GET(request: Request) {
  const session = await requireAdminRequest(request);
  if (!session && !authorizedByHealthToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await collectReadiness());
}

function authorizedByHealthToken(request: Request) {
  const expected = process.env.HEALTH_CHECK_TOKEN?.trim();
  if (!expected || expected.length < 24) return false;
  const header = request.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  return safeEqualString(provided, expected);
}
