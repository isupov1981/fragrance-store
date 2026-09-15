import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrdersEnabled, setOrdersEnabled } from "@/lib/commerce";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";

export const runtime = "nodejs";

const patchSchema = z.object({
  ordersEnabled: z.boolean(),
});

export async function GET(request: Request) {
  if (!(await requireAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ordersEnabled: await getOrdersEnabled() });
}

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  if (!(await requireAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    await setOrdersEnabled(parsed.data.ordersEnabled);
    return NextResponse.json({ ordersEnabled: parsed.data.ordersEnabled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update settings";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
