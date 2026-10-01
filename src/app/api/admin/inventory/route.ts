import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminRole } from "@/lib/auth/rbac";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import {
  applyInventoryChanges,
  getInventoryOverview,
  InsufficientStockError,
  InventoryConflictError,
} from "@/lib/inventory/service";
import { auditLog } from "@/lib/security/audit";

export const runtime = "nodejs";

const changeSchema = z.object({
  variantId: z.string().min(1),
  mode: z.enum(["set", "adjust"]),
  value: z.number().int().min(-1_000_000).max(1_000_000),
  expectedUpdatedAt: z.iso.datetime().optional(),
});

async function authorize(request: Request) {
  return requireAdminRole(await requireAdminRequest(request));
}

export async function GET(request: Request) {
  const auth = await authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ data: await getInventoryOverview() });
}

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const auth = await authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const input = z
      .object({
        changes: z.array(changeSchema).min(1).max(100),
        note: z.string().trim().max(500).optional(),
      })
      .parse(await request.json());
    const data = await applyInventoryChanges(
      input.changes,
      { id: auth.session.sub, name: auth.session.name },
      input.note,
    );
    auditLog({
      event: "admin_inventory_updated",
      outcome: "success",
      meta: {
        actor: auth.session.sub,
        variants: input.changes.map((change) => change.variantId).join(","),
      },
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid inventory change", issues: error.issues },
        { status: 400 },
      );
    }
    if (
      error instanceof InventoryConflictError ||
      error instanceof InsufficientStockError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
