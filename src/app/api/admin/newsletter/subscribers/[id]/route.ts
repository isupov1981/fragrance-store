import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRole } from "@/lib/auth/rbac";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import { deleteSubscriber, setSubscriberBlocked } from "@/lib/newsletter/subscribers";
import { auditLog } from "@/lib/security/audit";

export const runtime = "nodejs";

const patchSchema = z.object({
  blocked: z.boolean(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasSameOrigin(request)) {
    auditLog({ event: "admin_subscriber_patch_origin_rejected", level: "warn", outcome: "blocked" });
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const roleCheck = requireAdminRole(await requireAdminRequest(request));
  if (!roleCheck.ok) {
    return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
  }

  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const subscriber = await setSubscriberBlocked(id, parsed.data.blocked);
  if (!subscriber) {
    return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
  }

  auditLog({
    event: parsed.data.blocked ? "admin_subscriber_block" : "admin_subscriber_unblock",
    level: "info",
    outcome: "success",
    meta: { id: subscriber.id, email: subscriber.email },
  });

  return NextResponse.json({ subscriber });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasSameOrigin(request)) {
    auditLog({ event: "admin_subscriber_delete_origin_rejected", level: "warn", outcome: "blocked" });
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const roleCheck = requireAdminRole(await requireAdminRequest(request));
  if (!roleCheck.ok) {
    return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
  }

  const { id } = await context.params;
  const deleted = await deleteSubscriber(id);
  if (!deleted) {
    return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
  }

  auditLog({
    event: "admin_subscriber_delete",
    level: "info",
    outcome: "success",
    meta: { id },
  });

  return NextResponse.json({ ok: true });
}
