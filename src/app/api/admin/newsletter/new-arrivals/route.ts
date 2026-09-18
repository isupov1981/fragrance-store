import { NextResponse } from "next/server";

import { requireAdminRole } from "@/lib/auth/rbac";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import {
  blastUnannouncedNewArrivals,
  countUnannouncedNewArrivals,
} from "@/lib/email/new-arrivals";
import { isSmtpConfigured } from "@/lib/email/mailer";
import { listActiveSubscribers } from "@/lib/newsletter/subscribers";
import { auditLog } from "@/lib/security/audit";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const session = await requireAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [pendingProducts, subscribers] = await Promise.all([
    countUnannouncedNewArrivals(),
    listActiveSubscribers(),
  ]);

  return NextResponse.json({
    pendingProducts,
    subscribers: subscribers.length,
    smtpConfigured: isSmtpConfigured(),
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

  try {
    const result = await blastUnannouncedNewArrivals();
    auditLog({
      event: "admin_newsletter_new_arrivals_blast",
      level: "info",
      outcome: "success",
      meta: {
        products: result.products,
        emailsAttempted: result.emailsAttempted,
        emailsFailed: result.emailsFailed,
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send newsletter blast";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
