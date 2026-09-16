import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrdersEnabled, setOrdersEnabled } from "@/lib/commerce";
import { requireAdminRole } from "@/lib/auth/rbac";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import {
  getPaymentProvider,
  hasLivePaymentProvider,
  ordersBlockedByDemoPayments,
} from "@/lib/payments/provider";
import { auditLog } from "@/lib/security/audit";

export const runtime = "nodejs";

const patchSchema = z.object({
  ordersEnabled: z.boolean(),
});

export async function GET(request: Request) {
  const session = await requireAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const provider = getPaymentProvider().name;
  return NextResponse.json({
    ordersEnabled: await getOrdersEnabled(),
    paymentProvider: provider,
    canEnableOrders: !ordersBlockedByDemoPayments(),
    livePayments: hasLivePaymentProvider(),
  });
}

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) {
    auditLog({ event: "admin_settings_origin_rejected", level: "warn", outcome: "blocked" });
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const roleCheck = requireAdminRole(await requireAdminRequest(request));
  if (!roleCheck.ok) {
    return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    await setOrdersEnabled(parsed.data.ordersEnabled);
    return NextResponse.json({
      ordersEnabled: parsed.data.ordersEnabled,
      paymentProvider: getPaymentProvider().name,
      canEnableOrders: !ordersBlockedByDemoPayments(),
      livePayments: hasLivePaymentProvider(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update settings";
    const blockedDemo = message.includes("without Grow or Stripe");
    return NextResponse.json(
      { error: message, code: blockedDemo ? "demo_payments" : "settings_error" },
      { status: blockedDemo ? 409 : 503 },
    );
  }
}
