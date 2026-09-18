import { NextResponse } from "next/server";

import { requireAdminRole } from "@/lib/auth/rbac";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import {
  blastUnannouncedNewArrivals,
  clearNewArrivalAnnouncement,
  countUnannouncedNewArrivals,
} from "@/lib/email/new-arrivals";
import { isSmtpConfigured, probeSmtp } from "@/lib/email/mailer";
import { listActiveSubscribers } from "@/lib/newsletter/subscribers";
import { auditLog } from "@/lib/security/audit";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const session = await requireAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [pendingProducts, subscribers, smtpError] = await Promise.all([
    countUnannouncedNewArrivals(),
    listActiveSubscribers(),
    probeSmtp(),
  ]);

  return NextResponse.json({
    pendingProducts,
    subscribers: subscribers.length,
    smtpConfigured: isSmtpConfigured(),
    smtpOk: !smtpError,
    smtpError,
  });
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    auditLog({ event: "admin_newsletter_blast_origin_rejected", level: "warn", outcome: "blocked" });
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const roleCheck = requireAdminRole(await requireAdminRequest(request));
  if (!roleCheck.ok) {
    return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json({ error: "SMTP is not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { retrySlug?: string } | null;
  if (body?.retrySlug?.trim()) {
    await clearNewArrivalAnnouncement(body.retrySlug.trim());
  }

  try {
    const result = await blastUnannouncedNewArrivals();
    const allFailed =
      result.emailsAttempted > 0 && result.emailsFailed === result.emailsAttempted;
    auditLog({
      event: "admin_newsletter_new_arrivals_blast",
      level: allFailed ? "warn" : "info",
      outcome: allFailed ? "failure" : "success",
      meta: {
        products: result.products,
        emailsAttempted: result.emailsAttempted,
        emailsFailed: result.emailsFailed,
        lastError: result.lastError,
      },
    });
    return NextResponse.json(result, { status: allFailed ? 502 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send newsletter blast";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
