import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRole } from "@/lib/auth/rbac";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import { locales } from "@/lib/i18n/config";
import {
  createSubscriber,
  listAllSubscribers,
} from "@/lib/newsletter/subscribers";
import { auditLog } from "@/lib/security/audit";

export const runtime = "nodejs";

const createSchema = z.object({
  email: z.email(),
  locale: z.enum(locales).optional(),
});

export async function GET(request: Request) {
  const session = await requireAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await listAllSubscribers();
  return NextResponse.json({ subscribers });
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    auditLog({ event: "admin_subscriber_create_origin_rejected", level: "warn", outcome: "blocked" });
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const roleCheck = requireAdminRole(await requireAdminRequest(request));
  if (!roleCheck.ok) {
    return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email", issues: parsed.error.issues }, { status: 400 });
  }

  try {
        const subscriber = await createSubscriber({ ...parsed.data, consentSource: "admin" });
    auditLog({
      event: "admin_subscriber_create",
      level: "info",
      outcome: "success",
      meta: { id: subscriber.id, email: subscriber.email },
    });
    return NextResponse.json({ subscriber }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add subscriber";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
