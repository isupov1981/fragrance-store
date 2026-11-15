import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/lib/auth/server";
import { getTrafficSummary } from "@/lib/security/traffic";

export const runtime = "nodejs";

/** Recent traffic classification for operators (no raw IPs). */
export async function GET(request: Request) {
  const session = await requireAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const hours = Number(url.searchParams.get("hours") || "6");
  const windowMs = Math.min(24, Math.max(1, Number.isFinite(hours) ? hours : 6)) * 3_600_000;
  return NextResponse.json(getTrafficSummary(windowMs));
}
